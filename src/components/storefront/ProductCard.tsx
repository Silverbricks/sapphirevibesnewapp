"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Eye, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductBadgeChip, SoldOutChip, Price, RatingStars } from "@/components/ui";
import type { ProductBadgeKey } from "@/lib/badges";
import type { ProductCardData } from "@/lib/data/products";
import { useStore } from "./store-context";
import { requestBackInStock } from "@/actions/storefront";
import { toast } from "sonner";

export function ProductCard({ product }: { product: ProductCardData }) {
  const store = useStore();
  const image = product.images[0]?.url;
  const oos = product.stock <= 0;
  const wished = store.isWished(product.id);
  const comparing = store.inCompare(product.id);

  async function onNotify() {
    const email = window.prompt("Enter your email and we'll notify you when this is back in stock:");
    if (!email) return;
    const res = await requestBackInStock(product.id, email);
    toast[res.ok ? "success" : "error"](res.message);
  }

  function onAddToCart() {
    store.addToCart({
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand?.name ?? "",
      priceCents: product.priceCents,
      image: image ?? "",
    });
  }

  return (
    <div className="group overflow-hidden rounded-card border border-white/[0.04] bg-card transition-all duration-300 hover:-translate-y-1.5 hover:border-line-gold">
      <div className="relative aspect-square overflow-hidden bg-[#0d1015]">
        {/* badge stack */}
        <div className="absolute left-3 top-3 z-[3] flex flex-col gap-1.5">
          {(product.badges as ProductBadgeKey[]).slice(0, 3).map((b) => (
            <ProductBadgeChip key={b} badge={b} />
          ))}
          {oos && <SoldOutChip />}
        </div>

        {/* hover quick actions */}
        <div className="absolute right-3 top-3 z-[3] flex flex-col gap-2">
          <QuickBtn label="Save" active={wished} onClick={() => store.toggleWishlist(product.id, product.name)}>
            <Heart className={cn("h-4 w-4", wished && "fill-current")} />
          </QuickBtn>
          <QuickBtn label="Quick view" delay="40ms" onClick={() => store.openQuickView(product)}>
            <Eye className="h-4 w-4" />
          </QuickBtn>
          <QuickBtn label="Compare" active={comparing} delay="80ms" onClick={() => store.toggleCompare(product)}>
            <Scale className="h-4 w-4" />
          </QuickBtn>
        </div>

        <Link href={`/products/${product.slug}`} aria-label={product.name}>
          {image && (
            <Image
              src={image}
              alt={product.images[0]?.alt ?? product.name}
              fill
              sizes="(max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.07]"
            />
          )}
        </Link>
      </div>

      <div className="p-[18px]">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted">
          {product.brand?.name}
        </div>
        <Link href={`/products/${product.slug}`}>
          <h3 className="my-1 font-serif text-[21px] font-medium leading-tight">
            {product.name}
          </h3>
        </Link>
        <RatingStars rating={product.ratingAvg} count={product.ratingCount} className="mb-2" />
        <Price cents={product.priceCents} compareCents={product.compareCents} showSave />
        {oos ? (
          <button
            onClick={onNotify}
            className="mt-3.5 w-full border border-line py-2.5 text-center text-[11px] uppercase tracking-[0.16em] text-muted transition-colors hover:border-line-gold hover:text-cream"
          >
            Notify When Back
          </button>
        ) : (
          <button
            onClick={onAddToCart}
            className="mt-3.5 w-full border border-line py-2.5 text-center text-[11px] uppercase tracking-[0.16em] text-gold transition-all group-hover:border-gold group-hover:bg-gold group-hover:text-ink"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}

function QuickBtn({
  children,
  label,
  active,
  delay,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  delay?: string;
  onClick: () => void;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      style={{ transitionDelay: delay }}
      className={cn(
        "flex h-[34px] w-[34px] translate-x-2 items-center justify-center rounded-full opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100",
        active ? "bg-gold text-ink" : "bg-ink/60 text-cream hover:bg-gold hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
