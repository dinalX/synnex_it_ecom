import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, CheckCircle2, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { AddProductButton } from "@/components/add-product-button";
import { ProductGallery } from "@/components/product-gallery";
import { fetchProduct, fetchProducts } from "@/lib/data";
import { formatCurrency } from "@/lib/api-client";
import { siteConfig } from "@/lib/site";
import { prisma } from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await fetchProduct(slug);
    if (!product) return {};
    return {
      title: product.name,
      description: product.description,
      alternates: { canonical: `${siteConfig.url}/products/${product.slug}` },
      openGraph: {
        title: product.name,
        description: product.description,
        url: `${siteConfig.url}/products/${product.slug}`,
        images: [{ url: product.image, alt: product.name }],
      },
    };
  } catch {
    return {};
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) notFound();

  const dbImages = await prisma.productImage.findMany({
    where: { productId: product.id },
    orderBy: { sortOrder: "asc" },
  });

  const galleryImages = dbImages.map((img) => ({ id: img.id, url: img.url, alt: img.alt || product.name }));
  // product.image usually duplicates the first gallery row — only prepend it when it's a distinct photo.
  const allImages =
    product.image && !galleryImages.some((img) => img.url === product.image)
      ? [{ id: "main", url: product.image, alt: product.name }, ...galleryImages]
      : galleryImages;

  const { products: allProducts } = await fetchProducts({});
  const sameCategory = allProducts.filter((item) => item.category === product.category && item.id !== product.id);
  const otherProducts = allProducts.filter((item) => item.category !== product.category && item.id !== product.id);
  const related = [...sameCategory, ...otherProducts].slice(0, 4);

  const specs = product.specs.split(",").map((s: string) => s.trim()).filter(Boolean);

  // Short description: from DB field, fallback to first sentence
  const shortDesc = product.shortDescription
    || (product.description.includes(".")
      ? product.description.split(".")[0] + "."
      : product.description.slice(0, 160) + (product.description.length > 160 ? "..." : ""));

  return (
    <main className="product-detail-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <ChevronRight size={14} />
        <Link href="/products">Products</Link>
        <ChevronRight size={14} />
        <span aria-current="page">{product.name}</span>
      </nav>
      <section className="product-detail">
        <ProductGallery images={allImages} productName={product.name} />

        <div className="product-detail-copy">
          <div>
            <p className="eyebrow">{product.category}</p>
            <h1>{product.name}</h1>
          </div>

          <div className="product-detail-price-wrap">
            <strong>{formatCurrency(product.price)}</strong>
            {product.compareAt ? <del>{formatCurrency(product.compareAt)}</del> : null}
            <span className="product-detail-rating" style={{ marginLeft: "auto", color: "var(--amber)", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.9rem", fontWeight: 700 }}>
              <Star size={14} fill="currentColor" />
              {product.rating}
            </span>
          </div>

          <div className="product-description">
            <h4>Description</h4>
            <p>{shortDesc}</p>
          </div>

          <div className="product-purchase-section">
            <AddProductButton product={product} />
            <p className="stock-note">
              <CheckCircle2 size={14} />
              {product.inventory > 0 ? "In Stock & Ready to Ship" : "Out of Stock - Contact us for availability"}
            </p>
          </div>

          {specs.length > 0 && (
            <div className="product-specs">
              <h4>Specifications</h4>
              <div className="spec-list">
                {specs.map((spec: string, i: number) => (
                  <div key={i} className="spec-item">
                    <CheckCircle2 size={16} />
                    <span>{spec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="product-long-description">
        <div className="container">
          <div className="section-heading">
            <h2>Product Details</h2>
          </div>
          <div className="long-description-content">
            <p>{product.description}</p>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="related-products">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Keep browsing</p>
              <h2>Related picks</h2>
            </div>
          </div>
          <div className="related-grid">
            {related.map((item) => (
              <ProductCard product={item} key={item.id} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
