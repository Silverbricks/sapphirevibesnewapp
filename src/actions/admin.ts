"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireStaff, requireRole } from "@/lib/auth-helpers";
import { slugify } from "@/lib/utils";
import { saveUploadedImage } from "@/lib/upload";
import { Role, Prisma } from "@prisma/client";
import type {
  ProductBadge,
  ProductStatus,
  OrderStatus,
  ReviewStatus,
  CouponType,
  CollectionType,
} from "@prisma/client";

function toCents(v: FormDataEntryValue | null): number {
  return Math.round(parseFloat((v as string) || "0") * 100) || 0;
}
function toInt(v: FormDataEntryValue | null, fallback = 0): number {
  return parseInt((v as string) || String(fallback), 10) || fallback;
}

export async function saveProduct(formData: FormData) {
  const staff = await requireStaff();
  const id = (formData.get("id") as string) || "";
  const name = (formData.get("name") as string)?.trim();
  const categoryId = formData.get("categoryId") as string;
  if (!name || !categoryId) return;

  const data = {
    name,
    sku: (formData.get("sku") as string)?.trim() || `SKU-${Date.now()}`,
    description: (formData.get("description") as string) || null,
    priceCents: toCents(formData.get("price")),
    compareCents: formData.get("compare") ? toCents(formData.get("compare")) : null,
    costCents: formData.get("cost") ? toCents(formData.get("cost")) : null,
    stock: toInt(formData.get("stock")),
    minStockLevel: toInt(formData.get("minStock"), 5),
    maxStock: toInt(formData.get("maxStock"), 100),
    status: ((formData.get("status") as string) || "ACTIVE") as ProductStatus,
    badges: formData.getAll("badges").map(String) as ProductBadge[],
    material: (formData.get("material") as string) || null,
    colour: (formData.get("colour") as string) || null,
    style: (formData.get("style") as string) || null,
    room: (formData.get("room") as string) || null,
    dimensions: (formData.get("dimensions") as string) || null,
    careInstructions: (formData.get("careInstructions") as string) || null,
    seoTitle: (formData.get("seoTitle") as string) || null,
    seoDescription: (formData.get("seoDescription") as string) || null,
    videoUrl: (formData.get("videoUrl") as string)?.trim() || null,
    categoryId,
    brandId: (formData.get("brandId") as string) || null,
  };
  // Image: prefer an uploaded file, else a pasted URL.
  const uploaded = await saveUploadedImage(formData.get("imageFile") as File | null);
  const imageUrl = uploaded || (formData.get("imageUrl") as string)?.trim();

  if (id) {
    await db.product.update({ where: { id }, data });
    if (imageUrl) {
      await db.productImage.deleteMany({ where: { productId: id, isFeatured: true } });
      await db.productImage.create({ data: { productId: id, url: imageUrl, isFeatured: true, position: 0 } });
    }
    await db.auditLog.create({ data: { actorName: staff.name, action: "Updated product", targetType: "Product", targetId: id, meta: { name } } });
  } else {
    const created = await db.product.create({
      data: {
        ...data,
        slug: `${slugify(name)}-${Math.floor(Math.random() * 9000 + 1000)}`,
        images: imageUrl ? { create: { url: imageUrl, isFeatured: true } } : undefined,
      },
    });
    await db.auditLog.create({ data: { actorName: staff.name, action: "Created product", targetType: "Product", targetId: created.id, meta: { name } } });
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
  const staff = await requireStaff();
  await db.product.delete({ where: { id } });
  await db.auditLog.create({ data: { actorName: staff.name, action: "Deleted product", targetType: "Product", targetId: id } });
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
}

export async function createCategory(formData: FormData) {
  const staff = await requireStaff();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;
  await db.category.create({
    data: {
      name,
      slug: `${slugify(name)}-${Math.floor(100 + Math.random() * 900)}`,
      parentId: (formData.get("parentId") as string) || null,
      description: (formData.get("description") as string) || null,
    },
  });
  await db.auditLog.create({ data: { actorName: staff.name, action: "Created category", targetType: "Category", meta: { name } } });
  revalidatePath("/admin/categories");
}

export async function createCollection(formData: FormData) {
  const staff = await requireStaff();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;
  await db.collection.create({
    data: {
      name,
      slug: `${slugify(name)}-${Math.floor(100 + Math.random() * 900)}`,
      type: ((formData.get("type") as string) || "MANUAL") as CollectionType,
      isFeatured: formData.get("isFeatured") === "on",
      description: (formData.get("description") as string) || null,
    },
  });
  await db.auditLog.create({ data: { actorName: staff.name, action: "Created collection", targetType: "Collection", meta: { name } } });
  revalidatePath("/admin/collections");
  revalidatePath("/collections");
}

export async function createCoupon(formData: FormData) {
  const staff = await requireStaff();
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const type = (formData.get("type") as string) as CouponType;
  if (!code || !type) return;
  const value = parseFloat((formData.get("value") as string) || "0") || 0;
  await db.coupon.create({
    data: {
      code,
      type,
      percent: type === "PERCENT" ? Math.round(value) : null,
      valueCents: type === "FIXED" ? Math.round(value * 100) : null,
      description: (formData.get("description") as string) || null,
    },
  });
  await db.auditLog.create({ data: { actorName: staff.name, action: "Created coupon", targetType: "Coupon", meta: { code } } });
  revalidatePath("/growth/coupons");
}

export async function updateOrderStatus(orderId: string, status: string) {
  const staff = await requireStaff();
  const order = await db.order.update({
    where: { id: orderId },
    data: { status: status as OrderStatus },
  });
  await db.auditLog.create({ data: { actorName: staff.name, action: "Updated order status", targetType: "Order", targetId: order.number, meta: { status } } });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.number}`);
  return { ok: true as const };
}

export async function addHeroSlide(formData: FormData) {
  const staff = await requireStaff();
  const uploaded = await saveUploadedImage(formData.get("imageFile") as File | null);
  const image = uploaded || (formData.get("imageUrl") as string)?.trim();
  if (!image) return;
  const slide = {
    image,
    eyebrow: (formData.get("eyebrow") as string)?.trim() || null,
    title: (formData.get("title") as string)?.trim() || "",
    subtitle: (formData.get("subtitle") as string)?.trim() || null,
    ctaLabel: (formData.get("ctaLabel") as string)?.trim() || null,
    ctaHref: (formData.get("ctaHref") as string)?.trim() || null,
  };
  const block = await db.homepageBlock.findUnique({ where: { key: "hero" } });
  const config = (block?.config as { slides?: unknown[] } | null) ?? {};
  const slides = Array.isArray(config.slides) ? config.slides : [];
  slides.push(slide);
  await db.homepageBlock.update({ where: { key: "hero" }, data: { config: { ...config, slides } as Prisma.InputJsonValue } });
  await db.auditLog.create({ data: { actorName: staff.name, action: "Added hero slide", targetType: "HomepageBlock" } });
  revalidatePath("/admin/homepage/hero");
  revalidatePath("/");
}

export async function removeHeroSlide(index: number) {
  await requireStaff();
  const block = await db.homepageBlock.findUnique({ where: { key: "hero" } });
  const config = (block?.config as { slides?: unknown[] } | null) ?? {};
  const slides = Array.isArray(config.slides) ? config.slides : [];
  if (index >= 0 && index < slides.length) slides.splice(index, 1);
  await db.homepageBlock.update({ where: { key: "hero" }, data: { config: { ...config, slides } as Prisma.InputJsonValue } });
  revalidatePath("/admin/homepage/hero");
  revalidatePath("/");
}

export async function savePromoBanner(formData: FormData) {
  const staff = await requireStaff();
  const block = await db.homepageBlock.findUnique({ where: { key: "promo" } });
  const config = (block?.config as Record<string, unknown> | null) ?? {};
  const uploaded = await saveUploadedImage(formData.get("imageFile") as File | null);
  const image = uploaded || (formData.get("imageUrl") as string)?.trim() || (config.image as string) || null;
  const banner = {
    image,
    eyebrow: (formData.get("eyebrow") as string)?.trim() || null,
    heading: (formData.get("heading") as string)?.trim() || "",
    desc: (formData.get("desc") as string)?.trim() || null,
    ctaLabel: (formData.get("ctaLabel") as string)?.trim() || null,
    ctaHref: (formData.get("ctaHref") as string)?.trim() || null,
  };
  await db.homepageBlock.update({
    where: { key: "promo" },
    data: { config: { ...config, ...banner } as Prisma.InputJsonValue },
  });
  await db.auditLog.create({ data: { actorName: staff.name, action: "Updated promo banner", targetType: "HomepageBlock" } });
  revalidatePath("/admin/homepage/promo");
  revalidatePath("/");
  return { ok: true as const };
}

export async function saveAnnouncement(formData: FormData) {
  const staff = await requireStaff();
  const value = {
    text: (formData.get("text") as string)?.trim() || "",
    ctaHref: (formData.get("ctaHref") as string)?.trim() || null,
    enabled: formData.get("enabled") === "on",
  };
  await db.setting.upsert({
    where: { key: "announcement" },
    create: { key: "announcement", value },
    update: { value },
  });
  await db.auditLog.create({ data: { actorName: staff.name, action: "Updated announcement bar", targetType: "Setting" } });
  revalidatePath("/admin/homepage");
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function toggleHomepageBlock(id: string, isVisible: boolean) {
  await requireStaff();
  await db.homepageBlock.update({ where: { id }, data: { isVisible } });
  revalidatePath("/admin/homepage");
  revalidatePath("/");
  return { ok: true as const };
}

export async function reorderHomepageBlock(id: string, direction: "up" | "down") {
  await requireStaff();
  const blocks = await db.homepageBlock.findMany({ orderBy: { position: "asc" } });
  const idx = blocks.findIndex((b) => b.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= blocks.length) return;
  await db.$transaction([
    db.homepageBlock.update({ where: { id: blocks[idx].id }, data: { position: blocks[swapIdx].position } }),
    db.homepageBlock.update({ where: { id: blocks[swapIdx].id }, data: { position: blocks[idx].position } }),
  ]);
  revalidatePath("/admin/homepage");
  revalidatePath("/");
}

export type StaffState = { error?: string; ok?: boolean } | undefined;

/** Create or update a staff member (super-admin only). */
export async function saveStaffMember(_prev: StaffState, formData: FormData): Promise<StaffState> {
  const actor = await requireRole(Role.SUPER_ADMIN);
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const name = (formData.get("name") as string)?.trim() || "Staff";
  const role = formData.get("role") as Role;
  const password = formData.get("password") as string;
  if (!email || !role) return { error: "Email and role are required." };

  const existing = await db.user.findUnique({ where: { email } });
  const hash = password && password.length >= 6 ? await bcrypt.hash(password, 10) : undefined;
  if (!existing && !hash) return { error: "Set a password (min 6 chars) for a new member." };

  await db.user.upsert({
    where: { email },
    update: { name, role, ...(hash ? { passwordHash: hash } : {}) },
    create: {
      email, name, role, passwordHash: hash!,
      referralCode: `STAFF${Math.floor(1000 + Math.random() * 9000)}`,
    },
  });
  await db.auditLog.create({ data: { actorName: actor.name, action: existing ? "Updated staff member" : "Invited staff member", targetType: "User", meta: { email, role } } });
  revalidatePath("/admin/team");
  return { ok: true };
}

export async function updateStaffRole(userId: string, role: string) {
  const actor = await requireRole(Role.SUPER_ADMIN);
  await db.user.update({ where: { id: userId }, data: { role: role as Role } });
  await db.auditLog.create({ data: { actorName: actor.name, action: "Changed staff role", targetType: "User", targetId: userId, meta: { role } } });
  revalidatePath("/admin/team");
}

export async function setStaffSuspended(userId: string, suspended: boolean) {
  const actor = await requireRole(Role.SUPER_ADMIN);
  await db.user.update({ where: { id: userId }, data: { suspended } });
  await db.auditLog.create({ data: { actorName: actor.name, action: suspended ? "Suspended member" : "Reinstated member", targetType: "User", targetId: userId } });
  revalidatePath("/admin/team");
  return { ok: true as const };
}

export async function resetStaffPassword(userId: string, newPassword: string) {
  const actor = await requireRole(Role.SUPER_ADMIN);
  if (!newPassword || newPassword.length < 6) return { error: "Password must be at least 6 characters." };
  const hash = await bcrypt.hash(newPassword, 10);
  await db.user.update({ where: { id: userId }, data: { passwordHash: hash } });
  await db.auditLog.create({ data: { actorName: actor.name, action: "Reset member password", targetType: "User", targetId: userId } });
  revalidatePath("/admin/team");
  return { ok: true as const };
}

export async function setTwoFactor(userId: string, enabled: boolean) {
  const actor = await requireRole(Role.SUPER_ADMIN);
  await db.user.update({ where: { id: userId }, data: { twoFactorEnabled: enabled } });
  await db.auditLog.create({ data: { actorName: actor.name, action: enabled ? "Enabled 2FA" : "Disabled 2FA", targetType: "User", targetId: userId } });
  revalidatePath("/admin/team");
  return { ok: true as const };
}

export async function updateStaffPermissions(userId: string, modules: string[]) {
  const actor = await requireRole(Role.SUPER_ADMIN);
  await db.user.update({
    where: { id: userId },
    data: { permissions: modules as unknown as Prisma.InputJsonValue },
  });
  await db.auditLog.create({ data: { actorName: actor.name, action: "Updated member permissions", targetType: "User", targetId: userId, meta: { modules } } });
  revalidatePath("/admin/team");
  return { ok: true as const };
}

export async function moderateReview(id: string, status: string) {
  const staff = await requireStaff();
  await db.review.update({ where: { id }, data: { status: status as ReviewStatus } });
  await db.auditLog.create({ data: { actorName: staff.name, action: "Moderated review", targetType: "Review", targetId: id, meta: { status } } });
  revalidatePath("/admin/reviews");
  return { ok: true as const };
}
