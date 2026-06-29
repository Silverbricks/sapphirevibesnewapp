"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Truck,
  Heart,
  Gem,
  Share2,
  Gift,
  Star,
  MapPin,
  Settings,
  LogOut,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui";
import { logoutAction } from "@/actions/auth";

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: "orders" | "wishlist" };

const NAV: NavItem[] = [
  { href: "/account", label: "My Orders", icon: ShoppingBag, badge: "orders" },
  { href: "/account/track", label: "Track Order", icon: Truck },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart, badge: "wishlist" },
  { href: "/account/rewards", label: "Rewards", icon: Gem },
  { href: "/account/referrals", label: "Refer & Earn", icon: Share2 },
  { href: "/account/gift-centre", label: "Gift Centre", icon: Gift },
  { href: "/account/reviews", label: "My Reviews", icon: Star },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/settings", label: "Account Settings", icon: Settings },
];

export function AccountSidebar({
  name,
  email,
  tier,
  counts,
  isStaff = false,
}: {
  name: string;
  email: string;
  tier: string;
  counts: { orders: number; wishlist: number };
  isStaff?: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside className="h-fit rounded-panel border border-line bg-card p-6 lg:sticky lg:top-[100px]">
      <Avatar name={name} size={72} className="mb-3.5 font-serif" />
      <h3 className="font-serif text-2xl">{name}</h3>
      <div className="text-xs text-muted">{email}</div>
      <div className="mb-5 mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-gold/[0.12] px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] text-gold">
        ★ {tier} Member
      </div>

      {isStaff && (
        <Link
          href="/admin"
          className="mb-3 flex items-center justify-center gap-2 rounded-lg border border-line-gold bg-gold/10 py-2.5 text-xs uppercase tracking-[0.12em] text-gold transition-colors hover:bg-gold hover:text-ink"
        >
          <Shield className="h-4 w-4" /> Admin Console →
        </Link>
      )}

      <nav className="flex flex-col gap-0.5 border-t border-line pt-4">
        {NAV.map((item) => {
          const active =
            item.href === "/account"
              ? pathname === "/account"
              : pathname.startsWith(item.href);
          const badgeValue =
            item.badge === "orders"
              ? counts.orders
              : item.badge === "wishlist"
                ? counts.wishlist
                : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active ? "bg-gold/[0.08] text-gold" : "text-grey hover:bg-white/[0.03] hover:text-cream",
              )}
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {item.label}
              {item.badge && badgeValue > 0 && (
                <span className="ml-auto rounded-full bg-gold/[0.16] px-2 text-[11px] text-gold">
                  {badgeValue}
                </span>
              )}
            </Link>
          );
        })}
        <form action={logoutAction} className="mt-2 border-t border-line pt-4">
          <button className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-muted transition-colors hover:text-cream">
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.5} />
            Sign Out
          </button>
        </form>
      </nav>
    </aside>
  );
}
