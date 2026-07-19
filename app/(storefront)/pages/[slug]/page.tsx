import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

interface StaticContentPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: StaticContentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.pageContent.findUnique({ where: { slug } });
  if (!page || !page.published) return {};

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.summary,
  };
}

export default async function StaticContentPage({ params }: StaticContentPageProps) {
  const { slug } = await params;
  const page = await prisma.pageContent.findUnique({ where: { slug } });

  if (!page || !page.published) {
    notFound();
  }

  return (
    <main className="simple-page">
      <section className="simple-hero">
        <h1>{page.title}</h1>
        <p>{page.summary}</p>
      </section>

      <div className="page-content-body" dangerouslySetInnerHTML={{ __html: page.body }} />
    </main>
  );
}
