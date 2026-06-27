import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { getOrderDetail } from "@/lib/data/account";
import { OrderStatusPill, Panel } from "@/components/ui";
import { TrackTimeline } from "@/components/storefront/TrackTimeline";
import { formatMoney, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const user = await requireUser();
  const { number } = await params;
  const order = await getOrderDetail(user.id, number);
  if (!order) notFound();

  const rows: [string, number][] = [
    ["Subtotal", order.subtotalCents],
    ["Discount", -order.discountCents],
    ["Shipping", order.shippingCents],
    ["GST", order.taxCents],
    ["Gift card", -order.giftCardCents],
    ["Store credit", -order.storeCreditCents],
    ["Points redeemed", -order.pointsRedeemedCents],
  ];

  return (
    <div>
      <Link href="/account" className="text-xs uppercase tracking-[0.12em] text-gold">← My Orders</Link>
      <div className="mb-6 mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-[34px]">Order {order.number}</h1>
          <p className="text-[13px] text-muted">Placed {formatDate(order.placedAt)}</p>
        </div>
        <OrderStatusPill status={order.status} />
      </div>

      <Panel className="mb-5">
        <TrackTimeline status={order.status} />
        {order.trackingNumber && (
          <p className="mt-5 text-center text-sm text-muted">
            Tracking <span className="text-gold">{order.trackingNumber}</span>
            {order.carrier ? ` · ${order.carrier}` : ""}
          </p>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <Panel>
          <h3 className="mb-4 font-serif text-xl">Items</h3>
          <div className="space-y-4">
            {order.items.map((it) => (
              <div key={it.id} className="flex items-center gap-3">
                {it.imageSnapshot && (
                  <Image src={it.imageSnapshot} alt={it.nameSnapshot} width={54} height={54} className="h-[54px] w-[54px] rounded-lg object-cover" />
                )}
                <div className="flex-1">
                  <div className="text-sm">{it.nameSnapshot}</div>
                  <div className="text-xs text-muted">{it.skuSnapshot} · Qty {it.quantity}</div>
                </div>
                <div className="font-serif text-gold">{formatMoney(it.lineCents)}</div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel>
            <h3 className="mb-3 font-serif text-xl">Summary</h3>
            {rows
              .filter(([, v]) => v !== 0)
              .map(([label, v]) => (
                <div key={label} className="flex justify-between py-1.5 text-sm text-muted">
                  <span>{label}</span>
                  <span className="text-cream">{formatMoney(v)}</span>
                </div>
              ))}
            <div className="my-2 border-t border-line" />
            <div className="flex justify-between py-1 text-sm">
              <span>Total</span>
              <span className="font-serif text-lg text-gold">{formatMoney(order.totalCents)}</span>
            </div>
            <div className="mt-3 text-xs text-muted">Paid via {order.paymentMethod.replace(/_/g, " ")}</div>
          </Panel>

          {order.shippingAddress && (
            <Panel>
              <h3 className="mb-3 font-serif text-xl">Shipping</h3>
              <p className="text-sm leading-relaxed text-grey">
                {order.shippingAddress.fullName}<br />
                {order.shippingAddress.line1}<br />
                {order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}
                {order.shippingAddress.city}, {order.shippingAddress.region} {order.shippingAddress.postalCode}<br />
                {order.shippingAddress.country}
              </p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
