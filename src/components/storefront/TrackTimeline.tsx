import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Processing", "Packed", "Shipped", "In Transit", "Delivered"];

const STATUS_INDEX: Record<string, number> = {
  PENDING: 0,
  PROCESSING: 0,
  PACKED: 1,
  SHIPPED: 2,
  IN_TRANSIT: 3,
  DELIVERED: 4,
};

export function TrackTimeline({ status }: { status: string }) {
  const active = STATUS_INDEX[status] ?? 0;
  const cancelled = ["CANCELLED", "RETURNED", "REFUNDED"].includes(status);

  if (cancelled) {
    return (
      <div className="rounded-lg border border-red/40 bg-red/10 px-4 py-3 text-sm text-red">
        This order is {status.toLowerCase()}.
      </div>
    );
  }

  return (
    <div className="relative flex justify-between">
      <div className="absolute left-[6%] right-[6%] top-[13px] h-0.5 bg-white/10" />
      {STEPS.map((label, i) => {
        const done = i < active;
        const isActive = i === active;
        return (
          <div key={label} className="z-[2] flex flex-1 flex-col items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border-2",
                done && "border-gold bg-gold",
                isActive && "border-gold bg-gold/20",
                !done && !isActive && "border-white/15 bg-panel",
              )}
            >
              {done && <Check className="h-3.5 w-3.5 text-ink" strokeWidth={3} />}
            </div>
            <small className={cn("text-[11px]", done || isActive ? "text-cream" : "text-muted")}>
              {label}
            </small>
          </div>
        );
      })}
    </div>
  );
}
