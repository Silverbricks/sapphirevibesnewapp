import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  max = 100,
  className,
  barClassName,
}: {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-md bg-white/10", className)}
    >
      <div
        className={cn(
          "h-full rounded-md bg-gradient-to-r from-gold to-gold-soft",
          barClassName,
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Thin stock-level bar used in the admin inventory table. */
export function StockBar({
  value,
  max,
  tone = "green",
}: {
  value: number;
  max: number;
  tone?: "green" | "amber" | "red";
}) {
  const pct = Math.max(3, Math.min(100, (value / Math.max(max, 1)) * 100));
  const colors = {
    green: "bg-green",
    amber: "bg-amber",
    red: "bg-red",
  } as const;
  return (
    <div className="mt-[5px] h-1.5 w-[90px] overflow-hidden rounded bg-white/[0.07]">
      <div
        className={cn("h-full rounded", colors[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
