"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button, Input, FormField, Panel, Toggle } from "@/components/ui";
import { updateProfile, updateNotifications, type NotifyPrefs } from "@/actions/account";

export function SettingsForms({
  name,
  email,
  phone,
  prefs,
}: {
  name: string;
  email: string;
  phone: string;
  prefs: NotifyPrefs;
}) {
  const [savingProfile, setSavingProfile] = useState(false);
  const [notif, setNotif] = useState<NotifyPrefs>(prefs);
  const [savingNotif, setSavingNotif] = useState(false);

  const NOTIF_ROWS: { key: keyof NotifyPrefs; title: string; desc: string }[] = [
    { key: "orderUpdates", title: "Order updates", desc: "Email & SMS when your order status changes" },
    { key: "newCollections", title: "New collections", desc: "Be first to shop new arrivals" },
    { key: "salesOffers", title: "Sales & offers", desc: "Exclusive discounts and flash sales" },
    { key: "styling", title: "Styling inspiration", desc: "Monthly interior styling notes" },
  ];

  return (
    <div>
      <Panel className="mb-[18px]">
        <h3 className="mb-[18px] font-serif text-[22px]">Personal Details</h3>
        <form
          action={async (fd) => {
            setSavingProfile(true);
            await updateProfile(fd);
            setSavingProfile(false);
            toast.success("Profile updated");
          }}
        >
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <FormField label="Full Name"><Input name="name" defaultValue={name} /></FormField>
            <FormField label="Email"><Input value={email} readOnly className="opacity-60" /></FormField>
            <FormField label="Phone"><Input name="phone" defaultValue={phone} /></FormField>
          </div>
          <Button type="submit" variant="gold" loading={savingProfile}>Save Changes</Button>
        </form>
      </Panel>

      <Panel>
        <h3 className="mb-[18px] font-serif text-[22px]">Notifications</h3>
        {NOTIF_ROWS.map((row) => (
          <div key={row.key} className="flex items-center justify-between border-b border-line py-3.5 last:border-0">
            <div>
              <div className="text-sm">{row.title}</div>
              <div className="text-xs text-muted">{row.desc}</div>
            </div>
            <Toggle
              checked={notif[row.key]}
              onChange={(v) => setNotif((p) => ({ ...p, [row.key]: v }))}
            />
          </div>
        ))}
        <Button
          variant="gold"
          className="mt-4"
          loading={savingNotif}
          onClick={async () => {
            setSavingNotif(true);
            await updateNotifications(notif);
            setSavingNotif(false);
            toast.success("Preferences saved");
          }}
        >
          Save Preferences
        </Button>
      </Panel>
    </div>
  );
}
