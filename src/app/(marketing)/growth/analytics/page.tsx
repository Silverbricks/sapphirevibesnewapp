import { StatCard, Panel, PanelHead, buttonClasses } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { Funnel } from "@/components/admin/Charts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics (BI)" };

const FUNNEL = [
  { label: "Visitors", value: 142000, pct: 100 },
  { label: "Product views", value: 105080, pct: 74 },
  { label: "Add to cart", value: 39760, pct: 28 },
  { label: "Checkout", value: 15620, pct: 11 },
  { label: "Purchase", value: 5396, pct: 5.4 },
];
const TRAFFIC = [
  ["Organic Search", "38%"], ["Paid Social (Meta)", "22%"], ["Email", "16%"],
  ["Direct", "12%"], ["Referral", "8%"], ["Google Ads", "4%"],
];

export default async function AnalyticsPage() {
  return (
    <>
      <PageHead
        title="Business Intelligence"
        subtitle="Performance, customer value, funnel and channel attribution."
        actions={<span className={buttonClasses("outline", "md")}>Export Report</span>}
      />
      <div className="mb-[26px] grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Customer Lifetime Value" value="$386" delta="9% YoY" />
        <StatCard label="Avg. Order Value" value="$248" delta="3.6%" />
        <StatCard label="Conversion Rate" value="3.8%" delta="0.4 pts" />
        <StatCard label="Cart Abandonment" value="68%" delta="2 pts" deltaDir="down" />
      </div>
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[2fr_1fr]">
        <Panel>
          <PanelHead title="Conversion Funnel" action={<span className="text-[11px] uppercase tracking-[0.1em] text-gold">Last 30 days</span>} />
          <Funnel steps={FUNNEL} />
        </Panel>
        <Panel>
          <PanelHead title="Traffic Sources" />
          {TRAFFIC.map(([label, pct]) => (
            <div key={label} className="flex items-center justify-between border-b border-line py-3 last:border-0">
              <b className="text-sm font-normal">{label}</b>
              <span className="font-serif text-[17px] text-gold">{pct}</span>
            </div>
          ))}
        </Panel>
      </div>
    </>
  );
}
