"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { Panel, Input, Select, FormField } from "@/components/ui";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { createManualOrder } from "@/actions/orders";
import { formatMoney } from "@/lib/format";

interface Prod { id: string; name: string; sku: string; priceCents: number }

const PAYMENT_METHODS = ["BANK_TRANSFER", "VISA", "MASTERCARD", "AMEX", "PAYPAL", "AFTERPAY", "ZIP", "GIFT_CARD", "MOCK"];
const STATUSES = ["PENDING", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "ON_HOLD"];
const label = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");

export function CreateManualOrderForm({ products }: { products: Prod[] }) {
  const [lines, setLines] = useState<{ productId: string; qty: number }[]>([]);
  const [pick, setPick] = useState(products[0]?.id ?? "");
  const [qty, setQty] = useState(1);

  const add = () => {
    if (!pick) return;
    setLines((l) => {
      const existing = l.find((x) => x.productId === pick);
      if (existing) return l.map((x) => (x.productId === pick ? { ...x, qty: x.qty + qty } : x));
      return [...l, { productId: pick, qty }];
    });
    setQty(1);
  };
  const prod = (id: string) => products.find((p) => p.id === id);
  const subtotal = lines.reduce((s, l) => s + (prod(l.productId)?.priceCents ?? 0) * l.qty, 0);

  return (
    <form
      action={async (fd) => {
        if (lines.length === 0) { toast.error("Add at least one product"); return; }
        fd.set("items", JSON.stringify(lines));
        const res = await createManualOrder(fd);
        if (res && "error" in res && res.error) toast.error(res.error);
      }}
      className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_340px]"
    >
      <div className="space-y-[18px]">
        <Panel>
          <h3 className="mb-4 font-serif text-lg">Products</h3>
          <div className="mb-4 flex flex-wrap items-end gap-2">
            <div className="min-w-[220px] flex-1">
              <Select value={pick} onChange={(e) => setPick(e.target.value)}>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatMoney(p.priceCents)}</option>)}
              </Select>
            </div>
            <Input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} className="w-20" />
            <button type="button" onClick={add} className="inline-flex items-center gap-1 rounded-lg bg-gold px-4 py-3 text-sm font-medium text-ink hover:bg-gold-soft"><Plus className="h-4 w-4" /> Add</button>
          </div>
          {lines.length === 0 ? (
            <p className="text-sm text-muted">No items yet.</p>
          ) : (
            <table className="atable">
              <thead><tr><th>Product</th><th>Qty</th><th>Total</th><th></th></tr></thead>
              <tbody>
                {lines.map((l) => {
                  const p = prod(l.productId)!;
                  return (
                    <tr key={l.productId}>
                      <td>{p.name}<div className="text-[11px] text-muted">{p.sku}</div></td>
                      <td>{l.qty}</td>
                      <td>{formatMoney(p.priceCents * l.qty)}</td>
                      <td><button type="button" onClick={() => setLines((ls) => ls.filter((x) => x.productId !== l.productId))} className="text-muted hover:text-red"><Trash2 className="h-4 w-4" /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div className="mt-3 text-right text-sm text-muted">Subtotal: <span className="text-gold">{formatMoney(subtotal)}</span></div>
        </Panel>

        <Panel>
          <h3 className="mb-4 font-serif text-lg">Shipping Address</h3>
          <FormField label="Address Line 1"><Input name="line1" /></FormField>
          <FormField label="Address Line 2"><Input name="line2" /></FormField>
          <div className="grid grid-cols-2 gap-x-4">
            <FormField label="Suburb/City"><Input name="city" /></FormField>
            <FormField label="State"><Input name="region" /></FormField>
            <FormField label="Postcode"><Input name="postalCode" /></FormField>
            <FormField label="Country"><Input name="country" defaultValue="Australia" /></FormField>
          </div>
        </Panel>
      </div>

      <div className="space-y-[18px]">
        <Panel>
          <h3 className="mb-4 font-serif text-lg">Customer</h3>
          <FormField label="Name"><Input name="customerName" required placeholder="Jane Doe" /></FormField>
          <FormField label="Email"><Input name="email" type="email" placeholder="jane@email.com" /></FormField>
          <div className="grid grid-cols-2 gap-x-4">
            <FormField label="Phone"><Input name="phone" /></FormField>
            <FormField label="Company"><Input name="company" /></FormField>
          </div>
          <p className="text-[11px] text-muted">If the email matches an existing account, the order is linked to it.</p>
        </Panel>

        <Panel>
          <h3 className="mb-4 font-serif text-lg">Payment & Status</h3>
          <FormField label="Payment Method">
            <Select name="paymentMethod" defaultValue="BANK_TRANSFER">{PAYMENT_METHODS.map((m) => <option key={m} value={m}>{label(m)}</option>)}</Select>
          </FormField>
          <FormField label="Payment Status">
            <Select name="paymentStatus" defaultValue="PAID"><option value="PAID">Paid</option><option value="UNPAID">Unpaid</option><option value="AUTHORIZED">Authorized</option></Select>
          </FormField>
          <FormField label="Order Status">
            <Select name="status" defaultValue="PROCESSING">{STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</Select>
          </FormField>
          <SubmitButton>Create Order</SubmitButton>
        </Panel>
      </div>
    </form>
  );
}
