import { getPromotions } from "@/lib/data/marketing";
import { Panel, Pill, buttonClasses, type PillColor } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { formatNumber, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promotions" };

const STATUS_COLOR: Record<string, PillColor> = { LIVE: "green", SCHEDULED: "gold", PAUSED: "grey", DRAFT: "amber", SENT: "blue" };

export default async function PromotionsPage() {
  const promos = await getPromotions();
  return (
    <>
      <PageHead
        title="Promotions & Campaigns"
        subtitle="Flash sales, BOGO, bundles, spend & save, member offers and seasonal specials."
        actions={<span className={buttonClasses("gold", "md")}>+ New Promotion</span>}
      />
      <Panel className="overflow-x-auto p-0">
        <table className="atable">
          <thead><tr><th>Promotion</th><th>Type</th><th>Discount</th><th>Audience</th><th>Period</th><th>Redemptions</th><th>Status</th></tr></thead>
          <tbody>
            {promos.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.type.replace(/_/g, " ").toLowerCase()}</td>
                <td>{p.discount}</td>
                <td>{p.audience}</td>
                <td className="text-muted">{p.startsAt ? formatDate(p.startsAt) : "Ongoing"}</td>
                <td>{formatNumber(p.redemptions)}</td>
                <td><Pill color={STATUS_COLOR[p.status] ?? "grey"}>{p.status.charAt(0) + p.status.slice(1).toLowerCase()}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
