import { getIntegrationsGrouped } from "@/lib/data/marketing";
import { Panel, PanelHead, Pill, type PillColor } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";

export const dynamic = "force-dynamic";
export const metadata = { title: "Integrations" };

const STATUS_COLOR: Record<string, PillColor> = { CONNECTED: "green", SETUP: "amber", DISCONNECTED: "grey" };

export default async function IntegrationsPage() {
  const groups = await getIntegrationsGrouped();
  return (
    <>
      <PageHead title="Integrations" subtitle="Marketing, payments, shipping and analytics connections." />
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        {groups.map((g) => (
          <Panel key={g.category}>
            <PanelHead title={g.category} />
            {g.items.map((i) => (
              <div key={i.id} className="flex items-center gap-3.5 border-b border-line py-3.5 last:border-0">
                <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[9px] bg-panel font-serif text-[15px] font-semibold text-gold">
                  {i.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <b className="text-sm font-normal">{i.name}</b>
                  <small className="block text-xs text-muted">{i.blurb}</small>
                </div>
                <Pill color={STATUS_COLOR[i.status] ?? "grey"}>{i.status.charAt(0) + i.status.slice(1).toLowerCase()}</Pill>
              </div>
            ))}
          </Panel>
        ))}
      </div>
    </>
  );
}
