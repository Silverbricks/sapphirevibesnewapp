"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GripVertical, ChevronUp, ChevronDown, Pencil } from "lucide-react";
import { Toggle } from "@/components/ui";
import { toggleHomepageBlock, reorderHomepageBlock } from "@/actions/admin";

interface Block {
  id: string;
  key: string;
  name: string;
  blurb: string | null;
  isVisible: boolean;
}

// blocks that have a dedicated editor
const EDITORS: Record<string, string> = {
  hero: "/admin/homepage/hero",
  promo: "/admin/homepage/promo",
};

export function HomepageBlockList({ blocks }: { blocks: Block[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  return (
    <div className="space-y-3">
      {blocks.map((b, i) => (
        <div key={b.id} className="flex items-center gap-4 rounded-card border border-line bg-card p-4">
          <GripVertical className="h-4 w-4 text-muted" />
          <div className="flex flex-1 flex-col">
            <b className="text-[15px] font-normal">{b.name}</b>
            {b.blurb && <small className="text-xs text-muted">{b.blurb}</small>}
          </div>
          {EDITORS[b.key] && (
            <Link
              href={EDITORS[b.key]}
              className="flex items-center gap-1 rounded-lg border border-line-gold px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] text-gold hover:bg-gold/10"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Link>
          )}
          <div className="flex items-center gap-1">
            <button disabled={pending || i === 0} onClick={() => run(() => reorderHomepageBlock(b.id, "up"))} className="text-muted hover:text-gold disabled:opacity-30">
              <ChevronUp className="h-4 w-4" />
            </button>
            <button disabled={pending || i === blocks.length - 1} onClick={() => run(() => reorderHomepageBlock(b.id, "down"))} className="text-muted hover:text-gold disabled:opacity-30">
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          <Toggle checked={b.isVisible} onChange={(v) => run(() => toggleHomepageBlock(b.id, v))} />
        </div>
      ))}
    </div>
  );
}
