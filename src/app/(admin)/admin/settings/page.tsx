import { getSettingsData } from "@/lib/data/admin";
import { Panel, Pill, Toggle, Input, FormField, buttonClasses, type PillColor } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings · Admin" };

const INT_COLOR: Record<string, PillColor> = { CONNECTED: "green", SETUP: "amber", DISCONNECTED: "grey" };

export default async function SettingsPage() {
  const { settings, integrations } = await getSettingsData();
  const tax = (settings.tax ?? {}) as { gstRate?: number; display?: string; abn?: string };

  return (
    <>
      <PageHead
        title="Settings"
        subtitle="Store configuration, tax, shipping, payments and integrations."
        actions={<span className={buttonClasses("gold", "md")}>Save All</span>}
      />

      <div className="mb-[18px] grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <Panel>
          <h3 className="mb-4 font-serif text-[21px]">Tax &amp; GST</h3>
          <FormField label="GST Rate"><Input defaultValue={`${(tax.gstRate ?? 0.1) * 100}%`} /></FormField>
          <FormField label="Tax Display"><Input defaultValue={tax.display ?? "Inclusive of GST"} /></FormField>
          <FormField label="Business ABN"><Input defaultValue={tax.abn ?? "00 000 000 000"} /></FormField>
        </Panel>
        <Panel>
          <h3 className="mb-4 font-serif text-[21px]">Shipping Rules</h3>
          {[
            ["Free shipping over $250", "Standard domestic orders", true],
            ["Express shipping", "$14.95 flat · Australia Post", true],
            ["Click & Collect", "Melbourne showroom", false],
            ["Local delivery", "Within 25km · $9.95", true],
          ].map(([t, d, on]) => (
            <div key={t as string} className="flex items-center justify-between border-b border-line py-3.5 last:border-0">
              <div>
                <div className="text-sm">{t}</div>
                <div className="text-xs text-muted">{d}</div>
              </div>
              <Toggle checked={on as boolean} />
            </div>
          ))}
        </Panel>
      </div>

      <Panel>
        <h3 className="mb-4 font-serif text-[21px]">Integrations</h3>
        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          {integrations.map((i) => (
            <div key={i.id} className="flex items-center justify-between border-b border-line py-3.5">
              <div>
                <div className="text-sm">{i.name}</div>
                <div className="text-xs text-muted">{i.blurb}</div>
              </div>
              <Pill color={INT_COLOR[i.status] ?? "grey"}>{i.status.charAt(0) + i.status.slice(1).toLowerCase()}</Pill>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
