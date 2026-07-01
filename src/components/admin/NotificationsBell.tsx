"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, ShoppingBag, Boxes, Star, MessageSquare, UserPlus } from "lucide-react";
import { timeAgo } from "@/lib/format";
import type { AdminNotification } from "@/lib/data/admin";

const ICONS = {
  order: ShoppingBag,
  stock: Boxes,
  review: Star,
  comment: MessageSquare,
  customer: UserPlus,
} as const;

export function NotificationsBell({ items }: { items: AdminNotification[] }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={box} className="relative">
      <button onClick={() => setOpen((v) => !v)} className="relative text-grey hover:text-gold" aria-label="Notifications">
        <Bell className="h-5 w-5" strokeWidth={1.5} />
        {items.length > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-ink">
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-30 max-h-[70vh] w-[340px] overflow-y-auto rounded-card border border-line-gold bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <b className="text-sm font-normal">Notifications</b>
            <Link href="/admin/notifications" onClick={() => setOpen(false)} className="text-xs text-gold hover:underline">View all</Link>
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">You’re all caught up.</p>
          ) : (
            items.slice(0, 10).map((n) => {
              const Icon = ICONS[n.type];
              return (
                <Link key={n.id} href={n.href} onClick={() => setOpen(false)} className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-0 hover:bg-white/5">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} />
                  <div className="min-w-0">
                    <p className="text-sm text-grey">{n.text}</p>
                    <span className="text-[11px] text-muted">{timeAgo(n.at)}</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
