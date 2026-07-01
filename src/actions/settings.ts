"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth-helpers";
import { saveUploadedImage } from "@/lib/upload";

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
