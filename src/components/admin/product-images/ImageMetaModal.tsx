"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Sparkles, Pencil, RefreshCw, Scissors, Wand2 } from "lucide-react";
import { Input, Textarea, Select, FormField, Button } from "@/components/ui";
import { updateProductImage, replaceProductImage } from "@/actions/product-images";
import { generateImageMeta } from "@/actions/ai";
import { analyzeAndOptimize, humanBytes } from "@/lib/image-client";

export interface PImg {
  id: string; url: string; alt: string | null; title: string | null; caption: string | null;
  description: string | null; tags: string[]; kind: string | null; width: number | null;
  height: number | null; bytes: number; dominantColor: string | null; isFeatured: boolean;
}
const KINDS = ["", "main", "gallery", "lifestyle", "room", "closeup", "packaging", "before", "after", "360"];

export function ImageMetaModal({ image, onClose, onEdit }: { image: PImg; onClose: () => void; onEdit: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [aiPending, startAi] = useTransition();
  const replaceRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(image.title ?? "");
  const [alt, setAlt] = useState(image.alt ?? "");
  const [caption, setCaption] = useState(image.caption ?? "");
  const [description, setDescription] = useState(image.description ?? "");
  const [tags, setTags] = useState(image.tags.join(", "));
  const [kind, setKind] = useState(image.kind ?? "");

  const ext = (image.url.split(".").pop() || "").toUpperCase().split("?")[0];

  function save() {
    start(async () => {
      const fd = new FormData();
      fd.set("title", title); fd.set("alt", alt); fd.set("caption", caption);
      fd.set("description", description); fd.set("tags", tags); fd.set("kind", kind);
      await updateProductImage(image.id, fd);
      toast.success("Image details saved"); router.refresh(); onClose();
    });
  }
  function ai() {
    startAi(async () => {
      const res = await generateImageMeta(image.id);
      if (res?.error) { toast.error(res.error); return; }
      if (res.ok) { setAlt(res.altText || alt); setTitle(res.title || title); setTags((res.tags || []).join(", ")); toast.success("AI suggestions filled in"); }
    });
  }
  async function onReplace(file: File | undefined) {
    if (!file) return;
    try {
      const a = await analyzeAndOptimize(file);
      const fd = new FormData();
      fd.set("imageFile", new File([a.blob], "replace.webp", { type: "image/webp" }));
      fd.set("width", String(a.width)); fd.set("height", String(a.height)); fd.set("bytes", String(a.bytes)); fd.set("dominantColor", a.dominantColor);
      const res = await replaceProductImage(image.id, fd);
      if (res?.error) { toast.error(res.error); return; }
      toast.success("Image replaced"); router.refresh(); onClose();
    } catch { toast.error("Could not process that image."); }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/80 p-4" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-panel border border-line-gold bg-bg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h3 className="font-serif text-lg">Image Details</h3>
          <button onClick={onClose} className="text-muted hover:text-cream"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-1 gap-5 overflow-y-auto p-5 lg:grid-cols-[280px_1fr]">
          <div>
            <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-card border border-line bg-[#0d1015]">
              <Image src={image.url} alt={image.alt ?? ""} fill sizes="280px" className="object-contain" />
            </div>
            <dl className="space-y-1 text-xs">
              <div className="flex justify-between"><dt className="text-muted">Format</dt><dd className="text-grey">{ext || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Dimensions</dt><dd className="text-grey">{image.width ? `${image.width}×${image.height}px` : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Size</dt><dd className="text-grey">{image.bytes ? humanBytes(image.bytes) : "—"}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-muted">Dominant</dt><dd className="flex items-center gap-1.5 text-grey">{image.dominantColor && <span className="h-3.5 w-3.5 rounded-full border border-line" style={{ background: image.dominantColor }} />}{image.dominantColor ?? "—"}</dd></div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Button variant="dark" size="sm" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
              <Button variant="dark" size="sm" onClick={() => replaceRef.current?.click()}><RefreshCw className="h-3.5 w-3.5" /> Replace</Button>
              <input ref={replaceRef} type="file" accept="image/*" hidden onChange={(e) => onReplace(e.target.files?.[0])} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button disabled title="Coming soon" className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] text-muted opacity-50"><Scissors className="h-3 w-3" /> Remove BG</button>
              <button disabled title="Coming soon" className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] text-muted opacity-50"><Wand2 className="h-3 w-3" /> AI Enhance</button>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-medium text-cream">SEO & Metadata</h4>
              <Button variant="dark" size="sm" loading={aiPending} onClick={ai}><Sparkles className="h-3.5 w-3.5 text-gold" /> AI alt & tags</Button>
            </div>
            <FormField label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Luxury Gold Accent Chair" /></FormField>
            <FormField label="Alt Text"><Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Luxury gold accent chair on a marble floor" /></FormField>
            <FormField label="Caption"><Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Premium Sapphire Collection" /></FormField>
            <FormField label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></FormField>
            <div className="grid grid-cols-2 gap-x-4">
              <FormField label="Tags (comma separated)"><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="gold, chair, velvet" /></FormField>
              <FormField label="Gallery Type">
                <Select value={kind} onChange={(e) => setKind(e.target.value)}>
                  {KINDS.map((k) => <option key={k} value={k}>{k ? k.charAt(0).toUpperCase() + k.slice(1) : "— none —"}</option>)}
                </Select>
              </FormField>
            </div>
            <Button variant="gold" loading={pending} onClick={save} className="w-full justify-center">Save Details</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
