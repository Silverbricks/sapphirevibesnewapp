import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";

export function Price({
  cents,
  compareCents,
  showSave = false,
  size = "md",
  className,
}: {
  cents: number;
  compareCents?: number | null;
  showSave?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const onSale = compareCents != null && compareCents > cents;
  const sizes = {
    sm: "text-lg",
    md: "text-[23px]",
    lg: "text-[30px]",
  } as const;
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <b className={cn("font-serif font-semibold text-cream", sizes[size])}>
        {formatMoney(cents)}
      </b>
      {onSale && (
        <s className="text-[15px] text-muted">{formatMoney(compareCents!)}</s>
      )}
      {showSave && onSale && (
        <span className="ml-auto text-[10px] font-medium uppercase tracking-[0.08em] text-blue">
          Save {formatMoney(compareCents! - cents)}
        </span>
      )}
    </div>
  );
}
