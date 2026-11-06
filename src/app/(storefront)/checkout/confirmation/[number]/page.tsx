import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Landmark } from "lucide-react";
import { db } from "@/lib/db";
import { Panel, buttonClasses } from "@/components/ui";
import { ClearCart } from "@/components/storefront/ClearCart";
import { formatMoney, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order Confirmed" };

export default async function ConfirmationPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const order = await db.order.findUnique({ where: { number }, include: { items: true } });
  if (!order) notFound();

  // A gateway order reaches this page the instant the customer returns from Stripe,
  // which can beat the webhook that actually marks it paid. Don't claim it's confirmed
  // until it is — and don't imply a problem either.
  const awaitingGateway = order.paymentStatus === "UNPAID" && !!order.paymentSessionId;
  const awaitingManual = order.paymentStatus === "UNPAID" && !order.paymentSessionId;

  const Icon = awaitingGateway ? Clock : awaitingManual ? Landmark : CheckCircle2;
  const heading = awaitingGateway ? "Finalising Your Order" : awaitingManual ? "Order Received" : "Order Confirmed";
  const eyebrow = awaitingGateway ? "Almost There" : "Thank You";

  return (
    <div className="py-20">
      <ClearCart />
      <div className="wrap max-w-2xl text-center">
        <Icon className={`mx-auto mb-5 h-16 w-16 ${awaitingGateway ? "text-gold" : "text-green"}`} strokeWidth={1.2} />
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="mb-2 mt-2 font-serif text-[clamp(34px,5vw,52px)]">{heading}</h1>
        <p className="mb-8 text-muted">
          Order <span className="text-gold">{order.number}</span> · placed {formatDate(order.placedAt)}.{" "}
          {awaitingGateway
            ? "We're confirming your payment — this usually takes a few seconds. Refresh this page in a moment, and we'll email your receipt as soon as it clears."
            : awaitingManual
              ? order.paymentMethod === "CASH_ON_DELIVERY"
                ? "Payment is due on pickup or delivery. We'll be in touch to arrange it."
                : "Please complete your bank transfer using the order number as the reference. We'll dispatch once it clears."
              : `A confirmation has been sent to ${order.guestEmail ?? "your email"}.`}
        </p>

        <Panel className="mb-8 text-left">
          <div className="space-y-3 border-b border-line pb-4">
            {order.items.map((it) => (
              <div key={it.id} className="flex justify-between text-sm">
                <span>{it.nameSnapshot} × {it.quantity}</span>
                <span className="text-gold">{formatMoney(it.lineCents)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1.5 text-sm text-muted">
            <div className="flex justify-between"><span>Subtotal</span><span className="text-cream">{formatMoney(order.subtotalCents)}</span></div>
            {order.discountCents > 0 && <div className="flex justify-between"><span>Discount</span><span className="text-cream">−{formatMoney(order.discountCents)}</span></div>}
            <div className="flex justify-between"><span>Shipping</span><span className="text-cream">{order.shippingCents === 0 ? "Free" : formatMoney(order.shippingCents)}</span></div>
            <div className="flex justify-between"><span>GST</span><span className="text-cream">{formatMoney(order.taxCents)}</span></div>
            <div className="flex justify-between border-t border-line pt-2 text-base text-cream"><span>Total</span><span className="font-serif text-gold">{formatMoney(order.totalCents)}</span></div>
          </div>
        </Panel>

        <div className="flex justify-center gap-3">
          <Link href="/track" className={buttonClasses("outline", "lg")}>Track Order</Link>
          <Link href="/new-arrivals" className={buttonClasses("gold", "lg")}>Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
