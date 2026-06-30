import { db } from "@/lib/db";
import type { HeroSlide } from "@/lib/cms";

export async function getHeroSlides(): Promise<HeroSlide[]> {
  const block = await db.homepageBlock.findUnique({ where: { key: "hero" } });
  const config = (block?.config as { slides?: HeroSlide[] } | null) ?? {};
  return Array.isArray(config.slides) ? config.slides : [];
}

export async function getFeaturedTestimonials(limit = 3) {
  return db.testimonial.findMany({
    where: { isFeatured: true },
    take: limit,
    orderBy: { id: "asc" },
  });
}

export async function getVisibleHomepageBlocks() {
  return db.homepageBlock.findMany({
    where: { isVisible: true },
    orderBy: { position: "asc" },
  });
}

export async function getAllHomepageBlocks() {
  return db.homepageBlock.findMany({ orderBy: { position: "asc" } });
}

export async function getBlogPosts(includeScheduled = false) {
  return db.blogPost.findMany({
    where: includeScheduled ? {} : { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getBlogPostBySlug(slug: string) {
  return db.blogPost.findUnique({ where: { slug } });
}

export async function getPageBySlug(slug: string) {
  return db.page.findUnique({ where: { slug } });
}

export async function getPublishedPages() {
  return db.page.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { title: "asc" },
  });
}

export async function getFaqs() {
  return db.faq.findMany({ orderBy: { position: "asc" } });
}
