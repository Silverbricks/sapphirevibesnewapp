import { getSegmentsData } from "@/lib/data/marketing";
import { Panel, PanelHead, Pill, buttonClasses } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { formatNumber, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "CRM & Segments" };

export default async function CrmPage() {
  const segments = await getSegmentsData();
  return (
    <>
      <PageHead
        title="CRM & Segments"
        subtitle="Customer profiles, behavioural segments and marketing consent."
        actions={<span className={buttonClasses("gold", "md")}>Build Segment</span>}
      />
      <Panel className="mb-[18px] overflow-x-auto">
        <PanelHead title="Active Segments" />
        <table className="atable">
          <thead><tr><th>Segment</th><th>Rule</th><th>Customers</th><th>Avg. CLV</th><th>Consent</th></tr></thead>
          <tbody>
            {segments.map((s) => (
              <tr key={s.id}>
                <td><b className="font-normal">{s.name}</b></td>
                <td className="text-muted">{s.rule}</td>
                <td>{formatNumber(s.count)}</td>
                <td className="text-gold">{formatMoney(s.avgClvCents)}</td>
                <td><Pill color={s.consent === "Mixed" ? "amber" : "green"}>{s.consent}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <Panel>
        <PanelHead title="Customer 360 — sample profile" />
        <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
          {[
            ["Purchase history", "42 orders · $4,820"],
            ["Favourite categories", "Lighting, Décor"],
            ["Loyalty points", "1,240 · Gold"],
            ["Wishlist items", "6 saved"],
            ["Support tickets", "2 · resolved"],
            ["Email consent", "Opted in"],
            ["SMS consent", "Opted in"],
            ["Preferred channel", "Email"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border-b border-line py-3 text-sm">
              <b className="font-normal">{k}</b>
              <small className="text-muted">{v}</small>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
