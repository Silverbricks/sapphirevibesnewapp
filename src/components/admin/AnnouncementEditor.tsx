"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Panel, Input, FormField, Toggle, Button } from "@/components/ui";
import { saveAnnouncement } from "@/actions/admin";

export function AnnouncementEditor({
  text,
  ctaHref,
  enabled,
}: {
  text: string;
  ctaHref: string;
  enabled: boolean;
}) {
  const [on, setOn] = useState(enabled);
  const [saving, setSaving] = useState(false);

  return (
    <Panel className="mb-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-xl">Announcement Bar</h3>
        <div className="flex items-center gap-2 text-xs text-muted">
          {on ? "Shown" : "Hidden"} <Toggle checked={on} onChange={setOn} />
        </div>
      </div>
      <form
        action={async (fd) => {
          setSaving(true);
          fd.set("enabled", on ? "on" : "");
          await saveAnnouncement(fd);
          setSaving(false);
          toast.success("Announcement saved");
        }}
      >
        <FormField label="Text"><Input name="text" defaultValue={text} placeholder="Complimentary Express Shipping on Orders Over $250…" /></FormField>
        <FormField label="Link (optional)"><Input name="ctaHref" defaultValue={ctaHref} placeholder="/sale" /></FormField>
        <Button type="submit" variant="gold" loading={saving}>Save</Button>
      </form>
    </Panel>
  );
}
