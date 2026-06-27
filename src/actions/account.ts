"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const name = (formData.get("name") as string | null)?.trim();
  const phone = (formData.get("phone") as string | null)?.trim();
  await db.user.update({
    where: { id: user.id },
    data: { name: name || undefined, phone: phone || null },
  });
  revalidatePath("/account/settings");
  return { ok: true as const };
}

export interface NotifyPrefs {
  orderUpdates: boolean;
  newCollections: boolean;
  salesOffers: boolean;
  styling: boolean;
}

export async function updateNotifications(prefs: NotifyPrefs) {
  const user = await requireUser();
  await db.user.update({
    where: { id: user.id },
    data: {
      notifyOrderUpdates: prefs.orderUpdates,
      notifyNewCollections: prefs.newCollections,
      notifySalesOffers: prefs.salesOffers,
      notifyStyling: prefs.styling,
    },
  });
  revalidatePath("/account/settings");
  return { ok: true as const };
}

export async function addAddress(formData: FormData) {
  const user = await requireUser();
  const data = {
    label: (formData.get("label") as string) || "Home",
    fullName: (formData.get("fullName") as string) || user.name || "",
    line1: (formData.get("line1") as string) || "",
    line2: (formData.get("line2") as string) || null,
    city: (formData.get("city") as string) || "",
    region: (formData.get("region") as string) || "",
    postalCode: (formData.get("postalCode") as string) || "",
    country: (formData.get("country") as string) || "Australia",
    phone: (formData.get("phone") as string) || null,
  };
  const count = await db.address.count({ where: { userId: user.id } });
  await db.address.create({
    data: { ...data, userId: user.id, isDefault: count === 0 },
  });
  revalidatePath("/account/addresses");
  return { ok: true as const };
}

export async function deleteAddress(id: string) {
  const user = await requireUser();
  await db.address.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/account/addresses");
}

export async function setDefaultAddress(id: string) {
  const user = await requireUser();
  await db.$transaction([
    db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    db.address.updateMany({ where: { id, userId: user.id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/account/addresses");
}

export async function removeWishlistItem(productId: string) {
  const user = await requireUser();
  await db.wishlistItem.deleteMany({ where: { userId: user.id, productId } });
  revalidatePath("/account/wishlist");
}
