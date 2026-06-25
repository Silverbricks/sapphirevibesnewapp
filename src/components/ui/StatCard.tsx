import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  deltaDir = "up",
  icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  delta?: string;
  deltaDir?: "up" | "down";
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-card border border-line bg-card p-[22px]", className)}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-1.5 text-[11px] uppercase tracking-[0.14em] text-muted">
            {label}
          </div>
          <div className="font-serif text-4xl font-semibold leading-none">
            {value}
          </div>
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-gold/[0.12] text-gold">
            {icon}
          </div>
        )}
      </div>
      {delta && (
        <div
          className={cn(
            "mt-2 text-xs",
            deltaDir === "up" ? "text-green" : "text-red",
          )}
        >
          {deltaDir === "up" ? "▲" : "▼"} {delta}
        </div>
      )}
    </div>
  );
}

/** Compact stat used in the admin dashboard's 8-up secondary row. */
export function MiniStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "warn" | "danger";
}) {
  const tones = {
    default: "border-line",
    warn: "border-amber/40 [&_.v]:text-amber",
    danger: "border-red/40 [&_.v]:text-red",
  } as const;
  return (
    <div
      className={cn(
        "rounded-card border bg-card px-[18px] py-4",
        tones[tone],
      )}
    >
      <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-muted">
        {label}
      </div>
      <div className="v font-serif text-[26px] font-semibold leading-none">
        {value}
      </div>
    </div>
  );
}

/** Small account summary card (serif number + label). */
export function SummaryCard({
  value,
  label,
  className,
}: {
  value: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-card border border-line bg-card p-5", className)}>
      <div className="font-serif text-[32px] text-cream">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted">
        {label}
      </div>
    </div>
  );
}
