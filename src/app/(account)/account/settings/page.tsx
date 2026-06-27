import { requireUser } from "@/lib/auth-helpers";
import { getUserProfile } from "@/lib/data/account";
import { SettingsForms } from "@/components/account/SettingsForms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getUserProfile(user.id);

  return (
    <div>
      <h1 className="font-serif text-[34px]">Account Settings</h1>
      <p className="mb-7 text-[13px] text-muted">Update your details and communication preferences.</p>
      <SettingsForms
        name={profile?.name ?? ""}
        email={profile?.email ?? ""}
        phone={profile?.phone ?? ""}
        prefs={{
          orderUpdates: profile?.notifyOrderUpdates ?? true,
          newCollections: profile?.notifyNewCollections ?? true,
          salesOffers: profile?.notifySalesOffers ?? false,
          styling: profile?.notifyStyling ?? true,
        }}
      />
    </div>
  );
}
