"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Panel, Toggle, Button } from "@/components/ui";
import { saveShippingSettings } from "@/actions/settings";
import type { ShippingSettings } from "@/lib/data/settings";

const ROWS: { key: keyof ShippingSettings; label: string; desc: string }[] = [
  { key: "freeOver250", label: "Free shipping over $250", desc: "Standard domestic orders" },
  { key: "express", label: "Express shipping", desc: "$14.95 flat · Australia Post" },
  { key: "clickCollect", label: "Click & Collect", desc: "Showroom pickup" },
  { key: "localDelivery", label: "Local delivery", desc: "Within 25km · $9.95" },
];

export function ShippingSettingsForm({ shipping }: { shipping: ShippingSettings }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [state, setState] = useState(shipping);

  const toggle = (key: keyof ShippingSettings) => setState((s) => ({ ...s, [key]: !s[key] }));

  return (
    <Panel>
      <h3 className="mb-4 font-serif text-[21px]">Shipping Rules</h3>
      <form
        action={() =>
          start(async () => {
            const fd = new FormData();
            ROWS.forEach((r) => state[r.key] && fd.set(r.key, "on"));
            await saveShippingSettings(fd);
            toast.success("Shipping rules saved");
            router.refresh();
          })
        }
      >
        {ROWS.map((r) => (
          <div key={r.key} className="flex items-center justify-between border-b border-line py-3.5">
            <div>
              <div className="text-sm">{r.label}</div>
              <div className="text-xs text-muted">{r.desc}</div>
            </div>
            <Toggle checked={state[r.key]} onChange={() => toggle(r.key)} />
          </div>
        ))}
        <Button type="submit" variant="gold" loading={pending} className="mt-5">Save Changes</Button>
      </form>
    </Panel>
  );
}
