"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Star } from "lucide-react";
import { Panel, Input, Textarea, Select, FormField, Toggle, Button } from "@/components/ui";
import { saveTestimonial, deleteTestimonial } from "@/actions/content";

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  location: string | null;
  rating: number;
  isFeatured: boolean;
}

export function TestimonialManager({ items }: { items: Testimonial[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [featured, setFeatured] = useState(true);
  const [formKey, setFormKey] = useState(0);

  function edit(t: Testimonial) {
    setEditing(t);
    setFeatured(t.isFeatured);
    setFormKey((k) => k + 1);
  }
  function reset() {
    setEditing(null);
    setFeatured(true);
    setFormKey((k) => k + 1);
  }

  return (
    <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_360px]">
      <Panel>
        <h3 className="mb-4 font-serif text-xl">Testimonials ({items.length})</h3>
        {items.length === 0 && <p className="text-sm text-muted">No testimonials yet — add one on the right.</p>}
        <div className="space-y-2">
          {items.map((t) => (
            <div key={t.id} className="flex items-start gap-3 rounded-card border border-line p-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-gold">
                  {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                  {t.isFeatured && <span className="ml-2 text-[10px] uppercase tracking-[0.14em] text-muted">Featured</span>}
                </div>
                <p className="mt-1 line-clamp-2 font-serif text-[15px] italic text-cream">“{t.quote}”</p>
                <div className="mt-1 text-xs text-muted">{t.author}{t.location ? ` · ${t.location}` : ""}</div>
              </div>
              <button onClick={() => edit(t)} className="text-muted hover:text-gold" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
              <button
                onClick={() => start(async () => { await deleteTestimonial(t.id); toast("Deleted"); reset(); router.refresh(); })}
                disabled={pending}
                className="text-muted hover:text-red disabled:opacity-40"
                aria-label="Delete"
              ><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <h3 className="mb-4 font-serif text-lg">{editing ? "Edit Testimonial" : "Add Testimonial"}</h3>
        <form
          key={formKey}
          action={(fd) => start(async () => { await saveTestimonial(fd); toast.success("Testimonial saved"); reset(); router.refresh(); })}
        >
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <FormField label="Quote"><Textarea name="quote" defaultValue={editing?.quote ?? ""} rows={3} required /></FormField>
          <FormField label="Author"><Input name="author" defaultValue={editing?.author ?? ""} required /></FormField>
          <FormField label="Location"><Input name="location" defaultValue={editing?.location ?? ""} placeholder="Sydney, AU" /></FormField>
          <FormField label="Rating">
            <Select name="rating" defaultValue={String(editing?.rating ?? 5)}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
            </Select>
          </FormField>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-grey">Featured on storefront</span>
            <Toggle checked={featured} onChange={setFeatured} />
            <input type="hidden" name="isFeatured" value={featured ? "on" : ""} />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="gold" loading={pending}>{editing ? "Update" : "Add"}</Button>
            {editing && <Button type="button" variant="ghost" onClick={reset}>Cancel</Button>}
          </div>
        </form>
      </Panel>
    </div>
  );
}
