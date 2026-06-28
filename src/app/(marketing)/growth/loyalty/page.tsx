import { getLoyaltyData } from "@/lib/data/marketing";
import { StatCard, Panel, PanelHead, buttonClasses } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Loyalty & Rewards" };

export default async function LoyaltyPage() {
  const { earn, redeem, members, pointsIssued } = await getLoyaltyData();
  return (
    <>
      <PageHead
        title="Loyalty & Rewards"
        subtitle="Sapphire Points — earning rules, redemption catalogue and engagement."
        actions={<span className={buttonClasses("gold", "md")}>Edit Earning Rules</span>}
      />
      <div className="mb-[26px] grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Members" value={formatNumber(members)} delta="growing" />
        <StatCard label="Points Issued" value={formatNumber(pointsIssued)} />
        <StatCard label="Redemption Rate" value="43%" />
        <StatCard label="Avg. Points / Member" value={members ? formatNumber(Math.round(pointsIssued / members)) : "0"} />
      </div>
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <Panel>
          <PanelHead title="Earn Points" />
          {earn.map((r) => (
            <div key={r.id} className="flex items-center justify-between border-b border-line py-3 last:border-0">
              <b className="text-sm font-normal">{r.action}</b>
              <span className="font-serif text-[17px] text-gold">{r.points}</span>
            </div>
          ))}
        </Panel>
        <Panel>
          <PanelHead title="Redeem Points" />
          {redeem.map((r) => (
            <div key={r.id} className="flex items-center justify-between border-b border-line py-3 last:border-0">
              <b className="text-sm font-normal">{r.label}</b>
              <span className="font-serif text-[17px] text-gold">{r.pointsCost}</span>
            </div>
          ))}
        </Panel>
      </div>
    </>
  );
}
