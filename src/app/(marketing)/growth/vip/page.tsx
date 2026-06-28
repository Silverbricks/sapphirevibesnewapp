import { Check } from "lucide-react";
import { getVipTiersData } from "@/lib/data/marketing";
import { buttonClasses } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sapphire Elite" };

export default async function VipPage() {
  const tiers = await getVipTiersData();
  return (
    <>
      <PageHead
        title="Sapphire Elite"
        subtitle="Tiered VIP membership — benefits, members and tier progression."
        actions={<span className={buttonClasses("gold", "md")}>Edit Tiers</span>}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {tiers.map((t, i) => (
          <div
            key={t.id}
            className={cn(
              "rounded-card border bg-card p-6",
              i === tiers.length - 1 ? "glow-gold border-line-gold" : "border-line",
            )}
          >
            <div className="font-serif text-[26px]">{t.name}</div>
            <div className="mb-4 text-xs uppercase tracking-[0.1em] text-muted">{t.blurb}</div>
            <div className="font-serif text-[32px] text-gold">{formatNumber(t.members)}</div>
            <small className="text-muted">members</small>
            <ul className="mt-3.5 space-y-1 text-[13px]">
              {t.benefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-grey">
                  <Check className="mt-0.5 h-[15px] w-[15px] flex-shrink-0 text-gold" strokeWidth={2} />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
