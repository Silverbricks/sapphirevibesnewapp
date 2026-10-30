import { db } from "@/lib/db";
import { SITE, PAYMENT_METHODS_CATALOGUE } from "@/lib/constants";
import type { FulfilmentSettings, PaymentSettings } from "@/lib/fulfilment";

export type { FulfilmentSettings, PaymentSettings, DeliveryZone } from "@/lib/fulfilment";

export interface StoreSettings {
  name: string;
  tagline: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  abn: string;
  country: string;
  currency: string;
}

export interface SocialSettings {
  instagram: string;
  facebook: string;
  pinterest: string;
  tiktok: string;
  youtube: string;
}

export interface BrandingSettings {
  logoUrl: string | null;
  faviconUrl: string | null;
}

export interface TaxSettings {
  gstRate: number;
  display: string;
  abn: string;
}

export interface ShippingSettings {
  freeOver250: boolean;
  express: boolean;
  clickCollect: boolean;
  localDelivery: boolean;
}

const STORE_DEFAULTS: StoreSettings = {
  name: SITE.name,
  tagline: SITE.tagline,
  description: SITE.description,
  email: "hello@sapphirevibes.com",
  phone: "",
  address: "",
  abn: SITE.abn,
  country: SITE.country,
  currency: "USD",
};

const SOCIAL_DEFAULTS: SocialSettings = {
  instagram: "",
  facebook: "",
  pinterest: "",
  tiktok: "",
  youtube: "",
};

export interface SystemSettings {
  maintenance: boolean;
  maintenanceMessage: string;
}

const SYSTEM_DEFAULTS: SystemSettings = {
  maintenance: false,
  maintenanceMessage: "We’re making some improvements and will be back shortly.",
};

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const row = await db.setting.findUnique({ where: { key: "system" } });
    return { ...SYSTEM_DEFAULTS, ...((row?.value as Partial<SystemSettings> | null) ?? {}) };
  } catch {
    return SYSTEM_DEFAULTS;
  }
}

/** Delivery / pickup fulfilment configuration (owner-managed). */
const FULFILMENT_DEFAULTS: FulfilmentSettings = {
  orderType: "both",
  pickup: {
    enabled: true,
    address: "1 Laidlaw Lane, Cranbourne West, Victoria 3977, Australia",
    instructions: "Please head to the front counter and quote your order number.",
    prepTimeMinutes: 120,
    schedule: "Mon–Fri 9am–5pm · Sat 10am–2pm",
  },
  delivery: {
    enabled: true,
    minOrderCents: 0,
    freeOverCents: 15000, // free delivery over $150
    zones: [
      { id: "local", name: "Local (Cranbourne & surrounds)", postcodes: "3977, 3975, 3976, 3978, 3980", feeCents: 995, eta: "Same day – next day" },
      { id: "se-melbourne", name: "South-East Melbourne", postcodes: "3800-3810, 3170-3175, 3199, 3806", feeCents: 1495, eta: "1–2 business days" },
      { id: "metro", name: "Rest of Metro Melbourne", postcodes: "*", feeCents: 1995, eta: "2–3 business days" },
    ],
  },
};

/** Payment methods the store accepts, keyed by PAYMENT_METHODS_CATALOGUE. */
const PAYMENT_DEFAULTS: PaymentSettings = {
  methods: Object.fromEntries(PAYMENT_METHODS_CATALOGUE.map((m) => [m.key, m.defaultOn])),
};

/**
 * Configured GST/tax rate as a fraction (0.1 = 10%). Anything outside 0–1 (a rate
 * entered straight into the DB as "10", say) falls back to the default.
 */
export async function getTaxRate(): Promise<number> {
  try {
    const row = await db.setting.findUnique({ where: { key: "tax" } });
    const raw = (row?.value as Partial<TaxSettings> | null)?.gstRate;
    if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0 || raw >= 1) return TAX_DEFAULTS.gstRate;
    return raw;
  } catch {
    return TAX_DEFAULTS.gstRate;
  }
}

