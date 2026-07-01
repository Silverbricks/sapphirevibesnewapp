"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Boxes, Package, LayoutGrid, Layers, Tag,
  ShoppingBag, Users, Star, Home, FileText, Search, Megaphone,
  BarChart3, Settings, Shield, ImageIcon, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/storefront/Logo";
import type { Module } from "@/lib/permissions";

type Item = { href: string; label: string; icon: LucideIcon; count?: string; module: Module };
type Group = { title: string; items: Item[] };

export function AdminSidebar({
  counts,
  allowed,
}: {
  counts: { inventory: string; orders: number; reviews: number };
  allowed: Module[];
}) {
  const pathname = usePathname();
  const can = (m: Module) => allowed.includes(m);

  const ALL_GROUPS: Group[] = [
    { title: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, module: "dashboard" }] },
    {
      title: "Catalogue",
      items: [
        { href: "/admin/inventory", label: "Inventory", icon: Boxes, count: counts.inventory, module: "inventory" },
        { href: "/admin/products", label: "Products", icon: Package, module: "products" },
        { href: "/admin/categories", label: "Categories", icon: LayoutGrid, module: "categories" },
        { href: "/admin/collections", label: "Collections", icon: Layers, module: "collections" },
        { href: "/admin/pricing", label: "Pricing", icon: Tag, module: "pricing" },
      ],
    },
    {
      title: "Sales",
      items: [
        { href: "/admin/orders", label: "Orders", icon: ShoppingBag, count: counts.orders ? String(counts.orders) : undefined, module: "orders" },
        { href: "/admin/customers", label: "Customers", icon: Users, module: "customers" },
        { href: "/admin/reviews", label: "Reviews", icon: Star, count: counts.reviews ? String(counts.reviews) : undefined, module: "reviews" },
      ],
    },
    {
      title: "Storefront",
      items: [
        { href: "/admin/homepage", label: "Homepage CMS", icon: Home, module: "homepage" },
        { href: "/admin/content", label: "Content CMS", icon: FileText, module: "content" },
        { href: "/admin/media", label: "Media Library", icon: ImageIcon, module: "media" },
        { href: "/admin/seo", label: "SEO", icon: Search, module: "seo" },
      ],
    },
    {
      title: "Growth",
      items: [
        { href: "/growth", label: "Marketing", icon: Megaphone, module: "marketing" },
        { href: "/admin/reports", label: "Reports", icon: BarChart3, module: "reports" },
      ],
    },
    {
      title: "System",
      items: [
        { href: "/admin/settings", label: "Settings", icon: Settings, module: "settings" },
        { href: "/admin/team", label: "Team & Access", icon: Shield, module: "team" },
      ],
    },
  ];

  const GROUPS: Group[] = ALL_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => can(i.module)) }))
    .filter((g) => g.items.length > 0);

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[248px] flex-col overflow-y-auto border-r border-line bg-ink max-lg:w-[64px]">
      <div className="border-b border-line px-[22px] py-6">
        <Logo size={22} className="max-lg:hidden" />
        <div className="hidden max-lg:block">
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
            <path d="M12 2l3 7 7 1-5 5 1.5 7L12 18 5.5 22 7 13 2 8l7-1z" stroke="#C8A45C" strokeWidth="1.3" />
          </svg>
        </div>
      </div>
      {GROUPS.map((group) => (
        <div key={group.title} className="py-4">
          <h6 className="px-[22px] pb-2 text-[10px] uppercase tracking-[0.2em] text-muted max-lg:hidden">{group.title}</h6>
          {group.items.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 border-l-2 px-[22px] py-2.5 text-sm transition-colors max-lg:justify-center",
                  active ? "border-gold bg-gold/[0.06] text-gold" : "border-transparent text-grey hover:bg-white/[0.03] hover:text-cream",
                )}
              >
                <item.icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.5} />
                <span className="max-lg:hidden">{item.label}</span>
                {item.count && (
                  <span className="ml-auto rounded-[10px] bg-gold/[0.16] px-2 text-[11px] text-gold max-lg:hidden">{item.count}</span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
