"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function BarChart({
  data,
  height = 190,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex items-end gap-3.5 pt-2.5" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-gold to-gold/25 transition-[height] duration-1000"
            style={{ height: mounted ? `${(d.value / max) * 100}%` : 0, minHeight: 6 }}
          />
          <small className="text-[11px] text-muted">{d.label}</small>
        </div>
      ))}
    </div>
  );
}

export function Funnel({
  steps,
}: {
  steps: { label: string; value: number; pct: number }[];
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {steps.map((s) => (
        <div key={s.label} className="flex items-center gap-3.5">
          <div className="w-[130px] text-[13px] text-grey max-sm:w-20 max-sm:text-[11px]">{s.label}</div>
          <div className="h-[34px] flex-1 overflow-hidden rounded-lg bg-white/[0.04]">
            <div
              className={cn("flex h-full items-center justify-end rounded-lg bg-gradient-to-r from-gold/40 to-gold pr-3 text-xs font-medium text-ink")}
              style={{ width: `${Math.max(s.pct, 6)}%` }}
            >
              {s.value.toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
