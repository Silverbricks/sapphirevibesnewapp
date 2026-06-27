import { requireUser } from "@/lib/auth-helpers";
import { getAccountSummary, getUserOrders } from "@/lib/data/account";
import { SummaryCard, EmptyState, buttonClasses } from "@/components/ui";
import { OrderCard } from "@/components/account/OrderCard";
import { formatMoney, formatNumber } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Orders" };

export default async function OrdersPage() {
  const user = await requireUser();
  const [summary, orders] = await Promise.all([
    getAccountSummary(user.id),
    getUserOrders(user.id),
  ]);

  return (
    <div>
      <h1 className="font-serif text-[34px]">My Orders</h1>
      <p className="mb-7 text-[13px] text-muted">Track current orders and revisit past purchases.</p>

      <div className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard value={formatNumber(summary.totalOrders)} label="Total Orders" />
        <SummaryCard value={formatNumber(summary.inProgress)} label="In Progress" />
        <SummaryCard value={formatMoney(summary.lifetimeSpendCents)} label="Lifetime Spend" />
        <SummaryCard value={formatNumber(summary.points)} label="Reward Points" />
      </div>

      {orders.length > 0 ? (
        orders.map((o) => <OrderCard key={o.id} order={o} />)
      ) : (
        <EmptyState
          title="No orders yet"
          description="When you place an order it will appear here."
          action={
            <Link href="/new-arrivals" className={buttonClasses("gold", "lg")}>
              Start Shopping
            </Link>
          }
        />
      )}
    </div>
  );
}
