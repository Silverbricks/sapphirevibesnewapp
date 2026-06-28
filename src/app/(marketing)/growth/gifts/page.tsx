import { getGiftCardsData } from "@/lib/data/marketing";
import { StatCard, Panel, PanelHead, Pill, Toggle, buttonClasses } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gift Centre" };

export default async function GiftCentrePage() {
  const { outstandingCents, soldCount } = await getGiftCardsData();
  return (
    <>
      <PageHead
        title="Gift Centre"
        subtitle="Gift cards, free-gift promotions, wrapping and personalised messages."
        actions={<span className={buttonClasses("gold", "md")}>New Gift Card</span>}
      />
      <div className="mb-[26px] grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Gift Cards Sold" value={String(soldCount)} />
        <StatCard label="Outstanding Balance" value={formatMoney(outstandingCents)} />
        <StatCard label="Free Gifts Claimed" value="188" />
        <StatCard label="Wrapping Add-ons" value="$3.2k" />
      </div>
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <Panel>
          <PanelHead title="Gift Card Designs" />
          {[
            ["Classic Gold", "$50 · $100 · $250 · custom", "green", "Active"],
            ["Wedding & Celebration", "Schedulable delivery", "green", "Active"],
            ["Festive Edition", "Seasonal · Dec", "amber", "Scheduled"],
          ].map(([n, d, c, s]) => (
            <div key={n as string} className="flex items-center justify-between border-b border-line py-3.5 last:border-0">
              <div>
                <b className="text-sm font-normal">{n}</b>
                <small className="block text-xs text-muted">{d}</small>
              </div>
              <Pill color={c as "green" | "amber"}>{s}</Pill>
            </div>
          ))}
        </Panel>
        <Panel>
          <PanelHead title="Gift Options" />
          {[
            ["Complimentary gift wrapping", "Free for Gold & Elite, $6.95 otherwise", true],
            ["Personalised gift messages", "Hand-written card on request", true],
            ["Scheduled gift card delivery", "Send on a chosen date", true],
            ["Free gift with purchase", "Auto-add over $250", true],
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
    </>
  );
}
