"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Settings2 } from "lucide-react";
import { Pill, Input, Select, FormField, Button, type PillColor } from "@/components/ui";
import { saveIntegration } from "@/actions/settings";

interface Integration {
  id: string;
  name: string;
  blurb: string | null;
  status: string;
  config: unknown;
}

type IntegrationConfig = { apiKey?: string; webhookUrl?: string };

const INT_COLOR: Record<string, PillColor> = { CONNECTED: "green", SETUP: "amber", DISCONNECTED: "grey" };
const label = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export function IntegrationsEditor({ integrations }: { integrations: Integration[] }) {
  const [editing, setEditing] = useState<Integration | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        {integrations.map((i) => (
          <div key={i.id} className="flex items-center justify-between border-b border-line py-3.5">
            <div>
              <div className="text-sm">{i.name}</div>
              <div className="text-xs text-muted">{i.blurb}</div>
            </div>
            <div className="flex items-center gap-3">
              <Pill color={INT_COLOR[i.status] ?? "grey"}>{label(i.status)}</Pill>
              <button onClick={() => setEditing(i)} className="text-muted hover:text-gold" aria-label="Configure"><Settings2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && <IntegrationModal integration={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function IntegrationModal({ integration, onClose }: { integration: Integration; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const cfg = (integration.config ?? {}) as IntegrationConfig;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 p-4" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-panel border border-line-gold bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted hover:text-cream"><X className="h-5 w-5" /></button>
        <h3 className="mb-1 font-serif text-xl">{integration.name}</h3>
        <p className="mb-5 text-xs text-muted">{integration.blurb}</p>
        <form
          action={(fd) =>
            start(async () => {
              await saveIntegration(integration.id, fd);
              toast.success("Integration saved");
              onClose();
              router.refresh();
            })
          }
        >
          <FormField label="Status">
            <Select name="status" defaultValue={integration.status}>
              <option value="CONNECTED">Connected</option>
              <option value="SETUP">Setup</option>
              <option value="DISCONNECTED">Disconnected</option>
            </Select>
          </FormField>
          <FormField label="API Key"><Input name="apiKey" type="password" defaultValue={cfg.apiKey ?? ""} placeholder="••••••••" /></FormField>
          <FormField label="Webhook URL"><Input name="webhookUrl" defaultValue={cfg.webhookUrl ?? ""} placeholder="https://…" /></FormField>
          <Button type="submit" variant="gold" loading={pending}>Save Integration</Button>
        </form>
      </div>
    </div>
  );
}
