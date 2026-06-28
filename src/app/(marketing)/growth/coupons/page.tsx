import { getCouponsData } from "@/lib/data/marketing";
import { StatCard, buttonClasses } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { formatNumber, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Coupons" };

function describe(c: { type: string; percent: number | null; valueCents: number | null; description: string | null }) {
  if (c.description) return c.description;
  if (c.type === "PERCENT") return `${c.percent}% off`;
  if (c.type === "FIXED") return `$${(c.valueCents ?? 0) / 100} off`;
  return "Free shipping";
}

export default async function CouponsPage() {
  const { coupons, activeCount, totalRedemptions } = await getCouponsData();
  return (
    <>
      <PageHead
        title="Coupons & Discounts"
        subtitle="Percentage, fixed, free-shipping and targeted coupon codes."
        actions={<span className={buttonClasses("gold", "md")}>+ Create Coupon</span>}
      />
      <div className="mb-[26px] grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Coupons" value={activeCount} />
        <StatCard label="Total Redemptions" value={formatNumber(totalRedemptions)} />
        <StatCard label="Codes" value={coupons.length} />
        <StatCard label="Avg. Order w/ Coupon" value="$214" />
      </div>
      <div className="space-y-3">
        {coupons.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-card border border-dashed border-line-gold p-5" style={{ background: "linear-gradient(135deg,#171c24,rgba(200,164,92,.06))" }}>
            <div>
              <div className="font-serif text-2xl tracking-[0.04em] text-gold">{c.code}</div>
              <div className="text-xs text-muted">{describe(c)}{c.tradeOnly ? " · trade & Elite" : ""}{c.firstOrderOnly ? " · first order" : ""}</div>
            </div>
            <div className="text-right">
              <b className="text-lg font-normal">{formatNumber(c.usedCount)} uses</b>
              <small className="block text-xs text-muted">{c.expiresAt ? `Exp ${formatDate(c.expiresAt)}` : "No expiry"}</small>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
