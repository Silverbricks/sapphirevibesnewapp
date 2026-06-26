import Link from "next/link";
import { Logo } from "./Logo";
import { SITE, FOOTER_COLUMNS, PAYMENT_METHODS_DISPLAY } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-line-gold bg-ink pb-8 pt-[70px]">
      <div className="wrap">
        <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Logo className="mb-4" size={26} />
            <p className="max-w-[280px] text-sm text-muted">
              Luxury home décor, lighting and gifts — curated for spaces that tell a story.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {PAYMENT_METHODS_DISPLAY.map((p) => (
                <span
                  key={p}
                  className="rounded border border-line px-2.5 py-1 text-[9px] tracking-[0.1em] text-muted"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h5 className="mb-5 text-[11px] uppercase tracking-[0.2em] text-gold">
                {col.title}
              </h5>
              {col.links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="block py-[7px] text-sm text-muted transition-colors hover:text-cream"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-between gap-2.5 border-t border-line pt-6 text-xs text-muted">
          <span>© 2026 {SITE.name}. All rights reserved.</span>
          <span>Designed in {SITE.country} · ABN {SITE.abn}</span>
        </div>
      </div>
    </footer>
  );
}
