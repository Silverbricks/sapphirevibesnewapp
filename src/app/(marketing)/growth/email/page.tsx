import { getEmailData } from "@/lib/data/marketing";
import { StatCard, Panel, PanelHead, Pill, buttonClasses, type PillColor } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Email & Newsletter" };

const STATUS_COLOR: Record<string, PillColor> = { LIVE: "green", SCHEDULED: "gold", SENT: "blue", DRAFT: "amber", PAUSED: "grey" };

export default async function EmailPage() {
  const { campaigns, automations, segments, subscriberCount } = await getEmailData();
  return (
    <>
      <PageHead
        title="Email & Newsletter"
        subtitle="Campaigns, automations, subscriber segments and deliverability."
        actions={<span className={buttonClasses("gold", "md")}>New Email</span>}
      />
      <div className="mb-[26px] grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Subscribers" value={formatNumber(subscriberCount)} delta="double opt-in" />
        <StatCard label="Avg. Open Rate" value="41%" />
        <StatCard label="Avg. Click Rate" value="7.8%" />
        <StatCard label="Unsubscribe Rate" value="0.3%" />
      </div>

      <div className="mb-[18px] grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <Panel>
          <PanelHead title="Automations" />
          {automations.map((a) => (
            <div key={a.id} className="flex items-center justify-between border-b border-line py-3.5 last:border-0">
              <div>
                <b className="text-sm font-normal">{a.name}</b>
                {a.metric && <small className="block text-xs text-muted">{a.metric}</small>}
              </div>
              <Pill color={STATUS_COLOR[a.status] ?? "grey"}>{a.status.charAt(0) + a.status.slice(1).toLowerCase()}</Pill>
            </div>
          ))}
        </Panel>
        <Panel>
          <PanelHead title="Recent Campaigns" />
          {campaigns.map((c) => (
            <div key={c.id} className="flex items-center justify-between border-b border-line py-3.5 last:border-0">
              <div className="text-sm">{c.name}</div>
              {c.status === "SENT" ? <Pill color="blue">{c.openRate ?? 0}% open</Pill> : <Pill color={STATUS_COLOR[c.status] ?? "grey"}>{c.status.charAt(0) + c.status.slice(1).toLowerCase()}</Pill>}
            </div>
          ))}
        </Panel>
      </div>

      <Panel>
        <PanelHead title="Subscriber Segments" />
        <div className="flex flex-wrap gap-2">
          {segments.map((s) => (
            <span key={s.id} className="rounded-full bg-purple/[0.15] px-3 py-1.5 text-[11px] text-purple">
              {s.name} · {formatNumber(s.count)}
            </span>
          ))}
        </div>
      </Panel>
    </>
  );
}
