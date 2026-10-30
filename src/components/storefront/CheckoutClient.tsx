"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/components/storefront/store-context";
import { Button, Input, Select, FormField, Panel, EmptyState, buttonClasses, Toggle } from "@/components/ui";
import { placeOrder } from "@/actions/checkout";
import { formatMoney } from "@/lib/format";
import { PAYMENT_METHODS_CATALOGUE } from "@/lib/constants";
import type { FulfilmentSettings, PaymentSettings } from "@/lib/data/settings";
import { quoteDelivery, fulfilmentAllows, type FulfilmentType } from "@/lib/fulfilment";

function formatPrep(min: number): string {
  if (!min) return "shortly";
  if (min < 60) return `~${min} min`;
  const h = min / 60;
  return `~${Number.isInteger(h) ? h : h.toFixed(1)} hour${h > 1 ? "s" : ""}`;
}

export function CheckoutClient({
  fulfilment,
  payments,
  gstRate,
}: {
  fulfilment: FulfilmentSettings;
  payments: PaymentSettings;
  gstRate: number;
}) {
  const store = useStore();

  const pickupOk = fulfilmentAllows(fulfilment, "pickup");
  const deliveryOk = fulfilmentAllows(fulfilment, "delivery");

  const enabledMethods = useMemo(
    () => PAYMENT_METHODS_CATALOGUE.filter((m) => payments.methods[m.key]),
    [payments],
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fulfilmentType, setFulfilmentType] = useState<FulfilmentType>(deliveryOk ? "delivery" : "pickup");
  const [postcode, setPostcode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>(enabledMethods[0]?.key ?? "MOCK");
  const [coupon, setCoupon] = useState("");
  const [giftWrap, setGiftWrap] = useState(false);

  const subtotal = store.cart.reduce((s, l) => s + l.priceCents * l.qty, 0);

  const quote = useMemo(
    () => quoteDelivery(postcode, subtotal, fulfilment.delivery),
    [postcode, subtotal, fulfilment.delivery],
  );

  const isPickup = fulfilmentType === "pickup";
  const shipping = isPickup ? 0 : quote.available ? quote.feeCents : 0;
  const tax = Math.round(subtotal * gstRate);
  const total = subtotal + shipping + tax;

  const deliveryBlocked = !isPickup && (!quote.available || !quote.zone);

  if (store.cart.length === 0) {
    return (
      <div className="py-16">
        <div className="wrap">
          <h1 className="mb-8 text-[clamp(34px,4.6vw,52px)]">Checkout</h1>
          <EmptyState
            title="Your cart is empty"
            description="Add something beautiful before checking out."
            action={<Link href="/new-arrivals" className={buttonClasses("gold", "lg")}>Browse Products</Link>}
          />
        </div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (deliveryBlocked) {
      setError(quote.reason ?? "Please choose a valid delivery address or Pickup.");
      return;
    }
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
      postalCode: String(fd.get("postalCode") || postcode || ""),
      phone: String(fd.get("phone") || ""),
      fulfilmentType,
      paymentMethod,
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

            {/* Fulfilment method */}
            {pickupOk && deliveryOk && (
              <Panel>
                <h3 className="mb-4 font-serif text-xl">How would you like to receive your order?</h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {deliveryOk && (
                    <button
                      type="button"
                      onClick={() => setFulfilmentType("delivery")}
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        !isPickup ? "border-gold bg-gold/10" : "border-line hover:border-gold/50"
                      }`}
                    >
                      <div className="text-sm">Delivery</div>
                      <div className="text-xs text-muted">Delivered to your address</div>
                    </button>
                  )}
                  {pickupOk && (
                    <button
                      type="button"
                      onClick={() => setFulfilmentType("pickup")}
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        isPickup ? "border-gold bg-gold/10" : "border-line hover:border-gold/50"
                      }`}
                    >
                      <div className="text-sm">Pickup</div>
                      <div className="text-xs text-muted">Collect in store · Free</div>
                    </button>
                  )}
                </div>
              </Panel>
            )}

            {/* Pickup details */}
            {isPickup ? (
              <>
                <Panel>
                  <h3 className="mb-4 font-serif text-xl">Pickup Details</h3>
                  <div className="rounded-lg border border-line p-4 text-sm">
                    <div className="mb-1 text-cream">{fulfilment.pickup.address}</div>
                    {fulfilment.pickup.schedule && <div className="text-xs text-muted">{fulfilment.pickup.schedule}</div>}
                    <div className="mt-2 text-xs text-gold">Ready for pickup {formatPrep(fulfilment.pickup.prepTimeMinutes)} after ordering</div>
                    {fulfilment.pickup.instructions && (
                      <div className="mt-2 text-xs text-muted">{fulfilment.pickup.instructions}</div>
                    )}
                  </div>
                </Panel>
                <Panel>
                  <h3 className="mb-4 font-serif text-xl">Your Details</h3>
                  <FormField label="Full Name"><Input name="fullName" required /></FormField>
                  <FormField label="Phone"><Input name="phone" /></FormField>
                </Panel>
              </>
            ) : (
              <Panel>
                <h3 className="mb-4 font-serif text-xl">Delivery Address</h3>
                <FormField label="Full Name"><Input name="fullName" required /></FormField>
                <FormField label="Address Line 1"><Input name="line1" required /></FormField>
                <FormField label="Address Line 2"><Input name="line2" /></FormField>
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
                  <FormField label="City"><Input name="city" required /></FormField>
                  <FormField label="State"><Input name="region" required /></FormField>
                  <FormField label="Postcode">
                    <Input name="postalCode" required value={postcode} onChange={(e) => setPostcode(e.target.value)} inputMode="numeric" />
                  </FormField>
                </div>
                <FormField label="Phone"><Input name="phone" /></FormField>
                {/* Live delivery quote */}
                {postcode.trim() && (
                  quote.zone && quote.available ? (
                    <div className="rounded-lg border border-gold/40 bg-gold/5 p-3 text-sm">
                      <span className="text-cream">{quote.zone.name}</span>
                      <span className="text-muted"> · {quote.zone.eta}</span>
                      <span className="float-right text-gold">{quote.feeCents === 0 ? "Free" : formatMoney(quote.feeCents)}</span>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-red/40 bg-red/5 p-3 text-sm text-red">
                      {quote.reason ?? "Delivery isn't available for this postcode."}
                      {pickupOk && " You can still choose Pickup."}
                    </div>
                  )
                )}
              </Panel>
            )}

            {/* Payment */}
            <Panel>
              <h3 className="mb-4 font-serif text-xl">Payment</h3>
              {enabledMethods.length > 0 ? (
                <FormField label="Payment Method">
                  <Select name="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    {enabledMethods.map((m) => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                  </Select>
                </FormField>
              ) : (
                <p className="text-sm text-muted">No payment methods are currently available. Please contact us to complete your order.</p>
              )}
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
              <div className="flex justify-between text-muted">
                <span>{isPickup ? "Pickup" : "Delivery"}</span>
                <span className="text-cream">{isPickup ? "Free" : deliveryBlocked ? "—" : shipping === 0 ? "Free" : formatMoney(shipping)}</span>
              </div>
              <div className="flex justify-between text-muted"><span>GST (10%)</span><span className="text-cream">{formatMoney(tax)}</span></div>
            </div>
            <div className="flex justify-between border-t border-line pt-3">
              <span>Total</span>
              <span className="font-serif text-lg text-gold">{formatMoney(total)}</span>
            </div>
            {error && <p className="text-sm text-red">{error}</p>}
            <Button
              type="submit"
              variant="gold"
              size="lg"
              loading={loading}
              disabled={deliveryBlocked || enabledMethods.length === 0}
              className="w-full justify-center"
            >
              Place Order
            </Button>
            <p className="text-center text-[11px] text-muted">Codes, delivery fees & rewards are validated on the server.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
