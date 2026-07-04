"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Download } from "lucide-react";

interface Img { url: string; alt: string | null; width?: number | null; height?: number | null; bytes?: number }

export function ImageLightbox({ images, index, onClose }: { images: Img[]; index: number; onClose: () => void }) {
  const [i, setI] = useState(index);
  const [zoom, setZoom] = useState(1);
  const img = images[i];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") { setI((v) => (v + 1) % images.length); setZoom(1); }
      if (e.key === "ArrowLeft") { setI((v) => (v - 1 + images.length) % images.length); setZoom(1); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);

  if (!img) return null;
  const go = (d: number) => { setI((v) => (v + d + images.length) % images.length); setZoom(1); };

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-ink/95" onClick={onClose}>
      <div className="flex items-center justify-between px-5 py-3 text-cream" onClick={(e) => e.stopPropagation()}>
        <span className="text-sm text-muted">{i + 1} / {images.length}{img.width ? ` · ${img.width}×${img.height}` : ""}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom((z) => Math.max(1, z - 0.25))} className="rounded-lg border border-line p-2 hover:bg-white/10"><ZoomOut className="h-4 w-4" /></button>
          <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))} className="rounded-lg border border-line p-2 hover:bg-white/10"><ZoomIn className="h-4 w-4" /></button>
          <button onClick={() => document.getElementById("lb-stage")?.requestFullscreen?.()} className="rounded-lg border border-line p-2 hover:bg-white/10"><Maximize className="h-4 w-4" /></button>
          <a href={img.url} download target="_blank" rel="noreferrer" className="rounded-lg border border-line p-2 hover:bg-white/10"><Download className="h-4 w-4" /></a>
          <button onClick={onClose} className="rounded-lg border border-line p-2 hover:bg-white/10"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <div id="lb-stage" className="relative flex flex-1 items-center justify-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {images.length > 1 && <button onClick={() => go(-1)} className="absolute left-4 z-10 rounded-full bg-ink/70 p-2 text-cream hover:bg-ink"><ChevronLeft className="h-6 w-6" /></button>}
        <div className="relative h-full w-full">
          <Image src={img.url} alt={img.alt ?? ""} fill sizes="100vw" className="object-contain transition-transform" style={{ transform: `scale(${zoom})` }} />
        </div>
        {images.length > 1 && <button onClick={() => go(1)} className="absolute right-4 z-10 rounded-full bg-ink/70 p-2 text-cream hover:bg-ink"><ChevronRight className="h-6 w-6" /></button>}
      </div>
    </div>
  );
}
