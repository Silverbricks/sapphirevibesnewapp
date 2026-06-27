import { requireUser } from "@/lib/auth-helpers";
import { getRewardsData } from "@/lib/data/account";
import { SummaryCard, Panel, ProgressBar } from "@/components/ui";
import { formatMoney, formatNumber, formatDate } from "@/lib/format";
import { POINTS_REDEEM_VALUE_CENTS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rewards" };

export default async function RewardsPage() {
  const user = await requireUser();
  const { user: profile, txns, tiers, lifetimeSpendCents } = await getRewardsData(user.id);
  const points = profile?.pointsBalance ?? 0;

  const currentOrder = profile?.vipTier?.order ?? 0;
  const nextTier = tiers.find((t) => t.order > currentOrder);
  const progressMax = nextTier?.minSpendCents ?? (lifetimeSpendCents || 1);
  const remaining = nextTier ? Math.max(0, nextTier.minSpendCents - lifetimeSpendCents) : 0;

  const earnedThisYear = txns
    .filter((t) => t.points > 0 && new Date(t.createdAt).getFullYear() === new Date().getFullYear())
    .reduce((s, t) => s + t.points, 0);

  return (
    <div>
      <h1 className="font-serif text-[34px]">Rewards</h1>
      <p className="mb-6 text-[13px] text-muted">Earn 1 point for every $1 spent. Redeem points at checkout.</p>

      <div className="glow-gold mb-6 flex flex-wrap items-center justify-between gap-5 rounded-panel border border-line-gold bg-card p-[30px]">
        <div>
          <div className="font-serif text-[52px] leading-none text-gold">{formatNumber(points)}</div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted">Available Points</div>
        </div>
        <div className="max-w-[380px] flex-1" style={{ minWidth: 240 }}>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted">
            {nextTier ? `${formatMoney(remaining)} spend to ${nextTier.name} tier` : "Top tier reached"}
          </div>
          <ProgressBar value={lifetimeSpendCents} max={progressMax} className="my-2.5" />
          <small className="text-xs text-muted">
            {profile?.vipTier?.name ?? "Silver"} member since {profile ? formatDate(profile.createdAt).split(" ").slice(-1) : ""} · Unlock free express shipping &amp; early access
          </small>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard value={formatMoney(points * POINTS_REDEEM_VALUE_CENTS)} label="Points Value" />
        <SummaryCard value={formatNumber(earnedThisYear)} label="Earned This Year" />
        <SummaryCard value="2x" label="Points on Birthdays" />
      </div>

      <Panel>
        <h3 className="mb-4 font-serif text-[22px]">Points Activity</h3>
        {txns.length === 0 && <p className="text-sm text-muted">No activity yet.</p>}
        {txns.map((t) => (
          <div key={t.id} className="flex items-center justify-between border-b border-line py-3.5 last:border-0">
            <div>
              <div className="text-sm">{t.note ?? t.reason.replace(/_/g, " ")}</div>
              <div className="text-xs text-muted">{formatDate(t.createdAt)}</div>
            </div>
            <span className={t.points >= 0 ? "text-green" : "text-amber"}>
              {t.points >= 0 ? "+" : ""}
              {formatNumber(t.points)}
            </span>
          </div>
        ))}
      </Panel>
    </div>
  );
}
