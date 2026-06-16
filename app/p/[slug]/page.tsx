import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = prisma ? await (prisma as any).sitePage.findUnique({ where: { slug, published: true } }) : null;
  if (!page) return { title: "Page introuvable" };
  return { title: `${page.title} — VIBEATHON 2026`, description: page.description || undefined };
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!prisma) notFound();

  const page = await (prisma as any).sitePage.findUnique({ where: { slug, published: true } });
  if (!page) notFound();

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", padding: "80px 20px 60px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 900, color: "#fff", marginBottom: 8 }}>
          {page.title}
        </h1>
        {page.description ? (
          <p style={{ color: "#999", fontSize: 17, marginBottom: 40 }}>{page.description}</p>
        ) : null}
        <div
          className="prose-page"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
    </main>
  );
}
