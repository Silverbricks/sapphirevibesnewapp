import { requireUser } from "@/lib/auth-helpers";
import { getReferralData } from "@/lib/data/account";
import { ReferralPanel } from "@/components/account/ReferralPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Refer & Earn" };

export default async function ReferralsPage() {
  const user = await requireUser();
  const data = await getReferralData(user.id);
  return (
    <ReferralPanel
      referralCode={data.referralCode}
      invitesSent={data.invitesSent}
      joined={data.joined}
      creditEarnedCents={data.creditEarnedCents}
      referrals={data.referrals}
    />
  );
}
