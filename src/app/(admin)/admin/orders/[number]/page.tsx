import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAdminOrderDetail } from "@/lib/data/admin";
import { Panel, OrderStatusPill } from "@/components/ui";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { TrackTimeline } from "@/components/storefront/TrackTimeline";
import { formatMoney, formatDate } from "@/lib/format";
import { PageHead } from "@/components/admin/PageHead";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetail({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const order = await getAdminOrderDetail(number);
  if (!order) notFound();

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-block text-xs uppercase tracking-[0.12em] text-gold">← All orders</Link>
      <PageHead
        title={`Order ${order.number}`}
        subtitle={`${order.customerName} · ${order.user?.email ?? order.guestEmail ?? "guest"} · ${formatDate(order.placedAt)}`}
        actions={<OrderStatusSelect orderId={order.id} current={order.status} />}
      />

      <Panel className="mb-5">
        <TrackTimeline status={order.status} />
      </Panel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <Panel>
          <h3 className="mb-4 font-serif text-xl">Items</h3>
          <div className="space-y-4">
            {order.items.map((it) => (
              <div key={it.id} className="flex items-center gap-3">
                {it.imageSnapshot && <Image src={it.imageSnapshot} alt={it.nameSnapshot} width={48} height={48} className="h-12 w-12 rounded-lg object-cover" />}
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
            <Row label="Subtotal" value={formatMoney(order.subtotalCents)} />
            {order.discountCents > 0 && <Row label="Discount" value={`−${formatMoney(order.discountCents)}`} />}
            <Row label="Shipping" value={formatMoney(order.shippingCents)} />
            <Row label="GST" value={formatMoney(order.taxCents)} />
            <div className="my-2 border-t border-line" />
            <div className="flex justify-between text-sm">
              <span>Total</span>
              <span className="font-serif text-lg text-gold">{formatMoney(order.totalCents)}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted">
              Payment: {order.paymentMethod.replace(/_/g, " ")} <OrderStatusPill status={order.paymentStatus} />
            </div>
          </Panel>
          {order.shippingAddress && (
            <Panel>
              <h3 className="mb-3 font-serif text-xl">Shipping</h3>
              <p className="text-sm leading-relaxed text-grey">
                {order.shippingAddress.fullName}<br />
                {order.shippingAddress.line1}<br />
                {order.shippingAddress.city}, {order.shippingAddress.region} {order.shippingAddress.postalCode}
              </p>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 text-sm text-muted">
      <span>{label}</span>
      <span className="text-cream">{value}</span>
    </div>
  );
}
