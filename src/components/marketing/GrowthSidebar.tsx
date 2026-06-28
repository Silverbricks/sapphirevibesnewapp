"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TrendingUp, Tag, Ticket, Mail, Gem, Crown, Share2, Gift,
  Users, BarChart3, Grid3x3, ArrowLeft, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/storefront/Logo";

type Item = { href: string; label: string; icon: LucideIcon };

const GROUPS: { title: string; items: Item[] }[] = [
  { title: "Overview", items: [{ href: "/growth", label: "Growth Hub", icon: TrendingUp }] },
  {
    title: "Acquisition",
    items: [
      { href: "/growth/promotions", label: "Promotions", icon: Tag },
      { href: "/growth/coupons", label: "Coupons", icon: Ticket },
      { href: "/growth/email", label: "Email & Newsletter", icon: Mail },
    ],
  },
  {
    title: "Retention",
    items: [
      { href: "/growth/loyalty", label: "Loyalty & Rewards", icon: Gem },
      { href: "/growth/vip", label: "Sapphire Elite", icon: Crown },
      { href: "/growth/referrals", label: "Referrals", icon: Share2 },
      { href: "/growth/gifts", label: "Gift Centre", icon: Gift },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { href: "/growth/crm", label: "CRM Segments", icon: Users },
      { href: "/growth/analytics", label: "Analytics (BI)", icon: BarChart3 },
      { href: "/growth/integrations", label: "Integrations", icon: Grid3x3 },
    ],
  },
];

export function GrowthSidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[248px] flex-col overflow-y-auto border-r border-line bg-ink max-lg:w-[64px]">
      <div className="border-b border-line px-[22px] py-6">
        <Logo size={22} className="max-lg:hidden" />
        <div className="mt-3 text-[10px] uppercase tracking-[0.2em] text-purple max-lg:hidden">Marketing &amp; Growth</div>
      </div>
      {GROUPS.map((group) => (
        <div key={group.title} className="py-3">
          <h6 className="px-[22px] pb-2 text-[10px] uppercase tracking-[0.2em] text-muted max-lg:hidden">{group.title}</h6>
          {group.items.map((item) => {
            const active = item.href === "/growth" ? pathname === "/growth" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 border-l-2 px-[22px] py-2.5 text-sm transition-colors max-lg:justify-center",
                  active ? "border-purple bg-purple/[0.08] text-purple" : "border-transparent text-grey hover:bg-white/[0.03] hover:text-cream",
                )}
              >
                <item.icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.5} />
                <span className="max-lg:hidden">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
      <Link href="/admin" className="mt-auto flex items-center gap-2 border-t border-line px-[22px] py-4 text-xs text-muted hover:text-gold max-lg:justify-center">
        <ArrowLeft className="h-4 w-4" /> <span className="max-lg:hidden">Store Admin</span>
      </Link>
    </aside>
  );
}
