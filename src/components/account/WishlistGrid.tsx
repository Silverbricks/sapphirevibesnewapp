"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Price } from "@/components/ui";
import { useStore } from "@/components/storefront/store-context";
import { removeWishlistItem } from "@/actions/account";
import type { ProductCardData } from "@/lib/data/products";

export function WishlistGrid({ products }: { products: ProductCardData[] }) {
  const store = useStore();
  const router = useRouter();

  async function move(p: ProductCardData) {
    store.addToCart({
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand?.name ?? "",
      priceCents: p.priceCents,
      image: p.images[0]?.url ?? "",
    });
    await removeWishlistItem(p.id);
    router.refresh();
  }

  async function remove(p: ProductCardData) {
    await removeWishlistItem(p.id);
    toast(`${p.name} removed`);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <div key={p.id} className="overflow-hidden rounded-card border border-line bg-card">
          <Link href={`/products/${p.slug}`} className="relative block aspect-square bg-[#0d1015]">
            {p.images[0]?.url && (
              <Image src={p.images[0].url} alt={p.name} fill sizes="(max-width:1024px) 50vw, 25vw" className="object-cover" />
            )}
          </Link>
          <div className="p-4">
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted">{p.brand?.name}</div>
            <Link href={`/products/${p.slug}`}>
              <h4 className="my-1 font-serif text-[19px]">{p.name}</h4>
            </Link>
            <Price cents={p.priceCents} compareCents={p.compareCents} className="mb-3" />
            <div className="flex gap-2">
              <button
                onClick={() => move(p)}
                disabled={p.stock <= 0}
                className="flex-1 rounded-lg border border-line-gold py-2.5 text-center text-[11px] uppercase tracking-[0.12em] text-gold transition-colors hover:bg-gold hover:text-ink disabled:opacity-50"
              >
                {p.stock > 0 ? "Move to Cart" : "Sold Out"}
              </button>
              <button
                onClick={() => remove(p)}
                className="rounded-lg border border-line px-3 py-2.5 text-[11px] uppercase tracking-[0.12em] text-muted hover:text-red"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
