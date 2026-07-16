"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "@/app/admin/products/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface ProductFormProps {
  initialData?: {
    id?: string;
    name: string;
    slug?: string;
    category: string;
    price: number;
    compareAt?: number;
    inventory: number;
    sku?: string;
    image: string;
    accent: string;
    description: string;
    shortDescription?: string;
    specs: string;
    published: boolean;
  };
  onSuccess?: () => void;
}

export function ProductForm({ initialData, onSuccess }: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState(initialData?.image || "");
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        body,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Upload failed");
      }
      setImageUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (initialData?.id) {
        await updateProduct(initialData.id, formData);
      } else {
        await createProduct(formData);
      }
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (e: any) {
      setError(e.message || "An error occurred while saving the product");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form action={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 md:col-span-2">{error}</p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="product-name">Name</Label>
        <Input id="product-name" name="name" required defaultValue={initialData?.name} placeholder="e.g. POS Thermal Printer" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="product-slug">Slug</Label>
        <Input id="product-slug" name="slug" defaultValue={initialData?.slug} placeholder="Optional — leave blank to keep current slug" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="product-category">Category</Label>
        <Input id="product-category" name="category" required defaultValue={initialData?.category} placeholder="e.g. POS Solution" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="product-price">Price (LKR)</Label>
        <Input id="product-price" name="price" type="number" required defaultValue={initialData?.price} placeholder="0" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="product-compare-at">Compare at price (LKR)</Label>
        <Input id="product-compare-at" name="compareAt" type="number" defaultValue={initialData?.compareAt} placeholder="Optional" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="product-inventory">Inventory</Label>
        <Input id="product-inventory" name="inventory" type="number" required defaultValue={initialData?.inventory} placeholder="0" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="product-sku">SKU</Label>
        <Input id="product-sku" name="sku" defaultValue={initialData?.sku} placeholder="Optional" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="product-accent">Accent color</Label>
        <input
          id="product-accent"
          name="accent"
          type="color"
          defaultValue={initialData?.accent || "#1f8a70"}
          className="h-9 w-full rounded-md border border-input"
        />
      </div>

      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor="product-image">Image</Label>
        <Input
          id="product-image"
          name="image"
          required
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="/uploads/products/photo.jpg"
        />
        <div className="flex items-center gap-3">
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={handleImageUpload} disabled={isUploading} />
          {isUploading ? <span className="text-sm text-muted-foreground">Uploading…</span> : null}
        </div>
      </div>

      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor="product-short-description">Short description</Label>
        <Textarea id="product-short-description" name="shortDescription" defaultValue={initialData?.shortDescription} placeholder="Brief product summary (shown on product cards)" rows={2} />
      </div>

      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor="product-description">Description</Label>
        <Textarea id="product-description" name="description" required defaultValue={initialData?.description} placeholder="Product description..." />
      </div>

      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor="product-specs">Specifications (Markdown or plain text)</Label>
        <Textarea id="product-specs" name="specs" required defaultValue={initialData?.specs} placeholder={"Weight: 1.2kg\nDimensions: 10x10x10cm"} />
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground md:col-span-2">
        <Checkbox name="published" defaultChecked={initialData?.published ?? true} />
        Published to store
      </label>

      <div className="md:col-span-2">
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : initialData?.id ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
