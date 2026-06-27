import { requireUser } from "@/lib/auth-helpers";
import { getGiftCentreData } from "@/lib/data/account";
import { Panel, Pill, Toggle, buttonClasses } from "@/components/ui";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gift Centre" };

export default async function GiftCentrePage() {
  const user = await requireUser();
  const { giftCards } = await getGiftCentreData(user.id);
  const card = giftCards[0];

  return (
    <div>
      <h1 className="font-serif text-[34px]">Gift Centre</h1>
      <p className="mb-6 text-[13px] text-muted">Your gift cards, plus options for sending and wrapping gifts.</p>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-card border border-line-gold p-[26px]" style={{ background: "linear-gradient(135deg,#1c2129,#13171d)" }}>
          <div className="font-serif text-[22px]">Sapphire Vibes Gift Card</div>
          <div className="my-2.5 font-serif text-[38px] text-gold">
            {card ? formatMoney(card.balanceCents) : "$0.00"}
          </div>
          <div className="text-xs text-muted">
            {card ? `Balance · code ····${card.code.slice(-4)} · no expiry` : "No gift cards yet"}
          </div>
        </div>
        <div className="rounded-card border border-line bg-card p-[22px]">
          <h4 className="mb-3.5 font-serif text-xl">Buy a Gift Card</h4>
          <div className="mb-3.5 flex flex-wrap gap-2">
            {["$50", "$100", "$250", "Custom"].map((v) => (
              <Pill key={v} color="gold">{v}</Pill>
            ))}
          </div>
          <button className={buttonClasses("gold", "md")}>Purchase &amp; Send</button>
        </div>
      </div>

      <Panel className="mb-5">
        <h3 className="mb-4 font-serif text-[22px]">Gift Options</h3>
        {[
          ["Schedule gift card delivery", "Send on a date you choose", false],
          ["Add a personalised message", "Hand-written card included", false],
          ["Gift wrapping", "Complimentary for Gold members", true],
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

      <Panel>
        <h3 className="mb-1 font-serif text-[22px]">Available to Claim</h3>
        <p className="mb-3.5 text-[13px] text-muted">Rewards and free gifts you&apos;ve unlocked.</p>
        <div className="flex items-center justify-between border-b border-line py-3.5">
          <div>
            <div className="text-sm">🎁 Free Ceramic Candle</div>
            <div className="text-xs text-muted">Unlocked — orders over $250</div>
          </div>
          <button className={buttonClasses("outline", "sm")}>Claim</button>
        </div>
        <div className="flex items-center justify-between py-3.5">
          <div>
            <div className="text-sm">Complimentary gift wrapping</div>
            <div className="text-xs text-muted">Gold member benefit</div>
          </div>
          <Pill color="green">Always available</Pill>
        </div>
      </Panel>
    </div>
  );
}
