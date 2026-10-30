"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Truck, Printer, Undo2, Ban, Archive, Copy, RotateCcw, X, Banknote } from "lucide-react";
import { Panel, Input, Textarea, Select, FormField, Button, buttonClasses } from "@/components/ui";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { sendOrderEmail, recordPayment, refundOrder, cancelOrder, setArchived, duplicateOrder } from "@/actions/orders";
import { PAYMENT_METHODS_CATALOGUE } from "@/lib/constants";
import { formatMoney } from "@/lib/format";

const CATALOGUE: { key: string; label: string }[] = PAYMENT_METHODS_CATALOGUE.map((m) => ({ key: m.key, label: m.label }));

export function OrderActionsBar({
  orderId,
  number,
  status,
  archived,
  paymentStatus,
  paymentMethod,
  totalCents,
}: {
  orderId: string;
  number: string;
  status: string;
  archived: boolean;
  paymentStatus: string;
  paymentMethod: string;
  totalCents: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [refundOpen, setRefundOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  // Cash on Delivery / Bank Transfer / manual orders are placed unpaid and
  // settled here once the money actually lands.
  const awaitingPayment = paymentStatus === "UNPAID" || paymentStatus === "AUTHORIZED" || paymentStatus === "FAILED";
  // legacy / seeded methods (MOCK, GIFT_CARD) are not in the settings catalogue — keep them selectable
  const methodOptions = CATALOGUE.some((m) => m.key === paymentMethod)
    ? CATALOGUE
    : [{ key: paymentMethod, label: paymentMethod.replace(/_/g, " ") }, ...CATALOGUE];

  const run = (fn: () => Promise<{ error?: string } | { ok: true } | void>, ok: string) =>
    start(async () => {
      const res = await fn();
      if (res && "error" in res && res.error) toast.error(res.error);
      else toast.success(ok);
      router.refresh();
    });

  const print = (doc: string) => window.open(`/print/orders/${number}/${doc}`, "_blank");

  return (
    <Panel>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-lg">Actions</h3>
        <OrderStatusSelect orderId={orderId} current={status} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {awaitingPayment && (
          <ActBtn icon={Banknote} label="Record Payment" onClick={() => setPayOpen(true)} disabled={pending} />
        )}
        <ActBtn icon={Mail} label="Email Invoice" onClick={() => run(() => sendOrderEmail(orderId, "invoice"), "Invoice emailed")} disabled={pending} />
        <ActBtn icon={Truck} label="Email Tracking" onClick={() => run(() => sendOrderEmail(orderId, "tracking"), "Tracking emailed")} disabled={pending} />
        <ActBtn icon={Printer} label="Invoice" onClick={() => print("invoice")} />
        <ActBtn icon={Printer} label="Packing Slip" onClick={() => print("packing-slip")} />
        <ActBtn icon={Printer} label="Tax Invoice" onClick={() => print("tax-invoice")} />
        <ActBtn icon={Printer} label="Ship Label" onClick={() => print("label")} />
        <ActBtn icon={Undo2} label="Refund" onClick={() => setRefundOpen(true)} disabled={pending} />
        <ActBtn icon={Ban} label="Cancel" onClick={() => { if (confirm("Cancel this order?")) run(() => cancelOrder(orderId), "Order cancelled"); }} disabled={pending} />
        <ActBtn icon={Copy} label="Duplicate" onClick={() => run(() => duplicateOrder(orderId), "Duplicated")} disabled={pending} />
        {archived ? (
          <ActBtn icon={RotateCcw} label="Restore" onClick={() => run(() => setArchived(orderId, false), "Restored")} disabled={pending} />
        ) : (
          <ActBtn icon={Archive} label="Archive" onClick={() => run(() => setArchived(orderId, true), "Archived")} disabled={pending} />
        )}
      </div>

      {payOpen && (
        <Modal title="Record a Payment" onClose={() => setPayOpen(false)}>
          <form action={(fd) => run(async () => { const r = await recordPayment(orderId, fd); setPayOpen(false); return r; }, "Payment recorded")}>
            <FormField label="Paid with">
              <Select name="method" defaultValue={paymentMethod}>
                {methodOptions.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
              </Select>
            </FormField>
            <FormField label="Reference (optional)"><Input name="reference" placeholder="Receipt no. / transfer ID…" /></FormField>
            <Button type="submit" variant="gold" loading={pending} className="w-full justify-center">Mark {formatMoney(totalCents)} as Paid</Button>
            <p className="mt-2 text-center text-[11px] text-muted">Records the payment only — no payment-gateway charge is made.</p>
          </form>
        </Modal>
      )}

      {refundOpen && (
        <Modal title="Record a Refund" onClose={() => setRefundOpen(false)}>
          <form action={(fd) => run(async () => { const r = await refundOrder(orderId, fd); setRefundOpen(false); return r; }, "Refund recorded")}>
            <FormField label="Amount ($) — blank = full total"><Input name="amount" type="number" step="0.01" placeholder="0.00" /></FormField>
            <FormField label="Reason"><Textarea name="reason" rows={2} placeholder="Damaged in transit…" /></FormField>
            <Button type="submit" variant="gold" loading={pending} className="w-full justify-center">Record Refund</Button>
            <p className="mt-2 text-center text-[11px] text-muted">Records the refund only — no payment-gateway charge is made.</p>
          </form>
        </Modal>
      )}
    </Panel>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 p-4" onClick={onClose}>
      <div className="relative w-full max-w-sm rounded-panel border border-line-gold bg-bg p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted hover:text-cream"><X className="h-5 w-5" /></button>
        <h3 className="mb-4 font-serif text-xl">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function ActBtn({ icon: Icon, label, onClick, disabled }: { icon: React.ElementType; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className={buttonClasses("dark", "sm") + " justify-start disabled:opacity-40"}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
