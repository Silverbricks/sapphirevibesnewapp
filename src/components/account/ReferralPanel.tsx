"use client";

import { Copy, Facebook, Twitter, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { SummaryCard, Panel, Pill } from "@/components/ui";
import { formatMoney, formatDate } from "@/lib/format";

interface Referral {
  id: string;
  refereeEmail: string | null;
  status: string;
  rewardCents: number;
  createdAt: Date;
}

export function ReferralPanel({
  referralCode,
  invitesSent,
  joined,
  creditEarnedCents,
  referrals,
}: {
  referralCode: string;
  invitesSent: number;
  joined: number;
  creditEarnedCents: number;
  referrals: Referral[];
}) {
  const link = `sapphirevibes.au/r/${referralCode}`;

  function copy() {
    navigator.clipboard?.writeText(`https://${link}`);
    toast.success("Referral link copied");
  }

  return (
    <div>
      <h1 className="font-serif text-[34px]">Refer &amp; Earn</h1>
      <p className="mb-6 text-[13px] text-muted">
        Give friends $20 off their first order — and earn $20 credit when they buy.
      </p>

      <div className="glow-gold mb-6 rounded-panel border border-line-gold bg-card p-9 text-center">
        <h2 className="mb-2 font-serif text-[38px]">Give $20, Get $20</h2>
        <p className="mx-auto mb-5 max-w-[420px] text-muted">
          Share your personal link. When a friend spends $100+, you both get $20 credit toward your next order.
        </p>
        <div className="mx-auto flex max-w-[460px]">
          <input
            value={link}
            readOnly
            className="flex-1 rounded-l-[9px] border border-r-0 border-line bg-white/[0.05] px-4 py-3 text-sm text-gold outline-none"
          />
          <button onClick={copy} className="flex items-center gap-1.5 rounded-r-[9px] bg-gold px-5 text-xs font-medium uppercase tracking-[0.1em] text-ink">
            <Copy className="h-3.5 w-3.5" /> Copy
          </button>
        </div>
        <div className="mt-5 flex justify-center gap-3">
          {[Facebook, Twitter, Mail, MessageCircle].map((Icon, i) => (
            <button key={i} className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-line text-grey transition-colors hover:border-gold hover:text-gold">
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard value={invitesSent} label="Invites Sent" />
        <SummaryCard value={joined} label="Friends Joined" />
        <SummaryCard value={formatMoney(creditEarnedCents)} label="Credit Earned" />
      </div>

      <Panel>
        <h3 className="mb-4 font-serif text-[22px]">Referral Activity</h3>
        {referrals.length === 0 && <p className="text-sm text-muted">No referrals yet — share your link to start earning.</p>}
        {referrals.map((r) => (
          <div key={r.id} className="flex items-center justify-between border-b border-line py-3.5 last:border-0">
            <div>
              <div className="text-sm">
                {r.status === "INVITED" ? `Invite sent to ${r.refereeEmail}` : `${r.refereeEmail} placed first order`}
              </div>
              <div className="text-xs text-muted">{formatDate(r.createdAt)}</div>
            </div>
            {r.status === "CONVERTED" ? (
              <span className="text-green">+{formatMoney(r.rewardCents)}</span>
            ) : (
              <Pill color="amber">{r.status === "JOINED" ? "Joined" : "Pending"}</Pill>
            )}
          </div>
        ))}
      </Panel>
    </div>
  );
}
