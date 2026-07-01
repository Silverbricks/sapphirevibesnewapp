import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { getBaseUrl } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl();
  const staticRoutes = ["", "/new-arrivals", "/lighting", "/rooms", "/collections", "/gifts", "/sale", "/blog"].map((p) => ({
    url: `${base}${p || "/"}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  try {
    const [products, pages, posts, categories, collections] = await Promise.all([
      db.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
      db.page.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
      db.blogPost.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, createdAt: true } }),
      db.category.findMany({ select: { slug: true } }),
      db.collection.findMany({ select: { slug: true } }),
    ]);

    return [
      ...staticRoutes,
      ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updatedAt, priority: 0.8 })),
      ...pages.map((p) => ({ url: `${base}/pages/${p.slug}`, lastModified: p.updatedAt, priority: 0.5 })),
      ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.createdAt, priority: 0.6 })),
      ...categories.map((c) => ({ url: `${base}/shop/${c.slug}`, priority: 0.6 })),
      ...collections.map((c) => ({ url: `${base}/collections/${c.slug}`, priority: 0.6 })),
    ];
  } catch {
    return staticRoutes;
  }
}
