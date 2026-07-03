import { notFound } from "next/navigation";
import { getOrderDetail } from "@/lib/data/orders";
import { getSiteSettings } from "@/lib/data/settings";
import { formatMoney, formatDate } from "@/lib/format";
import { PrintButton } from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";

const DOCS: Record<string, string> = {
  invoice: "Invoice",
  "tax-invoice": "Tax Invoice",
  "packing-slip": "Packing Slip",
  "credit-note": "Credit Note",
  label: "Shipping Label",
};

function asObj(v: unknown): Record<string, string> {
  return v && typeof v === "object" ? (v as Record<string, string>) : {};
}

function AddressBlock({ a }: { a: Record<string, string> }) {
  return (
    <div className="text-sm leading-relaxed">
      {a.fullName && <div className="font-medium">{a.fullName}</div>}
      {a.company && <div>{a.company}</div>}
      {a.line1 && <div>{a.line1}</div>}
      {a.line2 && <div>{a.line2}</div>}
      <div>{[a.city, a.region, a.postalCode].filter(Boolean).join(" ")}</div>
      {a.country && <div>{a.country}</div>}
      {a.phone && <div>{a.phone}</div>}
    </div>
  );
}

export default async function PrintDocPage({ params }: { params: Promise<{ number: string; doc: string }> }) {
  const { number, doc } = await params;
  const title = DOCS[doc];
  if (!title) notFound();

  const [order, { store }] = await Promise.all([getOrderDetail(number), getSiteSettings()]);
  if (!order) notFound();

  const ship = asObj(order.shippingSnapshot);
  const bill = order.billingSameAsShipping ? ship : asObj(order.billingSnapshot);
  const showPrices = doc !== "packing-slip" && doc !== "label";

  // Shipping label — a compact address-forward layout
  if (doc === "label") {
    return (
      <>
        <div className="mb-4 flex justify-between print:hidden"><PrintButton /></div>
        <div className="rounded border-2 border-black p-6">
          <div className="mb-4 text-xs uppercase tracking-widest text-gray-500">From</div>
          <div className="mb-6 text-sm">{store.name} · {store.address || "Australia"}</div>
          <div className="mb-2 text-xs uppercase tracking-widest text-gray-500">Ship To</div>
          <div className="text-xl"><AddressBlock a={ship} /></div>
          <div className="mt-6 flex items-center justify-between border-t-2 border-black pt-4">
            <div className="text-2xl font-bold tracking-tight">{order.number}</div>
            <div className="text-right text-sm">
              <div>{order.carrier ?? "—"}</div>
              <div className="font-mono">{order.trackingNumber ?? ""}</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-between print:hidden"><PrintButton /></div>

      <div className="flex items-start justify-between border-b border-gray-300 pb-6">
        <div>
          <div className="font-serif text-2xl font-semibold">{store.name}</div>
          {store.address && <div className="text-sm text-gray-600">{store.address}</div>}
          {store.abn && <div className="text-sm text-gray-600">ABN {store.abn}</div>}
          {store.email && <div className="text-sm text-gray-600">{store.email}</div>}
        </div>
        <div className="text-right">
          <div className="text-xl font-semibold uppercase tracking-wide">{title}</div>
          <div className="text-sm text-gray-600">Order {order.number}</div>
          {order.invoiceNumber && <div className="text-sm text-gray-600">{order.invoiceNumber}</div>}
          <div className="text-sm text-gray-600">{formatDate(order.placedAt)}</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-8">
        <div><div className="mb-1 text-xs uppercase tracking-widest text-gray-500">Bill To</div><AddressBlock a={bill} /></div>
        <div><div className="mb-1 text-xs uppercase tracking-widest text-gray-500">Ship To</div><AddressBlock a={ship} /></div>
      </div>

      {doc === "credit-note" ? (
        <div className="mt-8 rounded border border-gray-300 p-6">
          <div className="text-lg font-semibold">Credit / Refund</div>
          <div className="mt-2 flex justify-between text-sm"><span>Refunded amount</span><span className="font-semibold">{formatMoney(order.refundedCents || order.totalCents)}</span></div>
          {order.refundReason && <div className="mt-2 text-sm text-gray-600">Reason: {order.refundReason}</div>}
        </div>
      ) : (
        <table className="mt-8 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-gray-800 text-left">
              <th className="py-2">Item</th><th className="py-2">SKU</th><th className="py-2 text-center">Qty</th>
              {showPrices && <><th className="py-2 text-right">Unit</th><th className="py-2 text-right">Total</th></>}
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id} className="border-b border-gray-200">
                <td className="py-2">{it.nameSnapshot}{it.colour ? ` · ${it.colour}` : ""}</td>
                <td className="py-2 text-gray-600">{it.skuSnapshot}</td>
                <td className="py-2 text-center">{it.quantity}</td>
                {showPrices && <><td className="py-2 text-right">{formatMoney(it.unitCents)}</td><td className="py-2 text-right">{formatMoney(it.lineCents)}</td></>}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showPrices && doc !== "credit-note" && (
        <div className="mt-6 flex justify-end">
          <div className="w-64 text-sm">
            <Row k="Subtotal" v={formatMoney(order.subtotalCents)} />
            {order.discountCents > 0 && <Row k="Discount" v={`−${formatMoney(order.discountCents)}`} />}
            <Row k="Shipping" v={formatMoney(order.shippingCents)} />
            <Row k="GST" v={formatMoney(order.taxCents)} />
            <div className="mt-1 flex justify-between border-t-2 border-gray-800 pt-2 text-base font-semibold"><span>Total</span><span>{formatMoney(order.totalCents)}</span></div>
          </div>
        </div>
      )}

      <div className="mt-10 border-t border-gray-300 pt-4 text-center text-xs text-gray-500">
        Thank you for shopping with {store.name}.
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between py-1"><span className="text-gray-600">{k}</span><span>{v}</span></div>;
}
