"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, RotateCw, FlipHorizontal, FlipVertical } from "lucide-react";
import { Button } from "@/components/ui";
import { replaceProductImage } from "@/actions/product-images";

interface Settings {
  rotate: number; flipH: boolean; flipV: boolean;
  brightness: number; contrast: number; saturate: number;
  cropT: number; cropR: number; cropB: number; cropL: number;
  maxDim: number; watermark: string; format: string; quality: number;
}
const INIT: Settings = { rotate: 0, flipH: false, flipV: false, brightness: 1, contrast: 1, saturate: 1, cropT: 0, cropR: 0, cropB: 0, cropL: 0, maxDim: 2000, watermark: "", format: "image/webp", quality: 0.85 };

export function ImageEditor({ image, onClose }: { image: { id: string; url: string }; onClose: () => void }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [s, setS] = useState<Settings>(INIT);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<Settings>) => setS((v) => ({ ...v, ...patch }));

  const render = useCallback(() => {
    const img = imgRef.current, canvas = canvasRef.current;
    if (!img || !canvas) return;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const sx = iw * s.cropL / 100, sy = ih * s.cropT / 100;
    const sw = iw * (1 - (s.cropL + s.cropR) / 100), sh = ih * (1 - (s.cropT + s.cropB) / 100);
    const rot = ((s.rotate % 360) + 360) % 360;
    let ow = rot === 90 || rot === 270 ? sh : sw;
    let oh = rot === 90 || rot === 270 ? sw : sh;
    const scale = Math.min(1, s.maxDim / Math.max(ow, oh));
    ow = Math.max(1, Math.round(ow * scale)); oh = Math.max(1, Math.round(oh * scale));
    canvas.width = ow; canvas.height = oh;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, ow, oh);
    ctx.save();
    ctx.filter = `brightness(${s.brightness}) contrast(${s.contrast}) saturate(${s.saturate})`;
    ctx.translate(ow / 2, oh / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(s.flipH ? -1 : 1, s.flipV ? -1 : 1);
    const dw = sw * scale, dh = sh * scale;
    ctx.drawImage(img, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
    if (s.watermark.trim()) {
      ctx.save();
      ctx.filter = "none"; ctx.globalAlpha = 0.55; ctx.fillStyle = "#fff";
      ctx.font = `${Math.max(14, Math.round(ow * 0.04))}px Georgia, serif`;
      ctx.textBaseline = "bottom";
      ctx.fillText(s.watermark, 14, oh - 14);
      ctx.restore();
    }
  }, [s]);

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { imgRef.current = img; setReady(true); };
    img.onerror = () => toast.error("Could not load image for editing (remote images may block editing).");
    img.src = image.url;
  }, [image.url]);

  useEffect(() => { if (ready) render(); }, [ready, render]);

  function save() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    canvas.toBlob(async (blob) => {
      if (!blob) { setSaving(false); toast.error("Export failed."); return; }
      const ext = s.format.split("/")[1].replace("jpeg", "jpg");
      const fd = new FormData();
      fd.set("imageFile", new File([blob], `edited.${ext}`, { type: s.format }));
      fd.set("width", String(canvas.width)); fd.set("height", String(canvas.height)); fd.set("bytes", String(blob.size));
      const res = await replaceProductImage(image.id, fd);
      setSaving(false);
      if (res?.error) { toast.error(res.error); return; }
      toast.success("Image saved"); onClose(); router.refresh();
    }, s.format, s.quality);
  }

  const Slider = ({ label, val, min, max, step, on }: { label: string; val: number; min: number; max: number; step: number; on: (n: number) => void }) => (
    <label className="block text-xs text-muted">{label} <span className="text-grey">{val}</span>
      <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => on(parseFloat(e.target.value))} className="mt-1 w-full accent-gold" />
    </label>
  );

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-ink/85 p-4" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-panel border border-line-gold bg-bg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h3 className="font-serif text-lg">Edit Image</h3>
          <button onClick={onClose} className="text-muted hover:text-cream"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 lg:grid-cols-[1fr_280px]">
          <div className="flex items-center justify-center rounded-card border border-line bg-[#0d1015] p-3">
            <canvas ref={canvasRef} className="max-h-[60vh] max-w-full object-contain" />
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="dark" size="sm" onClick={() => set({ rotate: s.rotate + 90 })}><RotateCw className="h-3.5 w-3.5" /> Rotate</Button>
              <Button variant={s.flipH ? "gold" : "dark"} size="sm" onClick={() => set({ flipH: !s.flipH })}><FlipHorizontal className="h-3.5 w-3.5" /> Flip</Button>
              <Button variant={s.flipV ? "gold" : "dark"} size="sm" onClick={() => set({ flipV: !s.flipV })}><FlipVertical className="h-3.5 w-3.5" /> Flip</Button>
            </div>
            <Slider label="Brightness" val={s.brightness} min={0.5} max={1.5} step={0.05} on={(n) => set({ brightness: n })} />
            <Slider label="Contrast" val={s.contrast} min={0.5} max={1.5} step={0.05} on={(n) => set({ contrast: n })} />
            <Slider label="Saturation" val={s.saturate} min={0} max={2} step={0.05} on={(n) => set({ saturate: n })} />
            <div className="grid grid-cols-2 gap-2">
              <Slider label="Crop top %" val={s.cropT} min={0} max={45} step={1} on={(n) => set({ cropT: n })} />
              <Slider label="Crop bottom %" val={s.cropB} min={0} max={45} step={1} on={(n) => set({ cropB: n })} />
              <Slider label="Crop left %" val={s.cropL} min={0} max={45} step={1} on={(n) => set({ cropL: n })} />
              <Slider label="Crop right %" val={s.cropR} min={0} max={45} step={1} on={(n) => set({ cropR: n })} />
            </div>
            <Slider label="Max size (px)" val={s.maxDim} min={400} max={3000} step={100} on={(n) => set({ maxDim: n })} />
            <label className="block text-xs text-muted">Watermark text
              <input value={s.watermark} onChange={(e) => set({ watermark: e.target.value })} placeholder="Sapphire Vibes" className="mt-1 w-full rounded-lg border border-line bg-panel px-2.5 py-2 text-sm text-cream outline-none focus:border-gold" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs text-muted">Format
                <select value={s.format} onChange={(e) => set({ format: e.target.value })} className="mt-1 w-full rounded-lg border border-line bg-panel px-2 py-2 text-sm text-cream outline-none focus:border-gold">
                  <option value="image/webp">WebP</option><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option>
                </select>
              </label>
              <Slider label="Quality" val={s.quality} min={0.4} max={1} step={0.05} on={(n) => set({ quality: n })} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={() => setS(INIT)}>Reset</Button>
              <Button variant="gold" loading={saving} onClick={save} className="flex-1 justify-center">Save Changes</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
