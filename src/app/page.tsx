import Link from "next/link";
import { buttonClasses } from "@/components/ui";
import { SITE } from "@/lib/constants";

// Temporary landing — replaced by the storefront home in Phase 2.
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="eyebrow">The Autumn Collection · 2026</span>
      <h1 className="font-serif text-6xl">
        Luxury Living.{" "}
        <i className="italic text-gold">Timeless</i> Style.
      </h1>
      <p className="max-w-md text-muted">{SITE.description}</p>
      <div className="flex gap-4">
        <Link href="/styleguide" className={buttonClasses("gold", "lg")}>
          View Style Guide
        </Link>
      </div>
      <p className="mt-6 text-xs uppercase tracking-[0.2em] text-muted">
        {SITE.name} · scaffold ready
      </p>
    </main>
  );
}
