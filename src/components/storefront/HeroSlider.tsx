"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui";
import type { HeroSlide } from "@/lib/cms";

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  const s = slides[i];
  if (!s) return null;

  return (
    <section className="relative flex min-h-[88vh] items-center overflow-hidden bg-ink">
      {slides.map((slide, idx) => (
        <Image
          key={idx}
          src={slide.image}
          alt={slide.title}
          fill
          priority={idx === 0}
          sizes="100vw"
          className={cn("object-cover transition-opacity duration-1000", idx === i ? "opacity-100" : "opacity-0")}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/60 to-ink/20" />

      <div className="wrap relative z-[2]">
        <div key={i} className="max-w-[620px] animate-rise">
          {s.eyebrow && <span className="eyebrow">{s.eyebrow}</span>}
          <h1 className="my-3 text-[clamp(48px,7.5vw,92px)] leading-[1.02] tracking-tight">{s.title}</h1>
          {s.subtitle && <p className="mb-8 max-w-[460px] text-lg text-muted">{s.subtitle}</p>}
          {s.ctaLabel && s.ctaHref && (
            <Link href={s.ctaHref} className={buttonClasses("gold", "lg")}>{s.ctaLabel}</Link>
          )}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 z-[3] flex -translate-x-1/2 gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={cn("h-2 rounded-full transition-all", idx === i ? "w-6 bg-gold" : "w-2 bg-white/40 hover:bg-white/70")}
            />
          ))}
        </div>
      )}
    </section>
  );
}
