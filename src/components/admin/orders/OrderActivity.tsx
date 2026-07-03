"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Phone, MessageSquare, Mail, Send, X } from "lucide-react";
import { Panel, Input, Textarea, Select, FormField, Button, Pill, type PillColor } from "@/components/ui";
import { addOrderNote, logCommunication, sendOrderEmail, createReturn, updateReturnStatus } from "@/actions/orders";

interface Ev { id: string; kind: string; label: string; body: string | null; staffName: string | null; createdAt: Date | string }

const fmt = (d: Date | string) => new Date(d).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// ───────────────────────── Timeline ─────────────────────────

export function TimelineCard({ orderId, events }: { orderId: string; events: Ev[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [key, setKey] = useState(0);
  const timeline = events.filter((e) => ["STATUS", "SYSTEM", "NOTE", "RETURN"].includes(e.kind));

  return (
    <Panel>
      <h3 className="mb-4 font-serif text-lg">Order Timeline</h3>
      <div className="space-y-3">
        {timeline.map((e) => (
          <div key={e.id} className="flex gap-3">
            <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-gold" />
            <div className="min-w-0 flex-1 border-b border-line pb-3">
              <div className="text-sm text-cream">{e.label}</div>
              {e.body && <div className="text-xs text-grey">{e.body}</div>}
              <div className="text-[11px] text-muted">{fmt(e.createdAt)}{e.staffName ? ` · ${e.staffName}` : ""}</div>
            </div>
          </div>
        ))}
        {timeline.length === 0 && <p className="text-sm text-muted">No events yet.</p>}
      </div>
      <form key={key} action={(fd) => start(async () => { const r = await addOrderNote(orderId, fd); if (r?.error) toast.error(r.error); else { toast.success("Note added"); setKey((k) => k + 1); router.refresh(); } })} className="mt-4 flex gap-2">
        <Input name="note" placeholder="Add an internal timeline note…" />
        <Button type="submit" variant="gold" loading={pending}>Add</Button>
      </form>
    </Panel>
  );
}

// ───────────────────────── Communications ─────────────────────────

export function CommunicationsCard({ orderId, email, phone, events }: { orderId: string; email: string | null; phone: string | null; events: Ev[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [compose, setCompose] = useState(false);
  const comms = events.filter((e) => ["EMAIL", "SMS", "CALL"].includes(e.kind));
  const digits = phone?.replace(/[^\d]/g, "") ?? "";

  const quick = (kind: string, label: string, href: string) => {
    window.open(href, "_blank");
    start(async () => { await logCommunication(orderId, kind, label); router.refresh(); });
  };

  return (
    <Panel>
      <h3 className="mb-3 font-serif text-lg">Customer Contact</h3>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Qa icon={Phone} label="Call" disabled={!phone} onClick={() => quick("CALL", "Called customer", `tel:${phone}`)} />
        <Qa icon={Mail} label="Email" disabled={!email} onClick={() => setCompose(true)} />
        <Qa icon={MessageSquare} label="SMS" disabled={!phone} onClick={() => quick("SMS", "SMS opened", `sms:${phone}`)} />
        <Qa icon={Send} label="WhatsApp" disabled={!digits} onClick={() => quick("SMS", "WhatsApp opened", `https://wa.me/${digits}`)} />
      </div>

      <h4 className="mb-2 text-[11px] uppercase tracking-[0.14em] text-muted">Communication History</h4>
      <div className="space-y-2">
        {comms.map((e) => (
          <div key={e.id} className="rounded-card border border-line p-2.5 text-sm">
            <div className="flex items-center justify-between"><span className="text-cream">{e.label}</span><Pill color={e.kind === "EMAIL" ? "blue" : e.kind === "SMS" ? "purple" : "grey"}>{e.kind}</Pill></div>
            {e.body && <div className="text-xs text-grey">{e.body}</div>}
            <div className="text-[11px] text-muted">{fmt(e.createdAt)}{e.staffName ? ` · ${e.staffName}` : ""}</div>
          </div>
        ))}
        {comms.length === 0 && <p className="text-sm text-muted">No messages yet.</p>}
      </div>

      {compose && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 p-4" onClick={() => setCompose(false)}>
          <div className="relative w-full max-w-md rounded-panel border border-line-gold bg-bg p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setCompose(false)} className="absolute right-4 top-4 text-muted hover:text-cream"><X className="h-5 w-5" /></button>
            <h3 className="mb-4 font-serif text-xl">Email {email}</h3>
            <form action={(fd) => start(async () => {
              const r = await sendOrderEmail(orderId, "custom", { subject: (fd.get("subject") as string) || "", body: (fd.get("body") as string) || "" });
              if (r?.error) toast.error(r.error); else { toast.success("Email sent"); setCompose(false); router.refresh(); }
            })}>
              <FormField label="Subject"><Input name="subject" required /></FormField>
              <FormField label="Message"><Textarea name="body" rows={5} required /></FormField>
              <Button type="submit" variant="gold" loading={pending} className="w-full justify-center">Send Email</Button>
              <p className="mt-2 text-center text-[11px] text-muted">Requires RESEND_API_KEY on the server.</p>
            </form>
          </div>
        </div>
      )}
    </Panel>
  );
}

function Qa({ icon: Icon, label, onClick, disabled }: { icon: React.ElementType; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex flex-col items-center gap-1 rounded-card border border-line py-2.5 text-xs text-grey transition-colors hover:border-line-gold hover:text-cream disabled:opacity-30">
      <Icon className="h-4 w-4 text-gold" /> {label}
    </button>
  );
}

// ───────────────────────── Returns ─────────────────────────

interface Ret { id: string; number: string; status: string; reason: string | null; refundCents: number; notes: string | null; createdAt: Date | string }
const RET_COLOR: Record<string, PillColor> = { REQUESTED: "amber", APPROVED: "blue", RECEIVED: "blue", REFUNDED: "green", REJECTED: "red" };
const RET_STATUSES = ["REQUESTED", "APPROVED", "RECEIVED", "REFUNDED", "REJECTED"];

export function ReturnsCard({ orderId, returns }: { orderId: string; returns: Ret[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);

  return (
    <Panel>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-lg">Returns & Exchanges</h3>
        <Button variant="dark" size="sm" onClick={() => setOpen((v) => !v)}>{open ? "Close" : "New Return"}</Button>
      </div>

      {open && (
        <form key={key} action={(fd) => start(async () => { const r = await createReturn(orderId, fd); if (r?.error) toast.error(r.error); else { toast.success("Return created"); setOpen(false); setKey((k) => k + 1); router.refresh(); } })} className="mb-4 rounded-card border border-line p-3">
          <div className="grid grid-cols-2 gap-x-4">
            <FormField label="Reason"><Input name="reason" placeholder="Changed mind" /></FormField>
            <FormField label="Refund ($)"><Input name="refund" type="number" step="0.01" placeholder="0.00" /></FormField>
          </div>
          <FormField label="Notes"><Textarea name="notes" rows={2} /></FormField>
          <Button type="submit" variant="gold" loading={pending}>Create Return</Button>
        </form>
      )}

      <div className="space-y-2">
        {returns.map((r) => (
          <div key={r.id} className="rounded-card border border-line p-3 text-sm">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-medium text-cream">{r.number}</span>
              <div className="flex items-center gap-2">
                <Pill color={RET_COLOR[r.status] ?? "grey"}>{r.status.charAt(0) + r.status.slice(1).toLowerCase()}</Pill>
                <Select value={r.status} onChange={(e) => start(async () => { await updateReturnStatus(r.id, e.target.value); toast.success("Return updated"); router.refresh(); })} className="w-auto py-1 text-xs">
                  {RET_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                </Select>
              </div>
            </div>
            {r.reason && <div className="text-grey">{r.reason}</div>}
            {r.refundCents > 0 && <div className="text-xs text-muted">Refund: ${(r.refundCents / 100).toFixed(2)}</div>}
            {r.notes && <div className="text-xs text-muted">{r.notes}</div>}
          </div>
        ))}
        {returns.length === 0 && <p className="text-sm text-muted">No returns for this order.</p>}
      </div>
    </Panel>
  );
}
