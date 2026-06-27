import Image from "next/image";
import Link from "next/link";
import { OrderStatusPill, buttonClasses } from "@/components/ui";
import { formatMoney, formatDate } from "@/lib/format";
import type { UserOrder } from "@/lib/data/account";

export function OrderCard({ order }: { order: UserOrder }) {
  const delivered = order.status === "DELIVERED";
  return (
    <div className="mb-4 rounded-card border border-line bg-card p-[22px]">
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-line pb-4">
        <div>
          <span>Order {order.number}</span>{" "}
          <span className="text-xs text-muted">· Placed {formatDate(order.placedAt)}</span>
        </div>
        <OrderStatusPill status={order.status} />
      </div>

      <div className="flex flex-wrap gap-3.5 py-4">
        {order.items.slice(0, 4).map((it) => (
          <div key={it.id} className="flex items-center gap-3">
            {it.imageSnapshot && (
              <Image
                src={it.imageSnapshot}
                alt={it.nameSnapshot}
                width={54}
                height={54}
                className="h-[54px] w-[54px] rounded-[9px] object-cover"
              />
            )}
            <div>
              <div className="text-[13px]">{it.nameSnapshot}</div>
              <div className="text-[11px] text-muted">
                Qty {it.quantity} · {formatMoney(it.lineCents)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-line pt-4">
        <div className="font-serif text-[22px] text-gold">{formatMoney(order.totalCents)}</div>
        <div className="flex gap-2.5">
          {delivered ? (
            <Link href="/account/reviews" className={buttonClasses("outline", "sm")}>
              Write Review
            </Link>
          ) : (
            <Link href="/account/track" className={buttonClasses("outline", "sm")}>
              Track Order
            </Link>
          )}
          <Link href={`/account/orders/${order.number}`} className={buttonClasses("outline", "sm")}>
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
