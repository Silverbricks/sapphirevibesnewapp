"use client";

import { useState } from "react";
import { Button, Panel } from "@/components/ui";
import { TrackTimeline } from "@/components/storefront/TrackTimeline";
import { trackOrder, type TrackedOrder } from "@/actions/storefront";
import { formatDate, formatMoney } from "@/lib/format";

export default function TrackPage() {
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await trackOrder(number, email);
    setLoading(false);
    if (res.ok) {
      setOrder(res.order);
    } else {
      setOrder(null);
      setError(res.message);
    }
  }

  return (
    <div className="py-16">
      <div className="wrap max-w-3xl">
        <span className="eyebrow">Order Tracking</span>
        <h1 className="mb-6 text-[clamp(34px,4.6vw,52px)]">Track Your Order</h1>

        <form onSubmit={onSubmit} className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.12em] text-muted">Order Number</label>
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="SV-10482"
              required
              className="w-full rounded-[9px] border border-line bg-panel px-3.5 py-3 text-sm text-cream outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.12em] text-muted">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
              className="w-full rounded-[9px] border border-line bg-panel px-3.5 py-3 text-sm text-cream outline-none focus:border-gold"
            />
          </div>
          <Button variant="gold" size="lg" loading={loading} type="submit">
            Track
          </Button>
        </form>

        {error && <p className="text-sm text-red">{error}</p>}

        {order && (
          <Panel>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-serif text-2xl">Order {order.number}</h3>
              <span className="text-sm text-muted">Placed {formatDate(order.placedAt)}</span>
            </div>
            <div className="mb-8 text-sm text-muted">Total {formatMoney(order.totalCents)}</div>
            <TrackTimeline status={order.status} />
            {order.trackingNumber && (
              <p className="mt-6 text-center text-sm text-muted">
                Tracking number <span className="text-gold">{order.trackingNumber}</span>
                {order.carrier ? ` via ${order.carrier}` : ""}.
              </p>
            )}
            <div className="mt-6 space-y-2 border-t border-line pt-4">
              {order.items.map((it, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{it.name}</span>
                  <span className="text-muted">Qty {it.quantity}</span>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
