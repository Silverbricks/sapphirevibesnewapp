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

export interface PromoBannerConfig {
  image?: string | null;
  eyebrow?: string | null;
  heading?: string;
  desc?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
}

/** Promotional banner content, stored in the `promo` homepage block's config JSON. */
export async function getPromoBanner(): Promise<PromoBannerConfig | null> {
  try {
    const block = await db.homepageBlock.findUnique({ where: { key: "promo" } });
    return (block?.config as PromoBannerConfig | null) ?? null;
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

/** Public storefront view: published posts + scheduled posts whose time has passed. */
function publishedWhere() {
  return {
    OR: [
      { status: "PUBLISHED" as const },
      { status: "SCHEDULED" as const, publishedAt: { lte: new Date() } },
    ],
  };
}

export async function getBlogPosts(includeScheduled = false) {
  return db.blogPost.findMany({
    where: includeScheduled ? {} : publishedWhere(),
    orderBy: { publishedAt: "desc" },
  });
}

export async function getBlogPostBySlug(slug: string) {
  // hide drafts and not-yet-due scheduled posts from public direct links
  return db.blogPost.findFirst({ where: { slug, ...publishedWhere() } });
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

// ───────────────────────── Admin content CMS ─────────────────────────

export async function getAllBlogPosts() {
  return db.blogPost.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: { _count: { select: { comments: true } } },
  });
}

export async function getBlogPostById(id: string) {
  return db.blogPost.findUnique({ where: { id } });
}

export async function getAllPages() {
  return db.page.findMany({ orderBy: { title: "asc" } });
}

export async function getPageById(id: string) {
  return db.page.findUnique({ where: { id } });
}

export async function getAllTestimonials() {
  return db.testimonial.findMany({ orderBy: { author: "asc" } });
}

/** Approved comments for a published article (storefront). */
export async function getApprovedComments(postId: string) {
  return db.blogComment.findMany({
    where: { postId, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
  });
}

/** Comments for moderation, newest first, with the owning post title. */
export async function getCommentsForModeration(status?: string) {
  return db.blogComment.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: { post: { select: { title: true, slug: true } } },
  });
}

/** Counts shown on the content hub. */
export async function getContentCounts() {
  const [posts, pages, faqs, testimonials, pendingComments] = await Promise.all([
    db.blogPost.count(),
    db.page.count(),
    db.faq.count(),
    db.testimonial.count(),
    db.blogComment.count({ where: { status: "PENDING" } }),
  ]);
  return { posts, pages, faqs, testimonials, pendingComments };
}
