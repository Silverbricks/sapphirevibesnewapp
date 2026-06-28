"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { Toggle } from "@/components/ui";
import { toggleHomepageBlock, reorderHomepageBlock } from "@/actions/admin";

interface Block {
  id: string;
  name: string;
  blurb: string | null;
  isVisible: boolean;
}

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
