import { cn } from "@/lib/utils";
import { BADGE_META, type BadgeVariant, type ProductBadgeKey } from "@/lib/badges";

export type PillColor =
  | "gold"
  | "green"
  | "amber"
  | "red"
  | "blue"
  | "purple"
  | "grey";

const PILL_COLORS: Record<PillColor, string> = {
  gold: "bg-gold/15 text-gold",
  green: "bg-green/15 text-green",
  amber: "bg-amber/15 text-amber",
  red: "bg-red/15 text-red",
  blue: "bg-blue/20 text-[#7da0e6]",
  purple: "bg-purple/20 text-purple",
  grey: "bg-white/10 text-grey",
};

export function Pill({
  color = "gold",
  className,
  children,
}: {
  color?: PillColor;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-[11px] py-1 text-[11px] tracking-[0.04em]",
        PILL_COLORS[color],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Map an order status to a pill colour + readable label. */
const ORDER_STATUS: Record<string, { color: PillColor; label: string }> = {
  PENDING: { color: "amber", label: "Pending" },
  PROCESSING: { color: "amber", label: "Processing" },
  PACKED: { color: "blue", label: "Packed" },
  SHIPPED: { color: "blue", label: "Shipped" },
  IN_TRANSIT: { color: "blue", label: "In Transit" },
  DELIVERED: { color: "green", label: "Delivered" },
  CANCELLED: { color: "red", label: "Cancelled" },
  RETURNED: { color: "red", label: "Returned" },
  REFUNDED: { color: "grey", label: "Refunded" },
};

export function OrderStatusPill({ status }: { status: string }) {
  const meta = ORDER_STATUS[status] ?? { color: "grey" as PillColor, label: status };
  return <Pill color={meta.color}>{meta.label}</Pill>;
}

/** Storefront promotional badge chip (used in the card badge stack). */
const BADGE_STYLES: Record<BadgeVariant, string> = {
  default:
    "bg-ink/80 backdrop-blur-sm text-gold-soft border border-line",
  gold: "bg-gold text-ink",
  sale: "bg-blue text-white",
  eco: "bg-green text-ink",
  oos: "bg-muted/30 text-cream",
};

export function ProductBadgeChip({
  badge,
  className,
}: {
  badge: ProductBadgeKey;
  className?: string;
}) {
  const meta = BADGE_META[badge];
  if (!meta) return null;
  return (
    <span
      className={cn(
        "rounded-[5px] px-[9px] py-1 text-[10px] font-medium tracking-[0.08em]",
        BADGE_STYLES[meta.variant],
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

export function SoldOutChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "rounded-[5px] px-[9px] py-1 text-[10px] font-medium tracking-[0.08em]",
        BADGE_STYLES.oos,
        className,
      )}
    >
      Sold Out
    </span>
  );
}
