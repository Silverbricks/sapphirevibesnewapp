import Link from "next/link";
import { requireModule } from "@/lib/auth-helpers";
import { getOrdersDashboard, getOrders } from "@/lib/data/orders";
import { StatCard, MiniStat, Panel, PanelHead, buttonClasses } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { OrderFilters } from "@/components/admin/OrderFilters";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { formatMoney, formatCompactMoney } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders · Admin" };

interface SP {
  status?: string; q?: string; paymentMethod?: string; shippingMethod?: string;
  state?: string; country?: string; customer?: string; dateFrom?: string; dateTo?: string; page?: string;
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireModule("orders");
  const sp = await searchParams;
  const status = sp.status || "all";

  const [d, result] = await Promise.all([
    getOrdersDashboard(),
    getOrders({
      status,
      q: sp.q,
      paymentMethod: sp.paymentMethod,
      shippingMethod: sp.shippingMethod,
      state: sp.state,
      country: sp.country,
      customer: sp.customer,
      dateFrom: sp.dateFrom,
      dateTo: sp.dateTo,
      page: sp.page ? parseInt(sp.page, 10) : 1,
    }),
  ]);

  // querystring for pagination + export (all filters except page)
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (v && k !== "page") params.set(k, v as string);
  const query = params.toString();

  const s = d.byStatus;
  const TABS: { key: string; label: string; count?: number }[] = [
    { key: "all", label: "All", count: d.totalCount },
    { key: "PENDING", label: "New", count: s.PENDING },
    { key: "PROCESSING", label: "Processing", count: s.PROCESSING },
    { key: "PACKED", label: "Packed", count: s.PACKED },
    { key: "READY_FOR_DISPATCH", label: "Ready for Dispatch", count: s.READY_FOR_DISPATCH },
    { key: "SHIPPED", label: "Shipped", count: s.SHIPPED },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", count: s.OUT_FOR_DELIVERY },
    { key: "DELIVERED", label: "Delivered", count: s.DELIVERED },
    { key: "CANCELLED", label: "Cancelled", count: s.CANCELLED },
    { key: "REFUNDED", label: "Refunded", count: s.REFUNDED },
    { key: "RETURNED", label: "Returns", count: s.RETURNED },
    { key: "FAILED_PAYMENT", label: "Failed Payments", count: d.paymentFailed },
    { key: "ARCHIVED", label: "Archived", count: d.archivedCount },
  ];

  return (
    <>
      <PageHead
        title="Orders"
        subtitle="Process, fulfil, track and deliver every order from one dashboard."
        actions={
          <div className="flex flex-wrap gap-2">
            <a href="/print/orders/dispatch" target="_blank" rel="noreferrer" className={buttonClasses("outline", "md")}>Dispatch List</a>
            <a href={`/api/admin/export?type=orders${query ? `&${query}` : ""}`} className={buttonClasses("outline", "md")}>Export CSV</a>
            <Link href="/admin/orders/new" className={buttonClasses("gold", "md")}>+ New Order</Link>
          </div>
        }
      />

      <div className="mb-[18px] grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue Today" value={formatMoney(d.revenueTodayCents)} delta={`${d.todayCount} orders today`} />
        <StatCard label="Revenue This Month" value={formatCompactMoney(d.revenueMonthCents)} delta="net of cancels/refunds" />
        <StatCard label="Avg. Order Value" value={formatMoney(d.aovCents)} delta={`${d.repeatCustomers} repeat customers`} />
        <StatCard label="Total Orders" value={String(d.totalCount)} delta={`${d.returnsCount} returns · ${d.paymentFailed} failed`} deltaDir={d.paymentFailed ? "down" : "up"} />
      </div>

      <div className="mb-[18px] grid grid-cols-2 gap-[18px] md:grid-cols-4 lg:grid-cols-8">
        <MiniStat label="New" value={s.PENDING ?? 0} />
        <MiniStat label="Processing" value={s.PROCESSING ?? 0} />
        <MiniStat label="Packed" value={s.PACKED ?? 0} />
        <MiniStat label="Shipped" value={s.SHIPPED ?? 0} />
        <MiniStat label="Delivered" value={s.DELIVERED ?? 0} />
        <MiniStat label="Returns" value={d.returnsCount} />
        <MiniStat label="Refunded" value={s.REFUNDED ?? 0} />
        <MiniStat label="Cancelled" value={s.CANCELLED ?? 0} tone={s.CANCELLED ? "warn" : undefined} />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link key={t.key} href={t.key === "all" ? "/admin/orders" : `/admin/orders?status=${t.key}`} className={`fchip ${status === t.key ? "fchip-on" : ""}`}>
            {t.label}{typeof t.count === "number" ? ` (${t.count})` : ""}
          </Link>
        ))}
      </div>

      <OrderFilters values={sp} />

      <OrdersTable orders={result.orders} page={result.page} pages={result.pages} query={query} />

      <div className="mt-[18px] grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <Panel>
          <PanelHead title="Top Customers" />
          {d.topCustomers.map((c) => (
            <div key={c.name} className="flex items-center justify-between border-b border-line py-2.5 text-sm last:border-0">
              <span>{c.name}<span className="ml-2 text-xs text-muted">{c.orders} orders</span></span>
              <span className="text-gold">{formatMoney(c.spendCents)}</span>
            </div>
          ))}
        </Panel>
        <Panel>
          <PanelHead title="Best-Selling Products" />
          {d.bestSellers.map((b) => (
            <div key={b.name} className="flex items-center justify-between border-b border-line py-2.5 text-sm last:border-0">
              <span className="truncate pr-3">{b.name}</span>
              <span className="text-muted">{b.qty} sold</span>
            </div>
          ))}
        </Panel>
      </div>
    </>
  );
}
