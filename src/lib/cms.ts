/** Hero slider slides are stored on the `hero` HomepageBlock's `config` JSON. */
export interface HeroSlide {
  image: string;
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
}
