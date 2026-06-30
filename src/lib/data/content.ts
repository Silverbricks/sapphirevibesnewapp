import { db } from "@/lib/db";
import type { HeroSlide } from "@/lib/cms";

export async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    const block = await db.homepageBlock.findUnique({ where: { key: "hero" } });
    const config = (block?.config as { slides?: HeroSlide[] } | null) ?? {};
    return Array.isArray(config.slides) ? config.slides : [];
  } catch {
    return [];
  }
}

export interface AnnouncementConfig {
  text?: string;
  ctaHref?: string | null;
  enabled?: boolean;
}

export async function getAnnouncement(): Promise<AnnouncementConfig | null> {
  // Used in the shared storefront layout — degrade gracefully so a DB blip
  // can't 500 the entire site (falls back to the static SITE.announcement).
  try {
    const s = await db.setting.findUnique({ where: { key: "announcement" } });
    return (s?.value as AnnouncementConfig | null) ?? null;
  } catch {
    return null;
  }
}

/** Set of homepage-block keys currently toggled visible (drives storefront section show/hide). */
export async function getVisibleBlockKeys(): Promise<Set<string>> {
  try {
    const blocks = await db.homepageBlock.findMany({ where: { isVisible: true }, select: { key: true } });
    return new Set(blocks.map((b) => b.key));
  } catch {
    return new Set();
  }
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
