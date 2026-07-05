"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Panel, Toggle, Button } from "@/components/ui";
import { PAYMENT_METHODS_CATALOGUE } from "@/lib/constants";
import { savePaymentSettings } from "@/actions/settings";
import type { PaymentSettings } from "@/lib/data/settings";

export function PaymentSettingsForm({ payments }: { payments: PaymentSettings }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [methods, setMethods] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const p of PAYMENT_METHODS_CATALOGUE) m[p.key] = payments.methods[p.key] ?? p.defaultOn;
    return m;
  });

  const toggle = (key: string) => setMethods((s) => ({ ...s, [key]: !s[key] }));
  const enabledCount = Object.values(methods).filter(Boolean).length;

  return (
    <Panel>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-[21px]">Payment Methods</h3>
        <span className="text-xs text-muted">{enabledCount} enabled</span>
      </div>
      <p className="mb-4 text-sm text-muted">
        Choose which payment options shoppers see at checkout. Disabled methods are hidden.
      </p>
      <form
        action={() =>
          start(async () => {
            const fd = new FormData();
            fd.set("payload", JSON.stringify({ methods }));
            const res = await savePaymentSettings(fd);
            if (res.ok) {
              toast.success("Payment methods saved");
              router.refresh();
            } else {
              toast.error("Could not save payment methods");
            }
          })
        }
      >
        {PAYMENT_METHODS_CATALOGUE.map((p) => (
          <div key={p.key} className="flex items-center justify-between border-b border-line py-3.5">
            <div>
              <div className="text-sm">{p.label}</div>
              <div className="text-xs text-muted">{p.desc}</div>
            </div>
            <Toggle checked={!!methods[p.key]} onChange={() => toggle(p.key)} />
          </div>
        ))}
        <Button type="submit" variant="gold" loading={pending} className="mt-5">
          Save Changes
        </Button>
      </form>
    </Panel>
  );
}
