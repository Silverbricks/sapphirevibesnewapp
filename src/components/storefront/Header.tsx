"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, User, Heart, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/constants";
import { Logo } from "./Logo";
import { useStore } from "./store-context";

interface MenuCat {
  name: string;
  slug: string;
  imageUrl: string | null;
  children: { name: string; slug: string }[];
}

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

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group relative py-1.5 text-grey transition-colors hover:text-cream">
      {children}
      <span className="absolute bottom-0 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}

export function Header({ categories = [] }: { categories?: MenuCat[] }) {
  const store = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line-gold bg-bg/80 backdrop-blur-xl">
      <div className="wrap flex h-[74px] items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-[30px] text-[13px] uppercase tracking-[0.12em] md:flex">
          <NavLink href="/new-arrivals">New Arrivals</NavLink>

          {/* Shop mega-menu */}
          {categories.length > 0 && (
            <div className="group relative">
              <Link href="/shop" className="flex items-center gap-1 py-1.5 text-grey transition-colors hover:text-cream">
                Shop <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
              </Link>
              <div className="invisible absolute left-0 top-full z-50 w-[680px] max-w-[92vw] pt-4 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                <div className="grid grid-cols-3 gap-x-6 gap-y-5 rounded-panel border border-line-gold bg-bg/95 p-6 shadow-2xl backdrop-blur-xl">
                  {categories.map((c) => (
                    <div key={c.slug}>
                      <Link href={`/shop/${c.slug}`} className="block text-[12px] font-medium tracking-[0.06em] text-cream hover:text-gold">
                        {c.name}
                      </Link>
                      {c.children.length > 0 && (
                        <div className="mt-1.5 flex flex-col gap-1">
                          {c.children.slice(0, 5).map((ch) => (
                            <Link key={ch.slug} href={`/shop/${ch.slug}`} className="text-[11px] normal-case tracking-normal text-muted transition-colors hover:text-cream">
                              {ch.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <NavLink href="/collections">Collections</NavLink>
          <NavLink href="/gifts">Gifts</NavLink>
          <NavLink href="/sale">Sale</NavLink>
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
          menuOpen ? "max-h-[80vh] overflow-y-auto" : "max-h-0",
        )}
      >
        <nav className="wrap flex flex-col py-2">
          <Link href="/new-arrivals" onClick={() => setMenuOpen(false)} className="py-3 text-[13px] uppercase tracking-[0.12em] text-grey">New Arrivals</Link>
          {categories.map((c) => (
            <Link key={c.slug} href={`/shop/${c.slug}`} onClick={() => setMenuOpen(false)} className="py-3 text-[13px] uppercase tracking-[0.12em] text-grey">
              {c.name}
            </Link>
          ))}
          <Link href="/collections" onClick={() => setMenuOpen(false)} className="py-3 text-[13px] uppercase tracking-[0.12em] text-grey">Collections</Link>
          <Link href="/gifts" onClick={() => setMenuOpen(false)} className="py-3 text-[13px] uppercase tracking-[0.12em] text-grey">Gifts</Link>
          <Link href="/sale" onClick={() => setMenuOpen(false)} className="py-3 text-[13px] uppercase tracking-[0.12em] text-grey">Sale</Link>
        </nav>
      </div>
    </header>
  );
}
