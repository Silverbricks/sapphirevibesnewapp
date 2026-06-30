"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Input, Textarea, Panel, FormField } from "@/components/ui";
import { savePromoBanner } from "@/actions/admin";
import type { PromoBannerConfig } from "@/lib/data/content";

export function PromoBannerEditor({ banner }: { banner: PromoBannerConfig }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [preview] = useState(banner.image || "");

  return (
    <Panel>
      <h3 className="mb-1 font-serif text-xl">Promotional Banner</h3>
      <p className="mb-5 text-sm text-muted">
        Shown on the homepage below the announcement marquee. Toggle the “Promotional Banner” section on the
        Homepage CMS to show or hide it.
      </p>

      {preview && (
        <div className="relative mb-5 h-32 w-full overflow-hidden rounded-card border border-line">
          <Image src={preview} alt="Current banner" fill sizes="100vw" className="object-cover" />
        </div>
      )}

      <form
        action={(fd) =>
          start(async () => {
            await savePromoBanner(fd);
            toast.success("Promo banner saved");
            router.refresh();
          })
        }
      >
        <FormField label="Banner Image (upload — optional)">
          <input
            type="file"
            name="imageFile"
            accept="image/*"
            className="block w-full text-sm text-muted file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gold file:px-4 file:py-2 file:font-medium file:text-ink hover:file:bg-gold-soft"
          />
        </FormField>
        <FormField label="…or paste an image URL"><Input name="imageUrl" defaultValue={banner.image || ""} placeholder="https://images.unsplash.com/..." /></FormField>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <FormField label="Eyebrow (small label)"><Input name="eyebrow" defaultValue={banner.eyebrow || ""} placeholder="Limited Time" /></FormField>
          <FormField label="Heading"><Input name="heading" defaultValue={banner.heading || ""} placeholder="Free Express Shipping Over $250" /></FormField>
        </div>
        <FormField label="Description"><Textarea name="desc" defaultValue={banner.desc || ""} rows={2} placeholder="Complimentary delivery on every order, Australia-wide." /></FormField>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <FormField label="Button Label"><Input name="ctaLabel" defaultValue={banner.ctaLabel || ""} placeholder="Shop Now" /></FormField>
          <FormField label="Button Link"><Input name="ctaHref" defaultValue={banner.ctaHref || ""} placeholder="/sale" /></FormField>
        </div>
        <Button type="submit" variant="gold" loading={pending}>Save Banner</Button>
      </form>
    </Panel>
  );
}
