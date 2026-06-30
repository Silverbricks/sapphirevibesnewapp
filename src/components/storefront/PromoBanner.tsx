import Image from "next/image";
import Link from "next/link";
import { buttonClasses } from "@/components/ui";
import type { PromoBannerConfig } from "@/lib/data/content";

export function PromoBanner({ banner }: { banner: PromoBannerConfig }) {
  if (!banner.heading && !banner.image) return null;

  const cta =
    banner.ctaLabel && banner.ctaHref ? (
      <Link href={banner.ctaHref} className={buttonClasses("gold", "lg")}>
        {banner.ctaLabel}
      </Link>
    ) : null;

  // With an image: full-width band with overlay (matches CollectionBand language).
  if (banner.image) {
    return (
      <div className="relative flex items-center overflow-hidden rounded-panel" style={{ minHeight: 300 }}>
        <Image src={banner.image} alt={banner.heading || "Promotion"} fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/95 to-ink/40" />
        <div className="relative z-[2] max-w-[560px] p-10 md:p-14">
          {banner.eyebrow && <span className="eyebrow">{banner.eyebrow}</span>}
          {banner.heading && <h2 className="my-3 text-[38px]">{banner.heading}</h2>}
          {banner.desc && <p className="mb-6 text-grey">{banner.desc}</p>}
          {cta}
        </div>
      </div>
    );
  }

  // Without an image: bordered gold card, centred.
  return (
    <div className="glow-gold relative overflow-hidden rounded-panel border border-line-gold bg-card p-10 text-center md:p-14">
      {banner.eyebrow && <span className="eyebrow">{banner.eyebrow}</span>}
      {banner.heading && <h2 className="my-3 text-[34px]">{banner.heading}</h2>}
      {banner.desc && <p className="mx-auto mb-6 max-w-[520px] text-muted">{banner.desc}</p>}
      {cta}
    </div>
  );
}