export async function getFulfilmentSettings(): Promise<FulfilmentSettings> {
  try {
    const row = await db.setting.findUnique({ where: { key: "fulfilment" } });
    const v = (row?.value as Partial<FulfilmentSettings> | null) ?? {};
    return {
      orderType: v.orderType ?? FULFILMENT_DEFAULTS.orderType,
      pickup: { ...FULFILMENT_DEFAULTS.pickup, ...(v.pickup ?? {}) },
      delivery: {
        ...FULFILMENT_DEFAULTS.delivery,
        ...(v.delivery ?? {}),
        zones: v.delivery?.zones ?? FULFILMENT_DEFAULTS.delivery.zones,
      },
    };
  } catch {
    return FULFILMENT_DEFAULTS;
  }
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  try {
    const row = await db.setting.findUnique({ where: { key: "payments" } });
    const saved = (row?.value as Partial<PaymentSettings> | null)?.methods ?? {};
    // Merge over defaults so newly-added catalogue methods appear with their default state.
    return { methods: { ...PAYMENT_DEFAULTS.methods, ...saved } };
  } catch {
    return PAYMENT_DEFAULTS;
  }
}

export interface SeoSettings {
  defaultTitle: string;
  titleTemplate: string;
  defaultDescription: string;
  keywords: string;
  ogImage: string | null;
}

const SEO_DEFAULTS: SeoSettings = {
  defaultTitle: `${SITE.name} — ${SITE.tagline}`,
  titleTemplate: `%s · ${SITE.name}`,
  defaultDescription: SITE.description,
  keywords: "luxury home décor, lighting, furniture, gifts",
  ogImage: null,
};

const BRANDING_DEFAULTS: BrandingSettings = { logoUrl: null, faviconUrl: null };
const TAX_DEFAULTS: TaxSettings = { gstRate: 0.1, display: "Inclusive of GST", abn: SITE.abn };
const SHIPPING_DEFAULTS: ShippingSettings = { freeOver250: true, express: true, clickCollect: false, localDelivery: true };

/** Canonical site base URL (no trailing slash) for sitemaps, OG tags and redirects. */
export function getBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    "https://sapphirevibes.com";
  return raw.replace(/\/$/, "");
}

/** Lightweight fetch of just SEO + branding (used by the root layout metadata). */
export async function getSeoSettings(): Promise<{ seo: SeoSettings; branding: BrandingSettings }> {
  try {
    const rows = await db.setting.findMany({ where: { key: { in: ["seo", "branding"] } } });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, Record<string, unknown>>;
    return {
      seo: { ...SEO_DEFAULTS, ...(map.seo ?? {}) },
      branding: { ...BRANDING_DEFAULTS, ...(map.branding ?? {}) },
    };
  } catch {
    return { seo: SEO_DEFAULTS, branding: BRANDING_DEFAULTS };
  }
}

/** Read a group of settings, merged over sensible defaults. Safe on DB outage. */
export async function getSiteSettings(): Promise<{
  store: StoreSettings;
  social: SocialSettings;
  branding: BrandingSettings;
  tax: TaxSettings;
  shipping: ShippingSettings;
}> {
  try {
    const rows = await db.setting.findMany({
      where: { key: { in: ["store", "social", "branding", "tax", "shipping"] } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, Record<string, unknown>>;
    return {
      store: { ...STORE_DEFAULTS, ...(map.store ?? {}) },
      social: { ...SOCIAL_DEFAULTS, ...(map.social ?? {}) },
      branding: { ...BRANDING_DEFAULTS, ...(map.branding ?? {}) },
      tax: { ...TAX_DEFAULTS, ...(map.tax ?? {}) },
      shipping: { ...SHIPPING_DEFAULTS, ...(map.shipping ?? {}) },
    };
  } catch {
    return {
      store: STORE_DEFAULTS,
      social: SOCIAL_DEFAULTS,
      branding: BRANDING_DEFAULTS,
      tax: TAX_DEFAULTS,
      shipping: SHIPPING_DEFAULTS,
    };
  }
}
