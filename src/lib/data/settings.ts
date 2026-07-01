import { db } from "@/lib/db";
import { SITE } from "@/lib/constants";

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
