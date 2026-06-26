"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui";
import { useStore } from "./store-context";

export function CompareTray() {
  const store = useStore();
  const open = store.compareCards.length > 0;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-[80] border-t border-line-gold bg-bg/95 py-4 backdrop-blur-md transition-transform duration-300",
        open ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="wrap flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3.5">
          <b className="font-serif text-lg">Compare</b>
          <div className="flex flex-wrap items-center gap-3">
            {store.compareCards.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-[9px] border border-line bg-card px-2.5 py-1.5 text-xs"
              >
                {c.images[0]?.url && (
                  <Image
                    src={c.images[0].url}
                    alt={c.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-md object-cover"
                  />
                )}
                <span className="max-w-[140px] truncate">{c.name}</span>
                <button
                  onClick={() => store.removeCompare(c.id)}
                  aria-label={`Remove ${c.name}`}
                  className="text-muted hover:text-cream"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={store.clearCompare}
            className="text-xs uppercase tracking-[0.12em] text-muted hover:text-cream"
          >
            Clear
          </button>
          <Link href="/compare" className={buttonClasses("gold", "md")}>
            Compare Now
          </Link>
        </div>
      </div>
    </div>
  );
}
