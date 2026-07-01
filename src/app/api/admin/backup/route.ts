import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Super-admin content backup: exports CMS + catalogue data as a JSON snapshot. */
export async function GET() {
  const session = await getSession();
  if (session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [products, categories, collections, pages, blogPosts, testimonials, faqs, settings, homepageBlocks, redirects] =
    await Promise.all([
      db.product.findMany(),
      db.category.findMany(),
      db.collection.findMany(),
      db.page.findMany(),
      db.blogPost.findMany(),
      db.testimonial.findMany(),
      db.faq.findMany(),
      db.setting.findMany(),
      db.homepageBlock.findMany(),
      db.redirect.findMany(),
    ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    counts: {
      products: products.length,
      categories: categories.length,
      collections: collections.length,
      pages: pages.length,
      blogPosts: blogPosts.length,
      testimonials: testimonials.length,
      faqs: faqs.length,
      settings: settings.length,
      homepageBlocks: homepageBlocks.length,
      redirects: redirects.length,
    },
    data: { products, categories, collections, pages, blogPosts, testimonials, faqs, settings, homepageBlocks, redirects },
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="sapphire-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
