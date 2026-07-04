"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, Mail, Phone, MessageSquare, Copy } from "lucide-react";
import { OrderStatusPill, PaymentStatusPill, Select, buttonClasses } from "@/components/ui";
import { ORDER_STATUSES } from "./OrderStatusSelect";
import { CustomerProfileDrawer } from "./CustomerProfileDrawer";
import { bulkOrderAction } from "@/actions/orders";
import { formatMoney, formatDate } from "@/lib/format";

interface Row {
  id: string;
  number: string;
  customerName: string;
  guestEmail: string | null;
  totalCents: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  assignedToName: string | null;
  placedAt: Date | string;
  _count: { items: number };
  user: { id: string; phone: string | null; email: string | null; company: string | null } | null;
}

function copy(text: string, label: string) {
  navigator.clipboard?.writeText(text);
  toast(`${label} copied`);
}

function ContactCell({ email, phone }: { email: string | null; phone: string | null }) {
  const digits = phone?.replace(/[^\d]/g, "") ?? "";
  return (
    <div className="flex flex-col gap-1 text-[12px]">
      {email ? (
        <div className="flex items-center gap-1.5">
          <a href={`mailto:${email}`} className="flex items-center gap-1 text-grey hover:text-gold" title="Send email"><Mail className="h-3.5 w-3.5" /><span className="max-w-[160px] truncate">{email}</span></a>
          <button onClick={() => copy(email, "Email")} className="text-muted hover:text-gold" title="Copy email"><Copy className="h-3 w-3" /></button>
        </div>
      ) : <span className="text-muted">no email</span>}
      {phone ? (
        <div className="flex items-center gap-1.5">
          <a href={`tel:${phone}`} className="flex items-center gap-1 text-grey hover:text-gold" title="Call"><Phone className="h-3.5 w-3.5" />{phone}</a>
          {digits && <a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer" className="text-muted hover:text-green" title="WhatsApp"><MessageSquare className="h-3 w-3" /></a>}
          <button onClick={() => copy(phone, "Phone")} className="text-muted hover:text-gold" title="Copy phone"><Copy className="h-3 w-3" /></button>
        </div>
      ) : <span className="text-muted">no mobile</span>}
    </div>
  );
}

const label = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");

export function OrdersTable({ orders, page, pages, query }: { orders: Row[]; page: number; pages: number; query: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [action, setAction] = useState("status");
  const [value, setValue] = useState("PROCESSING");

  const [profile, setProfile] = useState<{ id: string; name: string } | null>(null);

  const allChecked = orders.length > 0 && orders.every((o) => sel.has(o.id));
  const toggleAll = () => setSel(allChecked ? new Set() : new Set(orders.map((o) => o.id)));
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  function applyBulk() {
    const ids = [...sel];
    start(async () => {
      const res = await bulkOrderAction(ids, action, action === "status" || action === "assign" ? value : undefined);
      if (res?.error) toast.error(res.error);
      else toast.success(`Updated ${res.count} order${res.count === 1 ? "" : "s"}`);
      setSel(new Set());
      router.refresh();
    });
  }

  const pageHref = (p: number) => `/admin/orders?${query}${query ? "&" : ""}page=${p}`;

  return (
    <div>
      {sel.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-card border border-line-gold bg-card p-3 text-sm">
          <span className="text-gold">{sel.size} selected</span>
          <Select value={action} onChange={(e) => setAction(e.target.value)} className="w-auto py-1.5 text-xs">
            <option value="status">Set status</option>
            <option value="assign">Assign to</option>
            <option value="archive">Archive</option>
            <option value="unarchive">Restore</option>
          </Select>
          {action === "status" && (
            <Select value={value} onChange={(e) => setValue(e.target.value)} className="w-auto py-1.5 text-xs">
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </Select>
          )}
          {action === "assign" && (
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Staff name" className="rounded-lg border border-line bg-panel px-2.5 py-1.5 text-xs text-cream outline-none focus:border-gold" />
          )}
          <button onClick={applyBulk} disabled={pending} className={buttonClasses("gold", "sm")}>Apply</button>
          <button onClick={() => setSel(new Set())} className={buttonClasses("ghost", "sm")}>Cancel</button>
        </div>
      )}

      <div className="overflow-x-auto rounded-card border border-line bg-card">
        <table className="atable">
          <thead>
            <tr>
              <th className="w-8"><input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-gold" /></th>
              <th>Order</th><th>Customer</th><th>Contact</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Assigned</th><th>Date</th><th></th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan={11} className="py-8 text-center text-muted">No orders match these filters.</td></tr>}
            {orders.map((o) => (
              <tr key={o.id}>
                <td><input type="checkbox" checked={sel.has(o.id)} onChange={() => toggle(o.id)} className="accent-gold" /></td>
                <td><Link href={`/admin/orders/${o.number}`} className="font-medium text-gold hover:underline">{o.number}</Link></td>
                <td>
                  {o.user?.id ? (
                    <button onClick={() => setProfile({ id: o.user!.id, name: o.customerName })} className="text-left font-medium text-cream hover:text-gold">{o.customerName}</button>
                  ) : (
                    <span>{o.customerName}</span>
                  )}
                  {o.user?.company && <div className="text-[11px] text-muted">{o.user.company}</div>}
                </td>
                <td><ContactCell email={o.user?.email ?? o.guestEmail} phone={o.user?.phone ?? null} /></td>
                <td>{o._count.items}</td>
                <td>{formatMoney(o.totalCents)}</td>
                <td><div className="flex flex-col gap-1"><span className="text-[11px] text-muted">{label(o.paymentMethod)}</span><PaymentStatusPill status={o.paymentStatus} /></div></td>
                <td><OrderStatusPill status={o.status} /></td>
                <td className="text-muted">{o.assignedToName ?? "—"}</td>
                <td className="text-muted">{formatDate(o.placedAt)}</td>
                <td><Link href={`/admin/orders/${o.number}`} className="text-muted hover:text-gold" aria-label="View"><Eye className="h-4 w-4" /></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 ? <Link href={pageHref(page - 1)} className={buttonClasses("outline", "sm")}>← Prev</Link> : <span className={buttonClasses("outline", "sm") + " pointer-events-none opacity-40"}>← Prev</span>}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages ? <Link href={pageHref(page + 1)} className={buttonClasses("outline", "sm")}>Next →</Link> : <span className={buttonClasses("outline", "sm") + " pointer-events-none opacity-40"}>Next →</span>}
        </div>
      )}

      {profile && <CustomerProfileDrawer userId={profile.id} name={profile.name} onClose={() => setProfile(null)} />}
    </div>
  );
}
