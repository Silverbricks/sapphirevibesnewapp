"use client";

import Image from "next/image";
import Link from "next/link";
import { X, Scale } from "lucide-react";
import { useStore } from "@/components/storefront/store-context";
import { Button, buttonClasses, EmptyState, Price, RatingStars, ProductBadgeChip } from "@/components/ui";
import type { ProductBadgeKey } from "@/lib/badges";

export default function ComparePage() {
  const store = useStore();
  const items = store.compareCards;

  if (items.length === 0) {
    return (
      <div className="py-16">
        <div className="wrap">
          <span className="eyebrow">Compare</span>
          <h1 className="mb-8 text-[clamp(34px,4.6vw,52px)]">Compare Products</h1>
          <EmptyState
            icon={<Scale className="h-8 w-8" />}
            title="Nothing to compare yet"
            description="Add products to compare using the compare icon on any product card."
            action={
              <Link href="/new-arrivals" className={buttonClasses("gold", "lg")}>
                Browse Products
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="py-16">
      <div className="wrap">
        <span className="eyebrow">Compare</span>
        <h1 className="mb-8 text-[clamp(34px,4.6vw,52px)]">Compare Products</h1>
        <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(200px, 1fr))` }}>
          {items.map((p) => (
            <div key={p.id} className="rounded-card border border-line bg-card p-4">
              <div className="relative mb-4 aspect-square overflow-hidden rounded-lg bg-[#0d1015]">
                {p.images[0]?.url && (
                  <Image src={p.images[0].url} alt={p.name} fill sizes="240px" className="object-cover" />
                )}
                <button
                  onClick={() => store.removeCompare(p.id)}
                  aria-label="Remove"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-cream"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted">{p.brand?.name}</div>
              <Link href={`/products/${p.slug}`} className="font-serif text-lg hover:text-gold">
                {p.name}
              </Link>
              <div className="my-2">
                <RatingStars rating={p.ratingAvg} count={p.ratingCount} />
              </div>
              <Price cents={p.priceCents} compareCents={p.compareCents} />
              <div className="my-3 flex flex-wrap gap-1.5">
                {(p.badges as ProductBadgeKey[]).slice(0, 2).map((b) => (
                  <ProductBadgeChip key={b} badge={b} />
                ))}
              </div>
              <div className="mb-3 text-xs text-muted">
                {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
              </div>
              <Button
                variant="gold"
                className="w-full justify-center"
                disabled={p.stock <= 0}
                onClick={() =>
                  store.addToCart({
                    id: p.id,
                    slug: p.slug,
                    name: p.name,
                    brand: p.brand?.name ?? "",
                    priceCents: p.priceCents,
                    image: p.images[0]?.url ?? "",
                  })
                }
              >
                Add to Cart
              </Button>
            </div>
          ))}
        </div>
        <button onClick={store.clearCompare} className="mt-6 text-xs uppercase tracking-[0.12em] text-muted hover:text-cream">
          Clear comparison
        </button>
      </div>
    </div>
  );
}
