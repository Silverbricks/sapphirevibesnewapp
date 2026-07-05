"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth-helpers";
import { saveUploadedImage } from "@/lib/upload";
import { PAYMENT_METHODS_CATALOGUE } from "@/lib/constants";
import type { FulfilmentSettings, PaymentSettings, DeliveryZone } from "@/lib/fulfilment";

function str(fd: FormData, key: string): string {
  return (fd.get(key) as string)?.trim() || "";
}

async function upsertSetting(key: string, value: object) {
  await db.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

async function logSetting(actorName: string | null | undefined, section: string) {
  await db.auditLog.create({
    data: { actorName, action: `Updated ${section} settings`, targetType: "Setting", meta: { section } },
  });
}

export async function saveStoreSettings(formData: FormData) {
  const staff = await requireStaff();
  await upsertSetting("store", {
    name: str(formData, "name") || "Sapphire Vibes",
    tagline: str(formData, "tagline"),
    description: str(formData, "description"),
    email: str(formData, "email"),
    phone: str(formData, "phone"),
    address: str(formData, "address"),
    abn: str(formData, "abn"),
    country: str(formData, "country"),
    currency: str(formData, "currency") || "USD",
  });
  await logSetting(staff.name, "store");
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function saveBrandingSettings(formData: FormData) {
  const staff = await requireStaff();
  const existing = (await db.setting.findUnique({ where: { key: "branding" } }))?.value as
    | { logoUrl?: string | null; faviconUrl?: string | null }
    | null;
  const logo = await saveUploadedImage(formData.get("logoFile") as File | null);
  const favicon = await saveUploadedImage(formData.get("faviconFile") as File | null);
  await upsertSetting("branding", {
    logoUrl: logo || str(formData, "logoUrl") || existing?.logoUrl || null,
    faviconUrl: favicon || str(formData, "faviconUrl") || existing?.faviconUrl || null,
  });
  await logSetting(staff.name, "branding");
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function saveSocialSettings(formData: FormData) {
  const staff = await requireStaff();
  await upsertSetting("social", {
    instagram: str(formData, "instagram"),
    facebook: str(formData, "facebook"),
    pinterest: str(formData, "pinterest"),
    tiktok: str(formData, "tiktok"),
    youtube: str(formData, "youtube"),
  });
  await logSetting(staff.name, "social");
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function saveTaxSettings(formData: FormData) {
  const staff = await requireStaff();
  const ratePct = parseFloat(str(formData, "gstRate").replace("%", "")) || 0;
  await upsertSetting("tax", {
    gstRate: ratePct > 1 ? ratePct / 100 : ratePct,
    display: str(formData, "display") || "Inclusive of GST",
    abn: str(formData, "abn"),
  });
  await logSetting(staff.name, "tax");
  revalidatePath("/admin/settings");
  return { ok: true as const };
}

export async function saveSeoSettings(formData: FormData) {
  const staff = await requireStaff();
  const ogFile = await saveUploadedImage(formData.get("ogFile") as File | null);
  const existing = (await db.setting.findUnique({ where: { key: "seo" } }))?.value as { ogImage?: string | null } | null;
  await upsertSetting("seo", {
    defaultTitle: str(formData, "defaultTitle") || "Sapphire Vibes",
    titleTemplate: str(formData, "titleTemplate") || "%s · Sapphire Vibes",
    defaultDescription: str(formData, "defaultDescription"),
    keywords: str(formData, "keywords"),
    ogImage: ogFile || str(formData, "ogImage") || existing?.ogImage || null,
  });
  await logSetting(staff.name, "seo");
  revalidatePath("/", "layout");
  revalidatePath("/admin/seo");
  return { ok: true as const };
}

export async function saveSystemSettings(formData: FormData) {
  const staff = await requireStaff();
  await upsertSetting("system", {
    maintenance: formData.get("maintenance") === "on",
    maintenanceMessage: str(formData, "maintenanceMessage") || "We’ll be back shortly.",
  });
  await logSetting(staff.name, "system");
  revalidatePath("/admin/settings");
  return { ok: true as const };
}

export async function saveIntegration(id: string, formData: FormData) {
  const staff = await requireStaff();
  const status = (str(formData, "status") || "SETUP") as "CONNECTED" | "SETUP" | "DISCONNECTED";
  const config = {
    apiKey: str(formData, "apiKey"),
    webhookUrl: str(formData, "webhookUrl"),
  };
  await db.integration.update({ where: { id }, data: { status, config } });
  await db.auditLog.create({ data: { actorName: staff.name, action: "Updated integration", targetType: "Integration", targetId: id } });
  revalidatePath("/admin/settings");
  return { ok: true as const };
}

export async function saveShippingSettings(formData: FormData) {
  const staff = await requireStaff();
  await upsertSetting("shipping", {
    freeOver250: formData.get("freeOver250") === "on",
    express: formData.get("express") === "on",
    clickCollect: formData.get("clickCollect") === "on",
    localDelivery: formData.get("localDelivery") === "on",
  });
  await logSetting(staff.name, "shipping");
  revalidatePath("/admin/settings");
  return { ok: true as const };
}

const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === "number" ? v : parseInt(String(v ?? "").replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : fallback;
};
const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || Math.random().toString(36).slice(2, 8);

/** Delivery / pickup fulfilment. Client submits `payload` = JSON.stringify(FulfilmentSettings). */
export async function saveFulfilmentSettings(formData: FormData) {
  const staff = await requireStaff();
  let raw: Partial<FulfilmentSettings> = {};
  try {
    raw = JSON.parse(str(formData, "payload") || "{}");
  } catch {
    return { ok: false as const };
  }

  const orderType: FulfilmentSettings["orderType"] =
    raw.orderType === "pickup" || raw.orderType === "delivery" ? raw.orderType : "both";

  const zones: DeliveryZone[] = Array.isArray(raw.delivery?.zones)
    ? raw.delivery!.zones
        .filter((z) => z && (String(z.name).trim() || String(z.postcodes).trim()))
        .map((z) => ({
          id: String(z.id || slug(String(z.name || "zone"))),
          name: String(z.name || "").trim() || "Zone",
          postcodes: String(z.postcodes || "").trim(),
          feeCents: Math.max(0, num(z.feeCents)),
          eta: String(z.eta || "").trim(),
        }))
    : [];

  const value: FulfilmentSettings = {
    orderType,
    pickup: {
      enabled: !!raw.pickup?.enabled,
      address: String(raw.pickup?.address || "").trim(),
      instructions: String(raw.pickup?.instructions || "").trim(),
      prepTimeMinutes: Math.max(0, num(raw.pickup?.prepTimeMinutes)),
      schedule: String(raw.pickup?.schedule || "").trim(),
    },
    delivery: {
      enabled: !!raw.delivery?.enabled,
      minOrderCents: Math.max(0, num(raw.delivery?.minOrderCents)),
      freeOverCents: Math.max(0, num(raw.delivery?.freeOverCents)),
      zones,
    },
  };

  await upsertSetting("fulfilment", value);
  await logSetting(staff.name, "fulfilment");
  revalidatePath("/admin/settings");
  revalidatePath("/checkout");
  return { ok: true as const };
}

/** Payment method enable/disable. Client submits `payload` = JSON.stringify({ methods }). */
export async function savePaymentSettings(formData: FormData) {
  const staff = await requireStaff();
  let raw: Partial<PaymentSettings> = {};
  try {
    raw = JSON.parse(str(formData, "payload") || "{}");
  } catch {
    return { ok: false as const };
  }
  const saved = raw.methods ?? {};
  const methods: Record<string, boolean> = {};
  for (const m of PAYMENT_METHODS_CATALOGUE) methods[m.key] = !!saved[m.key];

  await upsertSetting("payments", { methods });
  await logSetting(staff.name, "payments");
  revalidatePath("/admin/settings");
  revalidatePath("/checkout");
  return { ok: true as const };
}
