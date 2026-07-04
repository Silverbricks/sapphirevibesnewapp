"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Mail, Phone, Loader2 } from "lucide-react";
import { Pill, OrderStatusPill } from "@/components/ui";
import { loadCustomerProfile } from "@/actions/orders";
import { formatMoney, formatDate } from "@/lib/format";
import type { CustomerProfile } from "@/lib/data/orders";

export function CustomerProfileDrawer({ userId, name, onClose }: { userId: string; name: string; onClose: () => void }) {
  const [data, setData] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    loadCustomerProfile(userId).then((d) => { if (live) { setData(d); setLoading(false); } });
    return () => { live = false; };
  }, [userId]);

  const addr = (a: Record<string, string> | null) =>
    a ? [a.fullName, a.company, a.line1, a.line2, [a.city, a.region, a.postalCode].filter(Boolean).join(" "), a.country].filter(Boolean) : [];

  return (
    <div className="fixed inset-0 z-[115] flex justify-end bg-ink/70" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-y-auto border-l border-line-gold bg-bg" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-bg px-5 py-4">
          <h3 className="font-serif text-xl">{name}</h3>
          <button onClick={onClose} className="text-muted hover:text-cream"><X className="h-5 w-5" /></button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
        ) : !data ? (
          <p className="p-6 text-sm text-muted">Customer not found.</p>
        ) : (
          <div className="space-y-5 p-5">
            <div className="flex flex-wrap items-center gap-2">
              {data.customerType && <Pill color={data.customerType === "VIP" ? "gold" : "blue"}>{data.customerType}</Pill>}
              <span className="text-xs text-muted">Customer since {formatDate(data.createdAt)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-card border border-line bg-card p-3"><div className="text-[10px] uppercase tracking-[0.14em] text-muted">Total Spend</div><div className="font-serif text-xl text-gold">{formatMoney(data.totalSpendCents)}</div></div>
              <div className="rounded-card border border-line bg-card p-3"><div className="text-[10px] uppercase tracking-[0.14em] text-muted">Orders</div><div className="font-serif text-xl">{data.orderCount}</div></div>
              <div className="rounded-card border border-line bg-card p-3"><div className="text-[10px] uppercase tracking-[0.14em] text-muted">Loyalty Points</div><div className="font-serif text-xl">{data.pointsBalance}</div></div>
              <div className="rounded-card border border-line bg-card p-3"><div className="text-[10px] uppercase tracking-[0.14em] text-muted">Type</div><div className="font-serif text-xl">{data.customerType ?? "—"}</div></div>
            </div>

            <div className="space-y-1.5 text-sm">
              {data.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted" /><a href={`mailto:${data.email}`} className="text-grey hover:text-gold">{data.email}</a></div>}
              {data.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted" /><a href={`tel:${data.phone}`} className="text-grey hover:text-gold">{data.phone}</a></div>}
              {data.alternatePhone && <div className="flex items-center gap-2 text-muted"><Phone className="h-4 w-4" /> {data.alternatePhone} <span className="text-[11px]">(alt)</span></div>}
              {data.company && <div className="text-grey">🏢 {data.company}{data.abn ? ` · ABN ${data.abn}` : ""}</div>}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AddrCard title="Delivery Address" lines={addr(data.shipping)} />
              <AddrCard title="Billing Address" lines={addr(data.billing)} />
            </div>

            {data.notes && <div className="rounded-card border border-line bg-card p-3 text-sm"><div className="mb-1 text-[10px] uppercase tracking-[0.14em] text-muted">Customer Notes</div><p className="text-grey">{data.notes}</p></div>}

            <div>
              <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-muted">Recent Orders</div>
              <div className="space-y-1.5">
                {data.recentOrders.map((o) => (
                  <Link key={o.number} href={`/admin/orders/${o.number}`} onClick={onClose} className="flex items-center justify-between rounded-card border border-line bg-card px-3 py-2 text-sm hover:border-line-gold">
                    <span className="text-gold">{o.number}</span>
                    <span className="flex items-center gap-2"><OrderStatusPill status={o.status} /><span className="text-grey">{formatMoney(o.totalCents)}</span></span>
                  </Link>
                ))}
                {data.recentOrders.length === 0 && <p className="text-sm text-muted">No orders yet.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AddrCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-card border border-line bg-card p-3 text-sm">
      <div className="mb-1 text-[10px] uppercase tracking-[0.14em] text-gold">{title}</div>
      {lines.length ? lines.map((l, i) => <div key={i} className="text-grey">{l}</div>) : <div className="text-muted">—</div>}
    </div>
  );
}
