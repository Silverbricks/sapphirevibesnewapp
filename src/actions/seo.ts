"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth-helpers";

export async function createRedirect(formData: FormData) {
  const staff = await requireStaff();
  let from = (formData.get("from") as string)?.trim();
  const to = (formData.get("to") as string)?.trim();
  if (!from || !to) return { error: "Both source and destination are required." };
  if (!from.startsWith("/")) from = "/" + from;
  const permanent = formData.get("permanent") !== "false";
  await db.redirect.upsert({
    where: { from },
    create: { from, to, permanent },
    update: { to, permanent },
  });
  await db.auditLog.create({ data: { actorName: staff.name, action: "Saved redirect", targetType: "Redirect", meta: { from, to } } });
  revalidatePath("/admin/seo");
  return { ok: true as const };
}

export async function deleteRedirect(id: string) {
  await requireStaff();
  await db.redirect.delete({ where: { id } });
  revalidatePath("/admin/seo");
}
