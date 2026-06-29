"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/components/storefront/store-context";
import { Button, Input, Select, FormField, Panel, EmptyState, buttonClasses, Toggle } from "@/components/ui";
import { placeOrder } from "@/actions/checkout";
import { formatMoney } from "@/lib/format";
import { SHIPPING_METHODS, FREE_SHIPPING_THRESHOLD_CENTS, GST_RATE } from "@/lib/constants";

export default function CheckoutPage() {
  const store = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [coupon, setCoupon] = useState("");
  const [giftWrap, setGiftWrap] = useState(false);

  const subtotal = store.cart.reduce((s, l) => s + l.priceCents * l.qty, 0);
  const methodCents = SHIPPING_METHODS.find((m) => m.id === shippingMethod)?.cents ?? 0;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : methodCents;
  const tax = Math.round(subtotal * GST_RATE);
  const total = subtotal + shipping + tax;

  if (store.cart.length === 0) {
    return (
      <div className="py-16">
        <div className="wrap">
          <h1 className="mb-8 text-[clamp(34px,4.6vw,52px)]">Checkout</h1>
          <EmptyState title="Your cart is empty" description="Add something beautiful before checking out."
            action={<Link href="/new-arrivals" className={buttonClasses("gold", "lg")}>Browse Products</Link>} />
        </div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await placeOrder({
      lines: store.cart.map((l) => ({ productId: l.id, qty: l.qty })),
      email: String(fd.get("email") || ""),
      fullName: String(fd.get("fullName") || ""),
      line1: String(fd.get("line1") || ""),
      line2: String(fd.get("line2") || ""),
      city: String(fd.get("city") || ""),
      region: String(fd.get("region") || ""),
      postalCode: String(fd.get("postalCode") || ""),
      phone: String(fd.get("phone") || ""),
      shippingMethod,
      paymentMethod: String(fd.get("paymentMethod") || "MOCK"),
      couponCode: coupon,
      giftWrap,
      orderNotes: String(fd.get("orderNotes") || ""),
    });
    // only returns on error; success redirects
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  }

  return (
    <div className="py-16">
      <div className="wrap">
        <h1 className="mb-8 text-[clamp(34px,4.6vw,52px)]">Checkout</h1>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <Panel>
              <h3 className="mb-4 font-serif text-xl">Contact</h3>
              <FormField label="Email"><Input name="email" type="email" required placeholder="you@email.com" /></FormField>
            </Panel>
            <Panel>
              <h3 className="mb-4 font-serif text-xl">Shipping Address</h3>
              <FormField label="Full Name"><Input name="fullName" required /></FormField>
              <FormField label="Address Line 1"><Input name="line1" required /></FormField>
              <FormField label="Address Line 2"><Input name="line2" /></FormField>
              <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
                <FormField label="City"><Input name="city" required /></FormField>
                <FormField label="State"><Input name="region" required /></FormField>
                <FormField label="Postcode"><Input name="postalCode" required /></FormField>
              </div>
              <FormField label="Phone"><Input name="phone" /></FormField>
            </Panel>
            <Panel>
              <h3 className="mb-4 font-serif text-xl">Shipping Method</h3>
              <div className="space-y-2">
                {SHIPPING_METHODS.filter((m) => m.id !== "click_collect").map((m) => (
                  <label key={m.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-line p-3 has-[:checked]:border-gold">
                    <div className="flex items-center gap-3">
                      <input type="radio" name="ship" value={m.id} checked={shippingMethod === m.id} onChange={() => setShippingMethod(m.id)} className="accent-gold" />
                      <div>
                        <div className="text-sm">{m.label}</div>
                        <div className="text-xs text-muted">{m.desc}</div>
                      </div>
                    </div>
                    <span className="text-sm text-gold">{m.cents === 0 ? "Free" : formatMoney(m.cents)}</span>
                  </label>
                ))}
              </div>
            </Panel>
            <Panel>
              <h3 className="mb-4 font-serif text-xl">Payment</h3>
              <FormField label="Payment Method">
                <Select name="paymentMethod" defaultValue="VISA">
                  <option value="VISA">Visa</option>
                  <option value="MASTERCARD">Mastercard</option>
                  <option value="AMEX">Amex</option>
                  <option value="PAYPAL">PayPal</option>
                  <option value="APPLE_PAY">Apple Pay</option>
                  <option value="AFTERPAY">Afterpay</option>
                  <option value="ZIP">Zip</option>
                </Select>
              </FormField>
              <p className="text-xs text-muted">Demo checkout — no real payment is processed.</p>
            </Panel>
            <Panel>
              <h3 className="mb-4 font-serif text-xl">Gift Options &amp; Notes</h3>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm">Add gift wrapping</span>
                <Toggle checked={giftWrap} onChange={setGiftWrap} />
              </div>
              <FormField label="Order Notes"><Input name="orderNotes" placeholder="Leave at front door…" /></FormField>
            </Panel>
          </div>

          <div className="h-fit space-y-4 rounded-panel border border-line bg-card p-6">
            <h3 className="font-serif text-xl">Order Summary</h3>
            <div className="space-y-2 border-b border-line pb-3">
              {store.cart.map((l) => (
                <div key={l.id} className="flex justify-between text-sm">
                  <span className="text-muted">{l.name} × {l.qty}</span>
                  <span>{formatMoney(l.priceCents * l.qty)}</span>
                </div>
              ))}
            </div>
            <FormField label="Promo / Gift code">
              <Input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="WELCOME15" />
            </FormField>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted"><span>Subtotal</span><span className="text-cream">{formatMoney(subtotal)}</span></div>
              <div className="flex justify-between text-muted"><span>Shipping</span><span className="text-cream">{shipping === 0 ? "Free" : formatMoney(shipping)}</span></div>
              <div className="flex justify-between text-muted"><span>GST (10%)</span><span className="text-cream">{formatMoney(tax)}</span></div>
            </div>
            <div className="flex justify-between border-t border-line pt-3">
              <span>Total</span>
              <span className="font-serif text-lg text-gold">{formatMoney(total)}</span>
            </div>
            {error && <p className="text-sm text-red">{error}</p>}
            <Button type="submit" variant="gold" size="lg" loading={loading} className="w-full justify-center">
              Place Order
            </Button>
            <p className="text-center text-[11px] text-muted">Codes & rewards are validated on the server.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
