"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button, Input, Panel, FormField } from "@/components/ui";
import { addHeroSlide, removeHeroSlide } from "@/actions/admin";
import type { HeroSlide } from "@/lib/cms";

export function HeroSlideManager({ slides }: { slides: HeroSlide[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [formKey, setFormKey] = useState(0);

  function remove(i: number) {
    start(async () => {
      await removeHeroSlide(i);
      toast("Slide removed");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <Panel>
        <h3 className="mb-4 font-serif text-xl">Current Slides ({slides.length})</h3>
        {slides.length === 0 && <p className="text-sm text-muted">No slides yet — add one below. (Until you add a slide, the storefront shows the default hero.)</p>}
        <div className="space-y-3">
          {slides.map((s, i) => (
            <div key={i} className="flex items-center gap-4 rounded-card border border-line p-3">
              <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-[#0d1015]">
                {s.image && <Image src={s.image} alt={s.title} fill sizes="96px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                {s.eyebrow && <div className="text-[10px] uppercase tracking-[0.16em] text-gold">{s.eyebrow}</div>}
                <div className="truncate font-serif text-lg">{s.title || "(no title)"}</div>
                {s.subtitle && <div className="truncate text-xs text-muted">{s.subtitle}</div>}
              </div>
              <button onClick={() => remove(i)} disabled={pending} className="text-muted hover:text-red disabled:opacity-50" aria-label="Remove slide">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <h3 className="mb-4 font-serif text-xl">Add a Slide</h3>
        <form
          key={formKey}
          action={(fd) =>
            start(async () => {
              await addHeroSlide(fd);
              setFormKey((k) => k + 1);
              toast.success("Slide added");
              router.refresh();
            })
          }
        >
          <FormField label="Slide Image (upload)">
            <input type="file" name="imageFile" accept="image/*" className="block w-full text-sm text-muted file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gold file:px-4 file:py-2 file:font-medium file:text-ink hover:file:bg-gold-soft" />
          </FormField>
          <FormField label="…or paste an image URL"><Input name="imageUrl" placeholder="https://images.unsplash.com/..." /></FormField>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <FormField label="Eyebrow (small label)"><Input name="eyebrow" placeholder="The Autumn Collection · 2026" /></FormField>
            <FormField label="Title"><Input name="title" placeholder="Luxury Living. Timeless Style." required /></FormField>
            <FormField label="Subtitle"><Input name="subtitle" placeholder="Curated home décor and lighting…" /></FormField>
            <FormField label="Button Label"><Input name="ctaLabel" placeholder="Shop the Collection" /></FormField>
            <FormField label="Button Link"><Input name="ctaHref" placeholder="/new-arrivals" /></FormField>
          </div>
          <Button type="submit" variant="gold" loading={pending}>Add Slide</Button>
        </form>
      </Panel>
    </div>
  );
}
