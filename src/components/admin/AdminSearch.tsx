"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";

interface Results {
  products: { id: string; name: string; sku: string }[];
  orders: { id: string; number: string; status: string }[];
  customers: { id: string; name: string | null; email: string }[];
  posts: { id: string; title: string }[];
}

const EMPTY: Results = { products: [], orders: [], customers: [], posts: [] };

export function AdminSearch() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Results>(EMPTY);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) { setRes(EMPTY); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
        setRes(r.ok ? await r.json() : EMPTY);
      } catch { setRes(EMPTY); }
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const total = res.products.length + res.orders.length + res.customers.length + res.posts.length;

  return (
    <div ref={box} className="relative w-[340px] max-w-[40vw]">
      <div className="flex items-center gap-2.5 rounded-[9px] border border-line bg-panel px-3.5 py-2.5">
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted" /> : <Search className="h-4 w-4 text-muted" strokeWidth={1.5} />}
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search products, orders, customers…"
          className="w-full bg-transparent text-[13px] text-cream outline-none placeholder:text-muted"
        />
      </div>

      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-[46px] z-30 max-h-[70vh] overflow-y-auto rounded-card border border-line-gold bg-card p-2 shadow-2xl">
          {total === 0 && !loading && <p className="px-3 py-4 text-center text-sm text-muted">No results for “{q}”.</p>}
          <Group label="Products" items={res.products.map((p) => ({ id: p.id, href: `/admin/products/${p.id}`, primary: p.name, secondary: p.sku }))} onGo={() => setOpen(false)} />
          <Group label="Orders" items={res.orders.map((o) => ({ id: o.id, href: `/admin/orders/${o.number}`, primary: o.number, secondary: o.status }))} onGo={() => setOpen(false)} />
          <Group label="Customers" items={res.customers.map((c) => ({ id: c.id, href: `/admin/customers`, primary: c.name ?? c.email, secondary: c.email }))} onGo={() => setOpen(false)} />
          <Group label="Blog Posts" items={res.posts.map((p) => ({ id: p.id, href: `/admin/content/blog/${p.id}`, primary: p.title }))} onGo={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

function Group({
  label,
  items,
  onGo,
}: {
  label: string;
  items: { id: string; href: string; primary: string; secondary?: string }[];
  onGo: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-1">
      <div className="px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-muted">{label}</div>
      {items.map((i) => (
        <Link key={i.id} href={i.href} onClick={onGo} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-white/5">
          <span className="truncate text-cream">{i.primary}</span>
          {i.secondary && <span className="ml-3 shrink-0 text-xs text-muted">{i.secondary}</span>}
        </Link>
      ))}
    </div>
  );
}
