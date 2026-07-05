/**
 * Pure fulfilment helpers — postcode/zone matching, delivery fee, payment gating.
 * NO "use client" and NO server-only imports: safe to import from both the checkout
 * client component and the `placeOrder` server action.
 */

export interface DeliveryZone {
  id: string; // stable slug, e.g. "local"
  name: string; // "Local", "SE Melbourne", "Rest of Metro"
  postcodes: string; // "3977, 3975, 3800-3810, *"  (comma/space list; ranges with '-'; '*' = catch-all)
  feeCents: number;
  eta: string; // "Same day", "1–2 business days"
}

export interface FulfilmentSettings {
  orderType: "pickup" | "delivery" | "both";
  pickup: {
    enabled: boolean;
    address: string;
    instructions: string;
    prepTimeMinutes: number;
    schedule: string;
  };
  delivery: {
    enabled: boolean;
    minOrderCents: number;
    freeOverCents: number; // 0 = no free-delivery threshold
    zones: DeliveryZone[];
  };
}

export interface PaymentSettings {
  methods: Record<string, boolean>; // keyed by PAYMENT_METHODS_CATALOGUE[].key
}

export type FulfilmentType = "pickup" | "delivery";

/** Does postcode `pc` fall inside a zone's postcode list? Supports exact, `NNNN-NNNN` ranges and `*`. */
export function postcodeInList(pc: string, list: string): boolean {
  const target = (pc || "").trim();
  if (!target) return false;
  const tokens = (list || "").split(/[\s,]+/).map((t) => t.trim()).filter(Boolean);
  for (const tok of tokens) {
    if (tok === "*") return true;
    const range = tok.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const n = Number(target);
      const lo = Number(range[1]);
      const hi = Number(range[2]);
      if (!Number.isNaN(n) && n >= Math.min(lo, hi) && n <= Math.max(lo, hi)) return true;
    } else if (tok.toLowerCase() === target.toLowerCase()) {
      return true;
    }
  }
  return false;
}

/** First zone whose postcode list matches, else null. */
export function resolveDeliveryZone(pc: string, zones: DeliveryZone[]): DeliveryZone | null {
  for (const z of zones ?? []) if (postcodeInList(pc, z.postcodes)) return z;
  return null;
}

/** Fee for a matched zone, applying the free-delivery threshold. */
export function deliveryFeeCents(
  subtotalCents: number,
  zone: DeliveryZone,
  delivery: FulfilmentSettings["delivery"],
): number {
  if (delivery.freeOverCents > 0 && subtotalCents >= delivery.freeOverCents) return 0;
  return Math.max(0, zone.feeCents);
}

export interface DeliveryQuote {
  available: boolean;
  zone: DeliveryZone | null;
  feeCents: number;
  belowMinimum: boolean;
  reason: string | null; // set when !available
}

/** One-stop quote used identically on the client (live preview) and server (authoritative). */
export function quoteDelivery(
  pc: string,
  subtotalCents: number,
  delivery: FulfilmentSettings["delivery"],
): DeliveryQuote {
  const zone = resolveDeliveryZone(pc, delivery.zones);
  if (!zone) {
    return {
      available: false,
      zone: null,
      feeCents: 0,
      belowMinimum: false,
      reason: pc ? "We don't deliver to this postcode yet — please choose Pickup." : null,
    };
  }
  const belowMinimum = delivery.minOrderCents > 0 && subtotalCents < delivery.minOrderCents;
  return {
    available: !belowMinimum,
    zone,
    feeCents: deliveryFeeCents(subtotalCents, zone, delivery),
    belowMinimum,
    reason: belowMinimum ? "Order is below the minimum for delivery." : null,
  };
}

/** Ordered list of enabled payment method keys. */
export function enabledPaymentKeys(payments: PaymentSettings): string[] {
  return Object.entries(payments.methods)
    .filter(([, on]) => on)
    .map(([k]) => k);
}

/** Whether a chosen fulfilment type is offered given the settings. */
export function fulfilmentAllows(f: FulfilmentSettings, type: FulfilmentType): boolean {
  if (type === "pickup") return f.orderType !== "delivery" && f.pickup.enabled;
  return f.orderType !== "pickup" && f.delivery.enabled;
}
