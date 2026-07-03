import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireModule } from "@/lib/auth-helpers";
import { getOrderDetail } from "@/lib/data/orders";
import { Panel, Pill, PaymentStatusPill } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { OrderActionsBar } from "@/components/admin/orders/OrderActionsBar";
import { CustomerCard, AddressesCard, DeliveryCard, InternalNotesCard, DocumentsCard } from "@/components/admin/orders/OrderCards";
import { TimelineCard, CommunicationsCard, ReturnsCard } from "@/components/admin/orders/OrderActivity";
import { formatMoney, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function asObj(v: unknown): Record<string, string> {
  return v && typeof v === "object" ? (v as Record<string, string>) : {};
}

export default async function AdminOrderDetail({ params }: { params: Promise<{ number: string }> }) {
  await requireModule("orders");
  const { number } = await params;
  const order = await getOrderDetail(number);
  if (!order) notFound();

  const registered = !!order.user;
  const customer = {
    name: order.user?.name ?? order.customerName,
    email: order.user?.email ?? order.guestEmail ?? "",
    phone: order.user?.phone ?? null,
    alternatePhone: order.user?.alternatePhone ?? null,
    company: order.user?.company ?? null,
    abn: order.user?.abn ?? null,
    notes: order.user?.notes ?? null,
    customerType: order.user?.customerType ?? null,
    registered,
  };
  const shipping = asObj(order.shippingSnapshot);
  const billing = order.billingSameAsShipping ? null : asObj(order.billingSnapshot);
  const notes = asObj(order.internalNotes);

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-block text-xs uppercase tracking-[0.12em] text-gold">← All orders</Link>
      <PageHead
        title={`Order ${order.number}`}
        subtitle={`${order.invoiceNumber ? order.invoiceNumber + " · " : ""}${formatDate(order.placedAt)} · ${order.salesChannel ?? "Online"}${order.archivedAt ? " · Archived" : ""}`}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        {/* main column */}
        <div className="space-y-5">
          <Panel>
            <h3 className="mb-4 font-serif text-lg">Purchased Products</h3>
            <div className="overflow-x-auto">
              <table className="atable">
                <thead><tr><th></th><th>Product</th><th>SKU</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
                <tbody>
                  {order.items.map((it) => (
                    <tr key={it.id}>
                      <td className="w-14">{it.imageSnapshot && <Image src={it.imageSnapshot} alt={it.nameSnapshot} width={44} height={44} className="h-11 w-11 rounded-lg object-cover" />}</td>
                      <td>
                        <div className="text-cream">{it.nameSnapshot}</div>
                        <div className="text-[11px] text-muted">{[it.colour, it.size, it.variant].filter(Boolean).join(" · ")}</div>
                      </td>
                      <td className="text-muted">{it.skuSnapshot}</td>
                      <td>{it.quantity}</td>
                      <td>{formatMoney(it.unitCents)}</td>
                      <td className="text-gold">{formatMoney(it.lineCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel>
            <h3 className="mb-3 font-serif text-lg">Order Summary</h3>
            <Row k="Subtotal" v={formatMoney(order.subtotalCents)} />
            {order.discountCents > 0 && <Row k={`Discount${order.coupon ? ` (${order.coupon.code})` : ""}`} v={`−${formatMoney(order.discountCents)}`} />}
            <Row k="Shipping" v={formatMoney(order.shippingCents)} />
            <Row k="GST / Tax" v={formatMoney(order.taxCents)} />
            {order.giftCardCents > 0 && <Row k="Gift card" v={`−${formatMoney(order.giftCardCents)}`} />}
            {order.storeCreditCents > 0 && <Row k="Store credit" v={`−${formatMoney(order.storeCreditCents)}`} />}
            {order.pointsRedeemedCents > 0 && <Row k="Points" v={`−${formatMoney(order.pointsRedeemedCents)}`} />}
            <div className="my-2 border-t border-line" />
            <div className="flex justify-between"><span className="text-sm">Total</span><span className="font-serif text-lg text-gold">{formatMoney(order.totalCents)}</span></div>
            {order.refundedCents > 0 && <div className="mt-1 flex justify-between text-sm text-red"><span>Refunded</span><span>−{formatMoney(order.refundedCents)}</span></div>}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
              Payment: {order.paymentMethod.replace(/_/g, " ")} <PaymentStatusPill status={order.paymentStatus} />
              {order.assignedToName && <><span>·</span><Pill color="blue">{order.assignedToName}</Pill></>}
            </div>
          </Panel>

          <TimelineCard orderId={order.id} events={order.events} />
          <CommunicationsCard orderId={order.id} email={customer.email || null} phone={customer.phone} events={order.events} />
          <ReturnsCard orderId={order.id} returns={order.returns} />
        </div>

        {/* sidebar */}
        <div className="space-y-5">
          <OrderActionsBar orderId={order.id} number={order.number} status={order.status} archived={!!order.archivedAt} />
          <CustomerCard orderId={order.id} data={customer} />
          <AddressesCard orderId={order.id} shipping={shipping} billing={billing} sameBilling={order.billingSameAsShipping} />
          <DeliveryCard orderId={order.id} d={order} />
          <InternalNotesCard orderId={order.id} notes={notes} />
          <DocumentsCard number={order.number} />
        </div>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between py-1 text-sm"><span className="text-muted">{k}</span><span className="text-cream">{v}</span></div>;
}
