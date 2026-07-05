"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { Panel, Toggle, Button, Input, Textarea, FormField } from "@/components/ui";
import { saveFulfilmentSettings } from "@/actions/settings";
import type { FulfilmentSettings } from "@/lib/data/settings";

const toDollars = (cents: number) => (cents ? (cents / 100).toString() : "");
const toCents = (v: string) => Math.max(0, Math.round((parseFloat(v) || 0) * 100));
const uid = () => Math.random().toString(36).slice(2, 8);

interface ZoneRow {
  id: string;
  name: string;
  postcodes: string;
  fee: string; // dollars
  eta: string;
}

const ORDER_TYPES: { key: FulfilmentSettings["orderType"]; label: string; desc: string }[] = [
  { key: "pickup", label: "Pickup only", desc: "Customers collect in store" },
  { key: "delivery", label: "Delivery only", desc: "We deliver to the customer" },
  { key: "both", label: "Both", desc: "Customer chooses at checkout" },
];

export function FulfilmentSettingsForm({ fulfilment }: { fulfilment: FulfilmentSettings }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [orderType, setOrderType] = useState(fulfilment.orderType);
  const [pickup, setPickup] = useState(fulfilment.pickup);
  const [delivery, setDelivery] = useState({
    enabled: fulfilment.delivery.enabled,
    minOrder: toDollars(fulfilment.delivery.minOrderCents),
    freeOver: toDollars(fulfilment.delivery.freeOverCents),
  });
  const [zones, setZones] = useState<ZoneRow[]>(
    fulfilment.delivery.zones.map((z) => ({
      id: z.id,
      name: z.name,
      postcodes: z.postcodes,
      fee: toDollars(z.feeCents),
      eta: z.eta,
    })),
  );

  const setZone = (id: string, patch: Partial<ZoneRow>) =>
    setZones((zs) => zs.map((z) => (z.id === id ? { ...z, ...patch } : z)));
  const addZone = () => setZones((zs) => [...zs, { id: uid(), name: "", postcodes: "", fee: "", eta: "" }]);
  const removeZone = (id: string) => setZones((zs) => zs.filter((z) => z.id !== id));

  const submit = () =>
    start(async () => {
      const payload: FulfilmentSettings = {
        orderType,
        pickup: { ...pickup, prepTimeMinutes: Number(pickup.prepTimeMinutes) || 0 },
        delivery: {
          enabled: delivery.enabled,
          minOrderCents: toCents(delivery.minOrder),
          freeOverCents: toCents(delivery.freeOver),
          zones: zones
            .filter((z) => z.name.trim() || z.postcodes.trim())
            .map((z) => ({
              id: z.id,
              name: z.name.trim(),
              postcodes: z.postcodes.trim(),
              feeCents: toCents(z.fee),
              eta: z.eta.trim(),
            })),
        },
      };
      const fd = new FormData();
      fd.set("payload", JSON.stringify(payload));
      const res = await saveFulfilmentSettings(fd);
      if (res.ok) {
        toast.success("Delivery & pickup settings saved");
        router.refresh();
      } else {
        toast.error("Could not save — please check the fields");
      }
    });

  return (
    <Panel>
      <h3 className="mb-1 font-serif text-[21px]">Delivery &amp; Pickup</h3>
      <p className="mb-5 text-sm text-muted">
        Control how customers receive their orders and what you charge for delivery.
      </p>

      {/* Order type */}
      <div className="mb-6">
        <div className="mb-2 text-[11px] uppercase tracking-[0.12em] text-muted">Order type</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {ORDER_TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setOrderType(t.key)}
              className={`rounded-card border p-3 text-left transition-colors ${
                orderType === t.key ? "border-gold bg-gold/10" : "border-line hover:border-gold/50"
              }`}
            >
              <div className="text-sm">{t.label}</div>
              <div className="text-xs text-muted">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Pickup */}
      <div className="mb-6 rounded-card border border-line p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm">Pickup</div>
            <div className="text-xs text-muted">In-store collection</div>
          </div>
          <Toggle checked={pickup.enabled} onChange={(v) => setPickup((p) => ({ ...p, enabled: v }))} />
        </div>
        <FormField label="Pickup address">
          <Input value={pickup.address} onChange={(e) => setPickup((p) => ({ ...p, address: e.target.value }))} />
        </FormField>
        <FormField label="Pickup instructions">
          <Textarea
            rows={2}
            value={pickup.instructions}
            onChange={(e) => setPickup((p) => ({ ...p, instructions: e.target.value }))}
          />
        </FormField>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <FormField label="Prep time (minutes)">
            <Input
              type="number"
              min={0}
              value={pickup.prepTimeMinutes}
              onChange={(e) => setPickup((p) => ({ ...p, prepTimeMinutes: Number(e.target.value) }))}
            />
          </FormField>
          <FormField label="Opening schedule">
            <Input value={pickup.schedule} onChange={(e) => setPickup((p) => ({ ...p, schedule: e.target.value }))} />
          </FormField>
        </div>
      </div>

      {/* Delivery */}
      <div className="rounded-card border border-line p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm">Delivery</div>
            <div className="text-xs text-muted">Charged by postcode zone</div>
          </div>
          <Toggle checked={delivery.enabled} onChange={(v) => setDelivery((d) => ({ ...d, enabled: v }))} />
        </div>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <FormField label="Minimum order for delivery ($)">
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="0 = no minimum"
              value={delivery.minOrder}
              onChange={(e) => setDelivery((d) => ({ ...d, minOrder: e.target.value }))}
            />
          </FormField>
          <FormField label="Free delivery over ($)">
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="0 = never free"
              value={delivery.freeOver}
              onChange={(e) => setDelivery((d) => ({ ...d, freeOver: e.target.value }))}
            />
          </FormField>
        </div>

        <div className="mb-2 mt-2 flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted">Delivery zones</div>
          <button type="button" onClick={addZone} className="flex items-center gap-1 text-xs text-gold hover:underline">
            <Plus className="h-3.5 w-3.5" /> Add zone
          </button>
        </div>
        <p className="mb-3 text-xs text-muted">
          List postcodes separated by commas. Use ranges like <code>3800-3810</code>, or <code>*</code> for
          &ldquo;everywhere else&rdquo;. The first matching zone wins, so keep <code>*</code> last.
        </p>

        <div className="space-y-2">
          {zones.length === 0 && <div className="text-xs text-muted">No zones yet — add one to enable delivery.</div>}
          {zones.map((z) => (
            <div key={z.id} className="rounded-card border border-line p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                <Input placeholder="Zone name (e.g. Local)" value={z.name} onChange={(e) => setZone(z.id, { name: e.target.value })} />
                <button
                  type="button"
                  onClick={() => removeZone(z.id)}
                  aria-label="Remove zone"
                  className="flex items-center justify-center rounded-[9px] border border-line px-3 text-muted transition-colors hover:border-red-400 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2">
                <Input placeholder="Postcodes: 3977, 3975, 3800-3810, *" value={z.postcodes} onChange={(e) => setZone(z.id, { postcodes: e.target.value })} />
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input type="number" min={0} step="0.01" placeholder="Fee ($)" value={z.fee} onChange={(e) => setZone(z.id, { fee: e.target.value })} />
                <Input placeholder="ETA (e.g. 1–2 business days)" value={z.eta} onChange={(e) => setZone(z.id, { eta: e.target.value })} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button type="button" variant="gold" loading={pending} onClick={submit} className="mt-5">
        Save Changes
      </Button>
    </Panel>
  );
}
