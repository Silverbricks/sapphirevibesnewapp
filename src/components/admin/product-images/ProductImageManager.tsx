"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadCloud, Link2, Camera, Star, Pencil, Trash2, Copy, Maximize2, Loader2, FileArchive } from "lucide-react";
import { Panel, Input, Button } from "@/components/ui";
import { analyzeAndOptimize, hashDistance } from "@/lib/image-client";
import { addProductImage, addProductImageFromUrl, deleteProductImage, duplicateProductImage, setFeaturedImage, reorderProductImages } from "@/actions/product-images";
import { ImageMetaModal, type PImg } from "./ImageMetaModal";
import { ImageEditor } from "./ImageEditor";
import { ImageLightbox } from "./ImageLightbox";

export function ProductImageManager({ productId, images }: { productId: string; images: PImg[] }) {
  const router = useRouter();
  const [items, setItems] = useState<PImg[]>(images);
  useEffect(() => setItems(images), [images]);

  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [url, setUrl] = useState("");
  const [meta, setMeta] = useState<PImg | null>(null);
  const [editor, setEditor] = useState<PImg | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);
  const hashes = useRef<string[]>([]);

  async function handleFiles(files: File[]) {
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      if (!file.type.startsWith("image/")) { toast.error(`❌ ${file.name}: unsupported file type`); continue; }
      try {
        const a = await analyzeAndOptimize(file);
        if (Math.max(a.width, a.height) < 400) { toast.error(`❌ ${file.name}: image too small (min 400px)`); continue; }
        if (hashes.current.some((h) => hashDistance(h, a.hash) <= 4)) toast(`⚠ ${file.name}: looks like a duplicate`);
        hashes.current.push(a.hash);
        const fd = new FormData();
        fd.set("productId", productId);
        fd.set("imageFile", new File([a.blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" }));
        fd.set("width", String(a.width)); fd.set("height", String(a.height)); fd.set("bytes", String(a.bytes)); fd.set("dominantColor", a.dominantColor);
        const res = await addProductImage(fd);
        if (res?.error) toast.error(res.error);
        else toast.success(`✅ ${file.name} uploaded`);
      } catch { toast.error(`❌ ${file.name}: could not process`); }
    }
    setUploading(false);
    router.refresh();
  }

  async function handleZip(file: File) {
    setUploading(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(file);
      const files: File[] = [];
      for (const name of Object.keys(zip.files)) {
        const entry = zip.files[name];
        if (entry.dir || !/\.(jpe?g|png|webp|gif|avif)$/i.test(name)) continue;
        const blob = await entry.async("blob");
        files.push(new File([blob], name.split("/").pop() || "image", { type: blob.type || "image/jpeg" }));
      }
      if (!files.length) { toast.error("No images found in the ZIP."); setUploading(false); return; }
      toast.success(`Found ${files.length} image${files.length === 1 ? "" : "s"} in ZIP`);
      await handleFiles(files);
    } catch { toast.error("Could not read the ZIP file."); }
    setUploading(false);
  }

  function addFromUrl() {
    if (!url.trim()) return;
    start(async () => {
      const res = await addProductImageFromUrl(productId, url);
      if (res?.error) toast.error(res.error);
      else { toast.success("Image added"); setUrl(""); router.refresh(); }
    });
  }

  const act = (fn: () => Promise<{ error?: string } | { ok: true }>, ok: string) =>
    start(async () => { const r = await fn(); if (r && "error" in r && r.error) toast.error(r.error); else toast.success(ok); router.refresh(); });

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const zip = files.find((f) => /\.zip$/i.test(f.name));
    if (zip) handleZip(zip);
    else handleFiles(files.filter((f) => f.type.startsWith("image/")));
  }

  // gallery drag-reorder
  function onTileDrop(target: number) {
    if (dragIdx === null || dragIdx === target) { setDragIdx(null); return; }
    const next = [...items];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(target, 0, moved);
    setItems(next); setDragIdx(null);
    start(async () => { await reorderProductImages(productId, next.map((x) => x.id)); router.refresh(); });
  }

  return (
    <Panel>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-xl">Product Images</h3>
        <span className="text-xs text-muted">{items.length} image{items.length === 1 ? "" : "s"}</span>
      </div>

      {/* dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`mb-4 rounded-card border-2 border-dashed p-6 text-center transition-colors ${dragOver ? "border-gold bg-gold/5" : "border-line"}`}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted"><Loader2 className="h-5 w-5 animate-spin text-gold" /> Optimising & uploading…</div>
        ) : (
          <>
            <UploadCloud className="mx-auto mb-2 h-8 w-8 text-gold" strokeWidth={1.5} />
            <p className="text-sm text-grey">Drag & drop images or a ZIP here</p>
            <p className="mb-3 text-xs text-muted">JPG · PNG · WEBP · AVIF · GIF — auto-optimised to WebP</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="dark" size="sm" onClick={() => fileRef.current?.click()}><UploadCloud className="h-3.5 w-3.5" /> Browse</Button>
              <Button variant="dark" size="sm" onClick={() => camRef.current?.click()}><Camera className="h-3.5 w-3.5" /> Camera</Button>
              <Button variant="dark" size="sm" onClick={() => zipRef.current?.click()}><FileArchive className="h-3.5 w-3.5" /> ZIP</Button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(Array.from(e.target.files || []))} />
            <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => handleFiles(Array.from(e.target.files || []))} />
            <input ref={zipRef} type="file" accept=".zip" hidden onChange={(e) => e.target.files?.[0] && handleZip(e.target.files[0])} />
          </>
        )}
      </div>

      {/* URL add */}
      <div className="mb-5 flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste an image URL" className="pl-9" />
        </div>
        <Button variant="gold" loading={pending} onClick={addFromUrl}>Add</Button>
      </div>

      {/* gallery */}
      {items.length === 0 ? (
        <p className="rounded-card border border-line bg-card p-8 text-center text-sm text-muted">No images yet — upload above. The first image becomes the main product image.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((im, idx) => (
            <div
              key={im.id}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onTileDrop(idx)}
              className={`group relative aspect-square overflow-hidden rounded-card border bg-[#0d1015] ${im.isFeatured ? "border-gold" : "border-line"} ${dragIdx === idx ? "opacity-50" : ""}`}
            >
              <button onClick={() => setLightbox(idx)} className="absolute inset-0"><Image src={im.url} alt={im.alt ?? ""} fill sizes="200px" className="object-cover" /></button>
              {im.isFeatured && <span className="absolute left-1.5 top-1.5 z-10 flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-ink"><Star className="h-3 w-3 fill-current" /> Main</span>}
              <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center gap-1 bg-gradient-to-t from-ink/90 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                {!im.isFeatured && <IconBtn title="Set as main" onClick={() => act(() => setFeaturedImage(im.id), "Main image set")} disabled={pending}><Star className="h-3.5 w-3.5" /></IconBtn>}
                <IconBtn title="Edit / SEO" onClick={() => setMeta(im)}><Pencil className="h-3.5 w-3.5" /></IconBtn>
                <IconBtn title="Duplicate" onClick={() => act(() => duplicateProductImage(im.id), "Duplicated")} disabled={pending}><Copy className="h-3.5 w-3.5" /></IconBtn>
                <IconBtn title="View" onClick={() => setLightbox(idx)}><Maximize2 className="h-3.5 w-3.5" /></IconBtn>
                <IconBtn title="Delete" onClick={() => { if (confirm("Delete this image?")) act(() => deleteProductImage(im.id), "Deleted"); }} disabled={pending}><Trash2 className="h-3.5 w-3.5" /></IconBtn>
              </div>
            </div>
          ))}
        </div>
      )}
      {items.length > 1 && <p className="mt-3 text-center text-[11px] text-muted">Drag tiles to reorder · the ★ Main image shows first</p>}

      {meta && <ImageMetaModal image={meta} onClose={() => setMeta(null)} onEdit={() => { setEditor(meta); setMeta(null); }} />}
      {editor && <ImageEditor image={editor} onClose={() => setEditor(null)} />}
      {lightbox !== null && <ImageLightbox images={items} index={lightbox} onClose={() => setLightbox(null)} />}
    </Panel>
  );
}

function IconBtn({ title, onClick, disabled, children }: { title: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button title={title} onClick={onClick} disabled={disabled} className="rounded-md bg-ink/70 p-1.5 text-cream hover:bg-gold hover:text-ink disabled:opacity-40">
      {children}
    </button>
  );
}
