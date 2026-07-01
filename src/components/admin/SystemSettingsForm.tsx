"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Panel, Textarea, FormField, Toggle, Button, Pill } from "@/components/ui";
import { saveSystemSettings } from "@/actions/settings";
import type { SystemSettings } from "@/lib/data/settings";

export function SystemSettingsForm({ system }: { system: SystemSettings }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [on, setOn] = useState(system.maintenance);

  return (
    <Panel>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-[21px]">Maintenance Mode</h3>
        {on ? <Pill color="red">Live — storefront hidden</Pill> : <Pill color="green">Storefront live</Pill>}
      </div>
      <form
        action={(fd) =>
          start(async () => {
            fd.set("maintenance", on ? "on" : "");
            await saveSystemSettings(fd);
            toast.success("System settings saved");
            router.refresh();
          })
        }
      >
        <div className="mb-4 flex items-center justify-between border-b border-line pb-4">
          <div>
            <div className="text-sm">Enable maintenance mode</div>
            <div className="text-xs text-muted">Shows a holding page to shoppers; staff consoles stay reachable.</div>
          </div>
          <Toggle checked={on} onChange={setOn} />
        </div>
        <FormField label="Message shown to visitors">
          <Textarea name="maintenanceMessage" defaultValue={system.maintenanceMessage} rows={2} />
        </FormField>
        <Button type="submit" variant="gold" loading={pending}>Save Changes</Button>
      </form>
    </Panel>
  );
}
