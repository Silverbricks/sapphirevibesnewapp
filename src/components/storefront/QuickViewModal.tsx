"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ShieldCheck, Sparkles, CreditCard, Heart } from "lucide-react";
import { Price, RatingStars, buttonClasses } from "@/components/ui";
import { useStore } from "./store-context";

export function QuickViewModal() {
  const store = useStore();
  const p = store.quickView;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") store.closeQuickView();
    }
    if (p) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [p, store]);

  if (!p) return null;
  const image = p.images[0]?.url;
  const oos = p.stock <= 0;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && store.closeQuickView()}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05070a]/70 p-6 backdrop-blur-sm"
    >
      <div className="relative grid max-h-[90vh] w-full max-w-[840px] grid-cols-1 overflow-hidden rounded-panel border border-line-gold bg-bg md:grid-cols-2">
        <button
          onClick={store.closeQuickView}
          aria-label="Close"
          className="absolute right-5 top-5 z-[3] flex h-[38px] w-[38px] items-center justify-center rounded-full bg-ink/70 text-cream"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="relative min-h-[240px] bg-[#0d1015] md:min-h-[340px]">
          {image && <Image src={image} alt={p.name} fill sizes="420px" className="object-cover" />}
        </div>
        <div className="overflow-y-auto p-9">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">
            {p.brand?.name}
          </div>
          <h2 className="my-1.5 font-serif text-[34px] font-medium">{p.name}</h2>
          <RatingStars rating={p.ratingAvg} count={p.ratingCount} size="md" />
          <div className="my-3.5">
            <Price cents={p.priceCents} compareCents={p.compareCents} size="lg" />
          </div>
          <p className="mb-5 text-[14px] leading-relaxed text-grey">{p.description}</p>
          <div className="mb-3.5 flex gap-3">
            {oos ? (
              <span className={buttonClasses("dark", "md", "flex-1 cursor-not-allowed justify-center")}>
                Sold Out
              </span>
            ) : (
              <button
                onClick={() => {
                  store.addToCart({
                    id: p.id,
                    slug: p.slug,
                    name: p.name,
                    brand: p.brand?.name ?? "",
                    priceCents: p.priceCents,
                    image: image ?? "",
                  });
                }}
                className={buttonClasses("gold", "md", "flex-1 justify-center")}
              >
                Add to Cart
              </button>
            )}
            <button
              onClick={() => store.toggleWishlist(p.id, p.name)}
              className={buttonClasses("outline", "md")}
            >
              <Heart className={store.isWished(p.id) ? "h-4 w-4 fill-current" : "h-4 w-4"} /> Save
            </button>
          </div>
          <Link
            href={`/products/${p.slug}`}
            onClick={store.closeQuickView}
            className="text-xs uppercase tracking-[0.14em] text-gold"
          >
            View full details →
          </Link>
          <div className="mt-5 space-y-2 border-t border-line pt-4">
            <Feature icon={<ShieldCheck className="h-[15px] w-[15px]" />}>Free express shipping over $250</Feature>
            <Feature icon={<Sparkles className="h-[15px] w-[15px]" />}>Earn loyalty points on this order</Feature>
            <Feature icon={<CreditCard className="h-[15px] w-[15px]" />}>Afterpay & Zip available at checkout</Feature>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted">
      <span className="text-gold">{icon}</span>
      {children}
    </div>
  );
}
