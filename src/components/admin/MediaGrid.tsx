"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Copy, Trash2 } from "lucide-react";
import { Input, FormField, Button } from "@/components/ui";
import { updateMedia, deleteMedia } from "@/actions/media";

interface Asset {
  id: string;
  url: string;
  type: string;
  alt: string | null;
  folder: string;
  tags: string[];
  bytes: number;
  createdAt: Date | string;
}

function fmtBytes(b: number) {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaGrid({ assets }: { assets: Asset[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [active, setActive] = useState<Asset | null>(null);

  function copy(url: string) {
    navigator.clipboard?.writeText(url);
    toast("URL copied");
  }

  if (assets.length === 0) {
    return <p className="rounded-card border border-line bg-card p-10 text-center text-sm text-muted">No media yet — upload images above.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {assets.map((a) => (
          <button
            key={a.id}
            onClick={() => setActive(a)}
            className="group relative aspect-square overflow-hidden rounded-card border border-line bg-ink transition-colors hover:border-line-gold"
          >
            <Image src={a.url} alt={a.alt || ""} fill sizes="200px" className="object-cover" />
            <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-ink/90 to-transparent px-2 py-1.5 text-left text-[10px] text-grey opacity-0 transition-opacity group-hover:opacity-100">
              {a.alt || a.url.split("/").pop()}
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 p-4" onClick={() => setActive(null)}>
          <div className="relative w-full max-w-lg rounded-panel border border-line-gold bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setActive(null)} className="absolute right-4 top-4 text-muted hover:text-cream"><X className="h-5 w-5" /></button>
            <div className="relative mb-4 h-56 w-full overflow-hidden rounded-card border border-line bg-ink">
              <Image src={active.url} alt={active.alt || ""} fill sizes="512px" className="object-contain" />
            </div>
            <div className="mb-4 flex items-center gap-3 text-xs text-muted">
              <span>{active.type}</span><span>·</span><span>{fmtBytes(active.bytes)}</span>
              <button onClick={() => copy(active.url)} className="ml-auto inline-flex items-center gap-1 text-gold hover:underline"><Copy className="h-3.5 w-3.5" /> Copy URL</button>
            </div>
            <form
              action={(fd) =>
                start(async () => {
                  await updateMedia(active.id, fd);
                  toast.success("Media updated");
                  setActive(null);
                  router.refresh();
                })
              }
            >
              <FormField label="Alt text"><Input name="alt" defaultValue={active.alt ?? ""} /></FormField>
              <div className="grid grid-cols-2 gap-x-4">
                <FormField label="Folder"><Input name="folder" defaultValue={active.folder} /></FormField>
                <FormField label="Tags (comma separated)"><Input name="tags" defaultValue={active.tags.join(", ")} /></FormField>
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit" variant="gold" loading={pending}>Save</Button>
                <button
                  type="button"
                  onClick={() => { if (window.confirm("Delete this image?")) start(async () => { await deleteMedia(active.id); toast("Deleted"); setActive(null); router.refresh(); }); }}
                  disabled={pending}
                  className="ml-auto inline-flex items-center gap-1 text-sm text-muted hover:text-red disabled:opacity-40"
                ><Trash2 className="h-4 w-4" /> Delete</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
