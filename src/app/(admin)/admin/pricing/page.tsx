import { getPriceRules } from "@/lib/data/admin";
import { Panel, PanelHead, Pill, Input, Select, FormField, Button, buttonClasses, type PillColor } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pricing · Admin" };

const STATUS_COLOR: Record<string, PillColor> = {
  LIVE: "green",
  SCHEDULED: "gold",
  DRAFT: "amber",
  PAUSED: "grey",
  SENT: "blue",
};

export default async function PricingPage() {
  const rules = await getPriceRules();
  return (
    <>
      <PageHead
        title="Pricing Management"
        subtitle="Bulk updates, scheduled changes, flash sales and tiered pricing."
        actions={<span className={buttonClasses("gold", "md")}>Schedule Price Change</span>}
      />
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <Panel>
          <PanelHead title="Active Price Rules" />
          <div>
            {rules.map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b border-line py-3.5 last:border-0">
                <div>
                  <div className="text-sm">{r.name}</div>
                  <div className="text-[11px] text-muted">
                    {r.adjustmentType === "decrease_pct" ? `−${r.value}%` : r.adjustmentType === "increase_pct" ? `+${r.value}%` : `Set $${r.value}`}
                    {r.targetLabel ? ` · ${r.targetLabel}` : ` · ${r.scope.toLowerCase()}`}
                  </div>
                </div>
                <Pill color={STATUS_COLOR[r.status] ?? "grey"}>{r.status === "LIVE" ? "Live" : r.status === "SCHEDULED" ? "Scheduled" : r.status}</Pill>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHead title="Bulk Price Update" />
          <FormField label="Apply to">
            <Select>
              <option>Category: Lighting</option>
              <option>Collection: Best Sellers</option>
              <option>All products</option>
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Adjustment">
              <Select>
                <option>Decrease %</option>
                <option>Increase %</option>
                <option>Set fixed price</option>
              </Select>
            </FormField>
            <FormField label="Value"><Input type="number" defaultValue={15} /></FormField>
          </div>
          <FormField label="Schedule (optional)"><Input type="date" /></FormField>
          <Button variant="gold">Preview &amp; Apply</Button>
        </Panel>
      </div>
    </>
  );
}
