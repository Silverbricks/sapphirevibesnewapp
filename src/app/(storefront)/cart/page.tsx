"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useStore } from "@/components/storefront/store-context";
import { Button, buttonClasses, EmptyState } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD_CENTS, GST_RATE } from "@/lib/constants";

export default function CartPage() {
  const store = useStore();
  const subtotal = store.cart.reduce((s, l) => s + l.priceCents * l.qty, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : 995;
  const tax = Math.round(subtotal * GST_RATE);
  const total = subtotal + shipping + tax;

  return (
    <div className="py-16">
      <div className="wrap">
        <span className="eyebrow">Shopping Cart</span>
        <h1 className="mb-8 text-[clamp(34px,4.6vw,52px)]">Your Cart</h1>

        {store.cart.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="h-8 w-8" />}
            title="Your cart is empty"
            description="Discover sculptural lighting, décor and gifts to fill your space."
            action={
              <Link href="/new-arrivals" className={buttonClasses("gold", "lg")}>
                Start Shopping
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {store.cart.map((l) => (
                <div key={l.id} className="flex gap-4 rounded-card border border-line bg-card p-4">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-[#0d1015]">
                    {l.image && <Image src={l.image} alt={l.name} fill sizes="96px" className="object-cover" />}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-muted">{l.brand}</div>
                        <Link href={`/products/${l.slug}`} className="font-serif text-lg hover:text-gold">
                          {l.name}
                        </Link>
                      </div>
                      <button onClick={() => store.removeFromCart(l.id)} aria-label="Remove" className="text-muted hover:text-red">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-line">
                        <button onClick={() => store.updateQty(l.id, l.qty - 1)} className="px-2.5 py-1.5 text-muted hover:text-cream" aria-label="Decrease">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm">{l.qty}</span>
                        <button onClick={() => store.updateQty(l.id, l.qty + 1)} className="px-2.5 py-1.5 text-muted hover:text-cream" aria-label="Increase">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="font-serif text-lg text-gold">{formatMoney(l.priceCents * l.qty)}</div>
                    </div>
                  </div>
                </div>
              ))}
              <Link href="/new-arrivals" className="inline-block text-xs uppercase tracking-[0.12em] text-gold">
                ← Continue Shopping
              </Link>
            </div>

            <div className="h-fit rounded-panel border border-line bg-card p-6">
              <h3 className="mb-4 font-serif text-xl">Order Summary</h3>
              <Row label="Subtotal" value={formatMoney(subtotal)} />
              <Row label="Shipping (est.)" value={shipping === 0 ? "Free" : formatMoney(shipping)} />
              <Row label="GST (10%)" value={formatMoney(tax)} />
              <div className="my-3 border-t border-line" />
              <Row label="Total" value={formatMoney(total)} bold />
              <Link href="/checkout" className={buttonClasses("gold", "lg", "mt-5 w-full justify-center")}>
                Proceed to Checkout
              </Link>
              <p className="mt-3 text-center text-[11px] text-muted">
                Promo codes, gift cards & rewards apply at checkout.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between py-1.5 text-sm ${bold ? "text-cream" : "text-muted"}`}>
      <span>{label}</span>
      <span className={bold ? "font-serif text-lg text-gold" : "text-cream"}>{value}</span>
    </div>
  );
}
