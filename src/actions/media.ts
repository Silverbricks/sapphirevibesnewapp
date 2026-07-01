"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth-helpers";
import { saveUploadedImage } from "@/lib/upload";
import { slugify } from "@/lib/utils";

/** Upload one or more images into the media library. */
export async function uploadMedia(formData: FormData) {
  const staff = await requireStaff();
  const folder = ((formData.get("folder") as string)?.trim() || "general").toLowerCase();
  const folderSlug = slugify(folder) || "general";
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const alt = (formData.get("alt") as string)?.trim() || null;

  let saved = 0;
  for (const file of files) {
    const url = await saveUploadedImage(file);
    if (!url) continue;
    await db.mediaAsset.create({
      data: { url, type: file.type, bytes: file.size, folder: folderSlug, alt },
    });
    saved += 1;
  }
  if (saved > 0) {
    await db.auditLog.create({ data: { actorName: staff.name, action: "Uploaded media", targetType: "MediaAsset", meta: { count: saved, folder: folderSlug } } });
  }
  revalidatePath("/admin/media");
  return { ok: true as const, saved };
}

export async function updateMedia(id: string, formData: FormData) {
  await requireStaff();
  await db.mediaAsset.update({
    where: { id },
    data: {
      alt: (formData.get("alt") as string)?.trim() || null,
      folder: ((formData.get("folder") as string)?.trim() || "general").toLowerCase(),
      tags: (formData.get("tags") as string)?.split(",").map((t) => t.trim()).filter(Boolean) ?? [],
    },
  });
  revalidatePath("/admin/media");
  return { ok: true as const };
}

export async function deleteMedia(id: string) {
  const staff = await requireStaff();
  await db.mediaAsset.delete({ where: { id } });
  await db.auditLog.create({ data: { actorName: staff.name, action: "Deleted media", targetType: "MediaAsset", targetId: id } });
  revalidatePath("/admin/media");
}
