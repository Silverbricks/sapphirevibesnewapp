import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/auth-helpers";
import { getLatestActiveOrder } from "@/lib/data/account";
import { Panel, OrderStatusPill, EmptyState, buttonClasses } from "@/components/ui";
import { TrackTimeline } from "@/components/storefront/TrackTimeline";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Track Order" };

export default async function TrackPage() {
  const user = await requireUser();
  const order = await getLatestActiveOrder(user.id);

  if (!order) {
    return (
      <div>
        <h1 className="font-serif text-[34px]">Track Order</h1>
        <p className="mb-7 text-[13px] text-muted">Follow your in-progress deliveries.</p>
        <EmptyState
          title="No active orders"
          description="You have no orders in progress right now."
          action={<Link href="/account" className={buttonClasses("outline", "lg")}>View order history</Link>}
        />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-[34px]">Track Order</h1>
      <p className="mb-7 text-[13px] text-muted">
        Order {order.number} · Placed {formatDate(order.placedAt)}
      </p>
      <Panel className="mb-5">
        <TrackTimeline status={order.status} />
        {order.trackingNumber && (
          <p className="mt-5 text-center text-sm text-muted">
            Your order is on its way. Tracking number{" "}
            <span className="text-gold">{order.trackingNumber}</span>
            {order.carrier ? ` via ${order.carrier}` : ""}.
          </p>
        )}
      </Panel>

      <div className="rounded-card border border-line bg-card p-[22px]">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <span>Items in this order</span>
          <OrderStatusPill status={order.status} />
        </div>
        <div className="flex flex-wrap gap-3.5 pt-4">
          {order.items.map((it) => (
            <div key={it.id} className="flex items-center gap-3">
              {it.imageSnapshot && (
                <Image src={it.imageSnapshot} alt={it.nameSnapshot} width={54} height={54} className="h-[54px] w-[54px] rounded-[9px] object-cover" />
              )}
              <div>
                <div className="text-[13px]">{it.nameSnapshot}</div>
                <div className="text-[11px] text-muted">Qty {it.quantity}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
