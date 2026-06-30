/** Hero slider slides are stored on the `hero` HomepageBlock's `config` JSON. */
export interface HeroSlide {
  image: string;
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
}

/** Extra blog-post fields stored on `BlogPost.meta` JSON (no dedicated columns). */
export interface BlogMeta {
  author?: string | null;
  tags?: string[];
  featured?: boolean;
  pinned?: boolean;
  allowComments?: boolean;
  readingTime?: number;
  gallery?: string[];
  scheduledAt?: string | null;
}

/** Heuristic: does this CMS body contain HTML markup (rich editor) vs. legacy plain text? */
export function isHtml(s: string | null | undefined): boolean {
  return !!s && /<\/?[a-z][\s\S]*>/i.test(s);
}

/** Read a BlogPost.meta JSON value into a typed object with sane defaults. */
export function readBlogMeta(meta: unknown): BlogMeta {
  const m = (meta as BlogMeta | null) ?? {};
  return {
    author: m.author ?? null,
    tags: Array.isArray(m.tags) ? m.tags : [],
    featured: !!m.featured,
    pinned: !!m.pinned,
    allowComments: m.allowComments !== false,
    readingTime: m.readingTime ?? 0,
    gallery: Array.isArray(m.gallery) ? m.gallery : [],
    scheduledAt: m.scheduledAt ?? null,
  };
}
