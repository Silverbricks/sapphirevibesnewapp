"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, User, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE, STOREFRONT_NAV } from "@/lib/constants";
import { Logo } from "./Logo";
import { useStore } from "./store-context";

export function AnnouncementBar({ text, ctaHref }: { text?: string; ctaHref?: string | null }) {
  const content = text || SITE.announcement;
  return (
    <div className="border-b border-line-gold bg-gradient-to-r from-ink via-[#1a1209] to-ink py-2.5 text-center text-[12px] uppercase tracking-[0.18em] text-gold-soft">
      {ctaHref ? (
        <Link href={ctaHref} className="transition-colors hover:text-gold">{content}</Link>
      ) : (
        content
      )}
    </div>
  );
}

export function Header() {
  const store = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line-gold bg-bg/80 backdrop-blur-xl">
      <div className="wrap flex h-[74px] items-center justify-between">
        <Logo />
        <nav className="hidden gap-[30px] text-[13px] uppercase tracking-[0.12em] md:flex">
          {STOREFRONT_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative py-1.5 text-grey transition-colors hover:text-cream"
            >
              {item.label}
              <span className="absolute bottom-0 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-5">
          <Link href="/search" aria-label="Search" className="text-cream hover:text-gold">
            <Search className="h-[21px] w-[21px]" strokeWidth={1.5} />
          </Link>
          <Link href="/account" aria-label="Account" className="hidden text-cream hover:text-gold sm:block">
            <User className="h-[21px] w-[21px]" strokeWidth={1.5} />
          </Link>
          <Link href="/account/wishlist" aria-label="Wishlist" className="hidden text-cream hover:text-gold sm:block">
            <Heart className="h-[21px] w-[21px]" strokeWidth={1.5} />
          </Link>
          <Link href="/cart" aria-label="Cart" className="relative text-cream hover:text-gold">
            <ShoppingBag className="h-[21px] w-[21px]" strokeWidth={1.5} />
            {store.cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-semibold text-ink">
                {store.cartCount}
              </span>
            )}
          </Link>
          <button
            className="text-cream md:hidden"
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-line bg-bg transition-[max-height] duration-300 md:hidden",
          menuOpen ? "max-h-96" : "max-h-0",
        )}
      >
        <nav className="wrap flex flex-col py-2">
          {STOREFRONT_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="py-3 text-[13px] uppercase tracking-[0.12em] text-grey"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
