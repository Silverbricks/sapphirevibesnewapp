import { getReferralLeaderboard } from "@/lib/data/marketing";
import { StatCard, Panel, PanelHead, buttonClasses } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { formatNumber, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Referrals" };

export default async function ReferralsPage() {
  const { leaderboard, totalReferrers, invitations, converted } = await getReferralLeaderboard();
  return (
    <>
      <PageHead
        title="Referral Program"
        subtitle="Give $20, get $20 — track invitations, conversions and top advocates."
        actions={<span className={buttonClasses("gold", "md")}>Edit Reward</span>}
      />
      <div className="mb-[26px] grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Referrers" value={formatNumber(totalReferrers)} />
        <StatCard label="Invitations Sent" value={formatNumber(invitations)} />
        <StatCard label="Converted" value={formatNumber(converted)} delta={invitations ? `${Math.round((converted / invitations) * 100)}% conversion` : undefined} />
        <StatCard label="Referral Revenue" value="$78k" />
      </div>
      <Panel className="overflow-x-auto">
        <PanelHead title="Referral Leaderboard" />
        <table className="atable">
          <thead><tr><th>Rank</th><th>Advocate</th><th>Invites</th><th>Converted</th><th>Rewards Earned</th></tr></thead>
          <tbody>
            {leaderboard.map((r, i) => (
              <tr key={r.name + i}>
                <td className="font-serif text-lg text-gold">{i + 1}</td>
                <td>{r.name}</td>
                <td>{r.invites}</td>
                <td>{r.converted}</td>
                <td className="text-gold">{formatMoney(r.rewardCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
