"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth-helpers";
import { slugify } from "@/lib/utils";
import { saveUploadedImage } from "@/lib/upload";
import type {
  ProductBadge,
  ProductStatus,
  OrderStatus,
  ReviewStatus,
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

export async function moderateReview(id: string, status: string) {
  const staff = await requireStaff();
  await db.review.update({ where: { id }, data: { status: status as ReviewStatus } });
  await db.auditLog.create({ data: { actorName: staff.name, action: "Moderated review", targetType: "Review", targetId: id, meta: { status } } });
  revalidatePath("/admin/reviews");
  return { ok: true as const };
}
