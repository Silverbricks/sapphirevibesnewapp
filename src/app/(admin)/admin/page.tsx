import Image from "next/image";
import Link from "next/link";
import { DollarSign, ShoppingBag, TrendingUp, Activity, Plus } from "lucide-react";
import { getAdminDashboard } from "@/lib/data/admin";
import { StatCard, MiniStat, Panel, PanelHead, OrderStatusPill, buttonClasses } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { BarChart } from "@/components/admin/Charts";
import { formatCompactMoney, formatMoney, formatNumber, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard · Admin" };

const REVENUE_MONTHS = [
  { label: "Nov", value: 48 }, { label: "Dec", value: 72 }, { label: "Jan", value: 61 },
  { label: "Feb", value: 55 }, { label: "Mar", value: 68 }, { label: "Apr", value: 74 },
  { label: "May", value: 81 }, { label: "Jun", value: 84 },
];

export default async function AdminDashboard() {
  const d = await getAdminDashboard();
  const aov = d.ordersCount ? Math.round(d.revenue30Cents / d.ordersCount) : 0;

  return (
    <>
      <PageHead
        title="Dashboard"
        subtitle="Welcome back — here's how Sapphire Vibes is performing today."
        actions={
          <>
            <Link href="/admin/reports" className={buttonClasses("outline", "md")}>Export</Link>
            <Link href="/admin/products" className={buttonClasses("gold", "md")}><Plus className="h-4 w-4" /> Add Product</Link>
          </>
        }
      />

      <div className="mb-[26px] grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue (30d)" value={formatCompactMoney(d.revenue30Cents)} delta="12.4% vs last month" icon={<DollarSign className="h-5 w-5" />} />
        <StatCard label="Orders" value={formatNumber(d.ordersCount)} delta="8.1% vs last month" icon={<ShoppingBag className="h-5 w-5" />} />
        <StatCard label="Avg. Order Value" value={formatMoney(aov)} delta="3.6% vs last month" icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard label="Conversion Rate" value="3.8%" delta="0.4% vs last month" icon={<Activity className="h-5 w-5" />} />
      </div>

      <div className="mb-[26px] grid grid-cols-2 gap-[18px] md:grid-cols-4 lg:grid-cols-8">
        <MiniStat label="Pending Orders" value={d.pending} />
        <MiniStat label="Completed" value={formatNumber(d.completed)} />
        <MiniStat label="Cancelled" value={d.cancelled} />
        <MiniStat label="New Customers (7d)" value={d.newCustomers} />
        <MiniStat label="Total Products" value={formatNumber(d.totalProducts)} />
        <MiniStat label="Low Stock" value={d.lowStock} tone="warn" />
        <MiniStat label="Out of Stock" value={d.outStock} tone="danger" />
        <MiniStat label="Visitors Today" value="4,820" />
      </div>

      <div className="mb-[26px] grid grid-cols-1 gap-[18px] lg:grid-cols-[2fr_1fr]">
        <Panel>
          <PanelHead title="Revenue Overview" action={<span className="text-[11px] uppercase tracking-[0.1em] text-gold">Last 8 months</span>} />
          <BarChart data={REVENUE_MONTHS} />
        </Panel>
        <Panel>
          <PanelHead title="Top Products" action={<span className="text-[11px] uppercase tracking-[0.1em] text-gold">This month</span>} />
          <div>
            {d.topProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between border-b border-line py-3.5 last:border-0">
                <div className="flex items-center gap-3">
                  {p.images[0]?.url && <Image src={p.images[0].url} alt={p.name} width={38} height={38} className="h-[38px] w-[38px] rounded-md object-cover" />}
                  <div>
                    <div className="text-sm">{p.name}</div>
                    <div className="text-[11px] text-muted">{formatNumber(p.salesCount)} sold</div>
                  </div>
                </div>
                <div className="font-serif text-[17px] text-gold">{formatCompactMoney(p.salesCount * p.priceCents)}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHead title="Recent Orders" action={<Link href="/admin/orders" className="text-[11px] uppercase tracking-[0.1em] text-gold">View all →</Link>} />
        <div className="overflow-x-auto">
          <table className="atable">
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {d.recentOrders.map((o) => (
                <tr key={o.id}>
                  <td className="text-gold">{o.number}</td>
                  <td>{o.customerName}</td>
                  <td>{o._count.items}</td>
                  <td>{formatMoney(o.totalCents)}</td>
                  <td><OrderStatusPill status={o.status} /></td>
                  <td className="text-muted">{formatDate(o.placedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
