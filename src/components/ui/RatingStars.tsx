import { cn } from "@/lib/utils";

export function RatingStars({
  rating,
  count,
  size = "sm",
  className,
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const full = Math.round(rating);
  const sizeClass = size === "md" ? "text-sm" : "text-xs";
  return (
    <div className={cn("tracking-[2px] text-gold", sizeClass, className)}>
      {"★".repeat(full)}
      <span className="text-muted">{"☆".repeat(Math.max(0, 5 - full))}</span>
      {count != null && (
        <small className="ml-1.5 tracking-normal text-[11px] text-muted">
          ({count})
        </small>
      )}
    </div>
  );
}
