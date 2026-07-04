"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Img {
  url: string;
  alt: string | null;
  isFeatured?: boolean;
  kind?: string | null;
}

export function ProductGallery({ images, name }: { images: Img[]; name: string }) {
  // featured first, keep the rest in given order
  const ordered = [...images].sort((a, b) => Number(!!b.isFeatured) - Number(!!a.isFeatured));
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const main = ordered[active] ?? ordered[0];

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowRight") setActive((v) => (v + 1) % ordered.length);
      if (e.key === "ArrowLeft") setActive((v) => (v - 1 + ordered.length) % ordered.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [zoom, ordered.length]);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setZoom(true)}
        className="group relative block aspect-square w-full overflow-hidden rounded-panel border border-line bg-[#0d1015]"
      >
        {main?.url && (
          <Image src={main.url} alt={main.alt ?? name} fill priority sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
        )}
        {main?.kind && main.kind !== "main" && main.kind !== "gallery" && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-gold">{main.kind}</span>
        )}
        <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-ink/70 px-3 py-1.5 text-[11px] text-cream opacity-0 transition-opacity group-hover:opacity-100">
          <Maximize2 className="h-3.5 w-3.5" /> View
        </span>
      </button>

      {ordered.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {ordered.map((im, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn("relative h-20 w-20 overflow-hidden rounded-lg border", i === active ? "border-gold" : "border-line")}
            >
              <Image src={im.url} alt={im.alt ?? `${name} ${i + 1}`} fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {zoom && main && (
        <div className="fixed inset-0 z-[120] flex flex-col bg-ink/95" onClick={() => setZoom(false)}>
          <div className="flex items-center justify-between px-5 py-3 text-cream">
            <span className="text-sm text-muted">{active + 1} / {ordered.length}</span>
            <button onClick={() => setZoom(false)} className="rounded-lg border border-line p-2 hover:bg-white/10"><X className="h-5 w-5" /></button>
          </div>
          <div className="relative flex flex-1 items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {ordered.length > 1 && (
              <button onClick={() => setActive((v) => (v - 1 + ordered.length) % ordered.length)} className="absolute left-4 z-10 rounded-full bg-ink/70 p-2 text-cream hover:bg-ink"><ChevronLeft className="h-6 w-6" /></button>
            )}
            <div className="relative h-full w-full">
              <Image src={main.url} alt={main.alt ?? name} fill sizes="100vw" className="object-contain" />
            </div>
            {ordered.length > 1 && (
              <button onClick={() => setActive((v) => (v + 1) % ordered.length)} className="absolute right-4 z-10 rounded-full bg-ink/70 p-2 text-cream hover:bg-ink"><ChevronRight className="h-6 w-6" /></button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
