"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Heart, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonClasses } from "@/components/ui";
import { useStore } from "./store-context";
import { requestBackInStock } from "@/actions/storefront";

interface BuyBoxProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  priceCents: number;
  stock: number;
  image: string;
}

export function PdpBuyBox({ product }: { product: BuyBoxProduct }) {
  const store = useStore();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const oos = product.stock <= 0;
  const wished = store.isWished(product.id);

  // record recently-viewed
  useEffect(() => {
    store.recordView(product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const line = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    priceCents: product.priceCents,
    image: product.image,
  };

  async function onShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
        return;
      } catch {
        /* cancelled */
      }
    }
    await navigator.clipboard?.writeText(url);
    toast.success("Product link copied");
  }

  async function onNotify() {
    const email = window.prompt("Enter your email and we'll notify you when this is back in stock:");
    if (!email) return;
    const res = await requestBackInStock(product.id, email);
    toast[res.ok ? "success" : "error"](res.message);
  }

  if (oos) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-red">Currently out of stock</div>
        <div className="flex gap-3">
          <Button variant="gold" className="flex-1 justify-center" onClick={onNotify}>
            Notify When Back
          </Button>
          <Button variant="outline" onClick={() => store.toggleWishlist(product.id, product.name)}>
            <Heart className={wished ? "h-4 w-4 fill-current" : "h-4 w-4"} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-lg border border-line">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2.5 text-muted hover:text-cream" aria-label="Decrease quantity">
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-sm">{qty}</span>
          <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="px-3 py-2.5 text-muted hover:text-cream" aria-label="Increase quantity">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <span className="text-xs text-muted">{product.stock} in stock</span>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="gold" size="lg" className="flex-1 justify-center" onClick={() => store.addToCart(line, qty)}>
          Add to Cart
        </Button>
        <button
          className={buttonClasses("dark", "lg")}
          onClick={() => {
            store.addToCart(line, qty);
            router.push("/cart");
          }}
        >
          Buy Now
        </button>
      </div>
      <div className="flex gap-4 pt-1">
        <button onClick={() => store.toggleWishlist(product.id, product.name)} className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-muted hover:text-gold">
          <Heart className={wished ? "h-4 w-4 fill-gold text-gold" : "h-4 w-4"} /> {wished ? "Saved" : "Save"}
        </button>
        <button onClick={onShare} className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-muted hover:text-gold">
          <Share2 className="h-4 w-4" /> Share
        </button>
      </div>
    </div>
  );
}
