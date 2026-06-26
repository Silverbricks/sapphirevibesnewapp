"use client";

import { useEffect, useState } from "react";
import { useStore } from "./store-context";
import { ProductCard } from "./ProductCard";
import { getRecentlyViewed } from "@/actions/storefront";
import { SectionHead } from "./sections";
import type { ProductCardData } from "@/lib/data/products";

export function RecentlyViewed() {
  const { recentIds } = useStore();
  const [items, setItems] = useState<ProductCardData[]>([]);

  useEffect(() => {
    if (recentIds.length === 0) {
      setItems([]);
      return;
    }
    let active = true;
    getRecentlyViewed(recentIds).then((rows) => {
      if (active) setItems(rows);
    });
    return () => {
      active = false;
    };
  }, [recentIds]);

  if (items.length === 0) return null;

  return (
    <section className="pb-24">
      <div className="wrap">
        <SectionHead eyebrow="Pick Up Where You Left Off" title="Recently Viewed" />
        <div className="no-scrollbar flex snap-x gap-[18px] overflow-x-auto pb-3.5">
          {items.map((p) => (
            <div key={p.id} className="w-60 flex-none snap-start">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
