import { getAdminReports } from "@/lib/data/admin";
import { StatCard, Panel, PanelHead, buttonClasses } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { BarChart } from "@/components/admin/Charts";
import { formatCompactMoney, formatCompact } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports · Admin" };

const CATEGORY_PERF = [
  { label: "Lighting", value: 88 }, { label: "Furniture", value: 76 }, { label: "Décor", value: 64 },
  { label: "Soft Furn.", value: 52 }, { label: "Gifts", value: 44 }, { label: "Outdoor", value: 31 },
];

export default async function ReportsPage() {
  const r = await getAdminReports();
  return (
    <>
      <PageHead
        title="Reports"
        subtitle="Sales, revenue, product performance and customer insights."
        actions={
          <div className="flex items-center gap-2">
            <a href="/api/admin/export?type=orders" className={buttonClasses("outline", "md")}>Export Orders CSV</a>
            <a href="/api/admin/export?type=products" className={buttonClasses("outline", "md")}>Export Products CSV</a>
          </div>
        }
      />
      <div className="mb-[26px] grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={formatCompactMoney(r.ytdRevenueCents)} delta="22% YoY" />
        <StatCard label="Units Sold" value={formatCompact(r.unitsSold)} delta="16% YoY" />
        <StatCard label="Return Rate" value={`${r.returnRate.toFixed(1)}%`} delta="0.6% YoY" />
        <StatCard label="Repeat Buyers" value={String(r.repeatBuyers)} delta="5% YoY" />
      </div>
      <Panel>
        <PanelHead title="Category Performance" action={<span className="text-[11px] uppercase tracking-[0.1em] text-gold">This year</span>} />
        <BarChart data={CATEGORY_PERF} />
      </Panel>
    </>
  );
}
