"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Printer } from "lucide-react";
import { Panel, Input, Textarea, FormField, Toggle, Button, buttonClasses } from "@/components/ui";
import { updateOrderCustomer, updateOrderAddresses, updateDelivery, saveInternalNotes } from "@/actions/orders";

function useSave(onOk: string) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const save = (fn: () => Promise<{ error?: string } | { ok: true } | void>, done: () => void) =>
    start(async () => {
      const res = await fn();
      if (res && "error" in res && res.error) { toast.error(res.error); return; }
      toast.success(onOk);
      done();
      router.refresh();
    });
  return { pending, save };
}

const dtInput = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString().slice(0, 16) : "");
const fmt = (d: Date | string | null | undefined) => (d ? new Date(d).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—");

interface Snap { fullName?: string; company?: string | null; line1?: string; line2?: string | null; city?: string; region?: string; postalCode?: string; country?: string; phone?: string | null; instructions?: string | null }

// ───────────────────────── Customer ─────────────────────────

export function CustomerCard({ orderId, data }: {
  orderId: string;
  data: { name: string; email: string; phone: string | null; alternatePhone: string | null; company: string | null; abn: string | null; notes: string | null; customerType: string | null; registered: boolean };
}) {
  const [edit, setEdit] = useState(false);
  const { pending, save } = useSave("Customer updated");

  return (
    <Panel>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-lg">Customer</h3>
        <button onClick={() => setEdit((v) => !v)} className="text-muted hover:text-gold"><Pencil className="h-4 w-4" /></button>
      </div>
      {edit ? (
        <form action={(fd) => save(() => updateOrderCustomer(orderId, fd), () => setEdit(false))}>
          <FormField label="Name"><Input name="customerName" defaultValue={data.name} /></FormField>
          <FormField label="Email"><Input name="email" type="email" defaultValue={data.email} /></FormField>
          <div className="grid grid-cols-2 gap-x-4">
            <FormField label="Mobile"><Input name="phone" defaultValue={data.phone ?? ""} /></FormField>
            <FormField label="Alt Phone"><Input name="alternatePhone" defaultValue={data.alternatePhone ?? ""} /></FormField>
            <FormField label="Company"><Input name="company" defaultValue={data.company ?? ""} /></FormField>
            <FormField label="ABN"><Input name="abn" defaultValue={data.abn ?? ""} /></FormField>
          </div>
          <FormField label="Customer Notes"><Textarea name="notes" rows={2} defaultValue={data.notes ?? ""} /></FormField>
          <div className="flex gap-2"><Button type="submit" variant="gold" loading={pending}>Save</Button><Button type="button" variant="ghost" onClick={() => setEdit(false)}>Cancel</Button></div>
          {!data.registered && <p className="mt-2 text-[11px] text-muted">Guest order — contact fields are saved to the order only.</p>}
        </form>
      ) : (
        <dl className="space-y-1.5 text-sm">
          <Row k="Name" v={data.name} />
          <Row k="Email" v={data.email || "—"} />
          <Row k="Mobile" v={data.phone || "—"} />
          {data.alternatePhone && <Row k="Alt Phone" v={data.alternatePhone} />}
          {data.company && <Row k="Company" v={data.company} />}
          {data.abn && <Row k="ABN" v={data.abn} />}
          {data.customerType && <Row k="Type" v={data.customerType} />}
          {data.notes && <Row k="Notes" v={data.notes} />}
        </dl>
      )}
    </Panel>
  );
}

// ───────────────────────── Addresses ─────────────────────────

export function AddressesCard({ orderId, shipping, billing, sameBilling }: {
  orderId: string; shipping: Snap | null; billing: Snap | null; sameBilling: boolean;
}) {
  const [edit, setEdit] = useState(false);
  const [same, setSame] = useState(sameBilling);
  const { pending, save } = useSave("Addresses updated");
  const sh = shipping ?? {};
  const bi = billing ?? {};

  return (
    <Panel>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-lg">Addresses</h3>
        <button onClick={() => setEdit((v) => !v)} className="text-muted hover:text-gold"><Pencil className="h-4 w-4" /></button>
      </div>
      {edit ? (
        <form action={(fd) => save(() => updateOrderAddresses(orderId, fd), () => setEdit(false))}>
          <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-muted">Shipping</div>
          <AddrFields prefix="ship" v={sh} />
          <div className="my-3 flex items-center justify-between">
            <span className="text-sm text-grey">Billing same as shipping</span>
            <Toggle checked={same} onChange={setSame} />
            <input type="hidden" name="billingSameAsShipping" value={same ? "on" : ""} />
          </div>
          {!same && (<><div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-muted">Billing</div><AddrFields prefix="bill" v={bi} /></>)}
          <div className="flex gap-2"><Button type="submit" variant="gold" loading={pending}>Save</Button><Button type="button" variant="ghost" onClick={() => setEdit(false)}>Cancel</Button></div>
        </form>
      ) : (
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <AddrView title="Shipping" a={sh} />
          <AddrView title="Billing" a={sameBilling ? sh : bi} note={sameBilling ? "Same as shipping" : undefined} />
        </div>
      )}
    </Panel>
  );
}

function AddrFields({ prefix, v }: { prefix: string; v: Snap }) {
  return (
    <div className="grid grid-cols-2 gap-x-4">
      <FormField label="Full Name"><Input name={`${prefix}FullName`} defaultValue={v.fullName ?? ""} /></FormField>
      <FormField label="Company"><Input name={`${prefix}Company`} defaultValue={v.company ?? ""} /></FormField>
      <FormField label="Address 1"><Input name={`${prefix}Line1`} defaultValue={v.line1 ?? ""} /></FormField>
      <FormField label="Address 2"><Input name={`${prefix}Line2`} defaultValue={v.line2 ?? ""} /></FormField>
      <FormField label="Suburb/City"><Input name={`${prefix}City`} defaultValue={v.city ?? ""} /></FormField>
      <FormField label="State"><Input name={`${prefix}Region`} defaultValue={v.region ?? ""} /></FormField>
      <FormField label="Postcode"><Input name={`${prefix}PostalCode`} defaultValue={v.postalCode ?? ""} /></FormField>
      <FormField label="Country"><Input name={`${prefix}Country`} defaultValue={v.country ?? "Australia"} /></FormField>
      <FormField label="Phone"><Input name={`${prefix}Phone`} defaultValue={v.phone ?? ""} /></FormField>
      <FormField label="Instructions"><Input name={`${prefix}Instructions`} defaultValue={v.instructions ?? ""} /></FormField>
    </div>
  );
}

function AddrView({ title, a, note }: { title: string; a: Snap; note?: string }) {
  return (
    <div>
      <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-gold">{title}</div>
      {note && <div className="text-xs text-muted">{note}</div>}
      <div className="text-grey">
        {a.fullName && <div>{a.fullName}</div>}
        {a.company && <div>{a.company}</div>}
        {a.line1 && <div>{a.line1}</div>}
        {a.line2 && <div>{a.line2}</div>}
        <div>{[a.city, a.region, a.postalCode].filter(Boolean).join(" ")}</div>
        {a.country && <div>{a.country}</div>}
        {a.phone && <div className="text-muted">📞 {a.phone}</div>}
        {a.instructions && <div className="mt-1 text-xs text-muted">“{a.instructions}”</div>}
      </div>
    </div>
  );
}

// ───────────────────────── Delivery ─────────────────────────

export function DeliveryCard({ orderId, d }: {
  orderId: string;
  d: { carrier: string | null; trackingNumber: string | null; trackingUrl: string | null; dispatchedAt: Date | string | null; estimatedDeliveryAt: Date | string | null; deliveredAt: Date | string | null; proofOfDelivery: string | null; deliveryNotes: string | null };
}) {
  const [edit, setEdit] = useState(false);
  const { pending, save } = useSave("Delivery updated");

  return (
    <Panel>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-lg">Delivery</h3>
        <button onClick={() => setEdit((v) => !v)} className="text-muted hover:text-gold"><Pencil className="h-4 w-4" /></button>
      </div>
      {edit ? (
        <form action={(fd) => save(() => updateDelivery(orderId, fd), () => setEdit(false))}>
          <div className="grid grid-cols-2 gap-x-4">
            <FormField label="Courier / Carrier"><Input name="carrier" defaultValue={d.carrier ?? ""} /></FormField>
            <FormField label="Tracking #"><Input name="trackingNumber" defaultValue={d.trackingNumber ?? ""} /></FormField>
          </div>
          <FormField label="Tracking URL"><Input name="trackingUrl" defaultValue={d.trackingUrl ?? ""} /></FormField>
          <div className="grid grid-cols-3 gap-x-4">
            <FormField label="Dispatched"><Input type="datetime-local" name="dispatchedAt" defaultValue={dtInput(d.dispatchedAt)} /></FormField>
            <FormField label="Est. Delivery"><Input type="datetime-local" name="estimatedDeliveryAt" defaultValue={dtInput(d.estimatedDeliveryAt)} /></FormField>
            <FormField label="Delivered"><Input type="datetime-local" name="deliveredAt" defaultValue={dtInput(d.deliveredAt)} /></FormField>
          </div>
          <FormField label="Proof of Delivery (url/note)"><Input name="proofOfDelivery" defaultValue={d.proofOfDelivery ?? ""} /></FormField>
          <FormField label="Delivery Notes"><Textarea name="deliveryNotes" rows={2} defaultValue={d.deliveryNotes ?? ""} /></FormField>
          <div className="flex gap-2"><Button type="submit" variant="gold" loading={pending}>Save</Button><Button type="button" variant="ghost" onClick={() => setEdit(false)}>Cancel</Button></div>
        </form>
      ) : (
        <dl className="space-y-1.5 text-sm">
          <Row k="Courier" v={d.carrier || "—"} />
          <Row k="Tracking" v={d.trackingNumber ? (d.trackingUrl ? <a href={d.trackingUrl} target="_blank" rel="noreferrer" className="text-gold hover:underline">{d.trackingNumber}</a> : d.trackingNumber) : "—"} />
          <Row k="Dispatched" v={fmt(d.dispatchedAt)} />
          <Row k="Est. Delivery" v={fmt(d.estimatedDeliveryAt)} />
          <Row k="Delivered" v={fmt(d.deliveredAt)} />
          {d.proofOfDelivery && <Row k="POD" v={d.proofOfDelivery} />}
          {d.deliveryNotes && <Row k="Notes" v={d.deliveryNotes} />}
        </dl>
      )}
    </Panel>
  );
}

// ───────────────────────── Internal notes ─────────────────────────

export function InternalNotesCard({ orderId, notes }: { orderId: string; notes: Record<string, string> }) {
  const [edit, setEdit] = useState(false);
  const { pending, save } = useSave("Notes saved");
  const KEYS: [string, string][] = [["packing", "Packing"], ["delivery", "Delivery"], ["warehouse", "Warehouse"], ["support", "Support"], ["refund", "Refund"]];

  return (
    <Panel>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-lg">Internal Notes <span className="text-xs text-muted">· staff only</span></h3>
        <button onClick={() => setEdit((v) => !v)} className="text-muted hover:text-gold"><Pencil className="h-4 w-4" /></button>
      </div>
      {edit ? (
        <form action={(fd) => save(() => saveInternalNotes(orderId, fd), () => setEdit(false))}>
          {KEYS.map(([k, lbl]) => <FormField key={k} label={lbl}><Textarea name={k} rows={2} defaultValue={notes[k] ?? ""} /></FormField>)}
          <div className="flex gap-2"><Button type="submit" variant="gold" loading={pending}>Save</Button><Button type="button" variant="ghost" onClick={() => setEdit(false)}>Cancel</Button></div>
        </form>
      ) : (
        <dl className="space-y-1.5 text-sm">
          {KEYS.filter(([k]) => notes[k]).map(([k, lbl]) => <Row key={k} k={lbl} v={notes[k]} />)}
          {KEYS.every(([k]) => !notes[k]) && <p className="text-sm text-muted">No internal notes.</p>}
        </dl>
      )}
    </Panel>
  );
}

// ───────────────────────── Documents ─────────────────────────

export function DocumentsCard({ number }: { number: string }) {
  const DOCS = [
    { doc: "invoice", label: "Invoice" },
    { doc: "packing-slip", label: "Packing Slip" },
    { doc: "tax-invoice", label: "Tax Invoice" },
    { doc: "credit-note", label: "Credit Note" },
    { doc: "label", label: "Shipping Label" },
  ];
  return (
    <Panel>
      <h3 className="mb-3 font-serif text-lg">Documents</h3>
      <div className="flex flex-col gap-1.5">
        {DOCS.map((d) => (
          <a key={d.doc} href={`/print/orders/${number}/${d.doc}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-grey hover:bg-white/5 hover:text-cream">
            <Printer className="h-4 w-4 text-gold" /> {d.label}
          </a>
        ))}
      </div>
    </Panel>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-4"><dt className="text-muted">{k}</dt><dd className="text-right text-grey">{v}</dd></div>;
}
