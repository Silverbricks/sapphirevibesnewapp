import { DollarSign, Mail, Gem, ShoppingBag } from "lucide-react";
import { getGrowthHub } from "@/lib/data/marketing";
import { StatCard, Panel, PanelHead, Pill, buttonClasses, type PillColor } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { BarChart } from "@/components/admin/Charts";
import { formatCompactMoney, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Growth Hub" };

const CHANNELS = [
  { label: "Dec", value: 32 }, { label: "Jan", value: 28 }, { label: "Feb", value: 30 },
  { label: "Mar", value: 36 }, { label: "Apr", value: 38 }, { label: "May", value: 41 }, { label: "Jun", value: 43 },
];
const STATUS_COLOR: Record<string, PillColor> = { LIVE: "green", SCHEDULED: "gold", SENT: "blue", PAUSED: "grey", DRAFT: "amber" };

export default async function GrowthHubPage() {
  const hub = await getGrowthHub();
  const avgOpen = hub.campaigns.length
    ? Math.round(hub.campaigns.reduce((s, c) => s + (c.openRate ?? 0), 0) / hub.campaigns.length)
    : 41;

  return (
    <>
      <PageHead
        title="Growth Hub"
        subtitle="Marketing performance, campaign ROI and customer engagement at a glance."
        actions={<span className={buttonClasses("gold", "md")}>New Campaign</span>}
      />

      <div className="mb-[26px] grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Marketing Revenue (30d)" value={formatCompactMoney(hub.marketingRevCents)} delta="18% attributed" icon={<DollarSign className="h-5 w-5" />} />
        <StatCard label="Email Open Rate" value={`${avgOpen}%`} delta="3.2 pts" icon={<Mail className="h-5 w-5" />} />
        <StatCard label="Loyalty Members" value={formatNumber(hub.loyaltyMembers)} delta="growing" icon={<Gem className="h-5 w-5" />} />
        <StatCard label="Cart Recovery" value="18.2%" delta="2.1 pts" icon={<ShoppingBag className="h-5 w-5" />} />
      </div>

      <div className="mb-[26px] grid grid-cols-1 gap-[18px] lg:grid-cols-[2fr_1fr]">
        <Panel>
          <PanelHead title="Revenue by Channel" action={<span className="text-[11px] uppercase tracking-[0.1em] text-gold">Last 7 months</span>} />
          <BarChart data={CHANNELS} />
        </Panel>
        <Panel>
          <PanelHead title="Top Campaigns" action={<span className="text-[11px] uppercase tracking-[0.1em] text-gold">By open rate</span>} />
          {hub.campaigns.map((c) => (
            <div key={c.id} className="flex items-center justify-between border-b border-line py-3.5 last:border-0">
              <div className="text-sm">{c.name}</div>
              <div className="font-serif text-gold">{c.openRate ?? 0}%</div>
            </div>
          ))}
        </Panel>
      </div>

      <Panel className="overflow-x-auto">
        <PanelHead title="Active Right Now" />
        <table className="atable">
          <thead><tr><th>Campaign</th><th>Type</th><th>Audience</th><th>Redemptions</th><th>Status</th></tr></thead>
          <tbody>
            {hub.promotions.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.type.replace(/_/g, " ").toLowerCase()}</td>
                <td>{p.audience}</td>
                <td className="text-green">{formatNumber(p.redemptions)}</td>
                <td><Pill color={STATUS_COLOR[p.status] ?? "grey"}>Live</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
