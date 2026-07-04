"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth-helpers";
import { saveUploadedImage } from "@/lib/upload";

const str = (fd: FormData, k: string) => (fd.get(k) as string)?.trim() || "";
const int = (fd: FormData, k: string) => parseInt(str(fd, k), 10) || 0;
const csv = (fd: FormData, k: string) => str(fd, k).split(",").map((t) => t.trim()).filter(Boolean);

async function revalProduct(productId: string) {
  const p = await db.product.findUnique({ where: { id: productId }, select: { slug: true } });
  revalidatePath(`/admin/products/${productId}`);
  if (p?.slug) revalidatePath(`/products/${p.slug}`);
}

function metaFromForm(fd: FormData) {
  return {
    alt: str(fd, "alt") || null,
    title: str(fd, "title") || null,
    caption: str(fd, "caption") || null,
    description: str(fd, "description") || null,
    tags: csv(fd, "tags"),
    kind: str(fd, "kind") || null,
  };
}

/** Add an image (client sends an already-optimised WebP file + computed metadata). */
export async function addProductImage(formData: FormData) {
  const staff = await requireStaff();
  const productId = str(formData, "productId");
  if (!productId) return { error: "Missing product." };
  const url = await saveUploadedImage(formData.get("imageFile") as File | null);
  if (!url) return { error: "Upload failed — check the file type/size." };

  const count = await db.productImage.count({ where: { productId } });
  await db.productImage.create({
    data: {
      productId,
      url,
      ...metaFromForm(formData),
      width: int(formData, "width") || null,
      height: int(formData, "height") || null,
      bytes: int(formData, "bytes"),
      dominantColor: str(formData, "dominantColor") || null,
      position: count,
      isFeatured: count === 0,
    },
  });
  await db.auditLog.create({ data: { actorName: staff.name, action: "Added product image", targetType: "Product", targetId: productId } });
  await revalProduct(productId);
  return { ok: true as const };
}

/** Add by pasting a remote URL (stored as-is, not re-hosted). */
export async function addProductImageFromUrl(productId: string, url: string) {
  await requireStaff();
  const clean = url.trim();
  if (!productId || !/^https?:\/\//.test(clean)) return { error: "Enter a valid image URL." };
  const count = await db.productImage.count({ where: { productId } });
  await db.productImage.create({ data: { productId, url: clean, position: count, isFeatured: count === 0 } });
  await revalProduct(productId);
  return { ok: true as const };
}

export async function updateProductImage(id: string, formData: FormData) {
  await requireStaff();
  const img = await db.productImage.update({ where: { id }, data: metaFromForm(formData) });
  await revalProduct(img.productId);
  return { ok: true as const };
}

/** Replace the underlying file (used by "Replace" and the in-browser editor's export). */
export async function replaceProductImage(id: string, formData: FormData) {
  await requireStaff();
  const url = await saveUploadedImage(formData.get("imageFile") as File | null);
  if (!url) return { error: "Upload failed." };
  const img = await db.productImage.update({
    where: { id },
    data: {
      url,
      width: int(formData, "width") || null,
      height: int(formData, "height") || null,
      bytes: int(formData, "bytes"),
      dominantColor: str(formData, "dominantColor") || undefined,
    },
  });
  await revalProduct(img.productId);
  return { ok: true as const };
}

export async function deleteProductImage(id: string) {
  await requireStaff();
  const img = await db.productImage.findUnique({ where: { id } });
  if (!img) return { error: "Not found." };
  await db.productImage.delete({ where: { id } });
  if (img.isFeatured) {
    const next = await db.productImage.findFirst({ where: { productId: img.productId }, orderBy: { position: "asc" } });
    if (next) await db.productImage.update({ where: { id: next.id }, data: { isFeatured: true } });
  }
  await revalProduct(img.productId);
  return { ok: true as const };
}

export async function duplicateProductImage(id: string) {
  await requireStaff();
  const img = await db.productImage.findUnique({ where: { id } });
  if (!img) return { error: "Not found." };
  const count = await db.productImage.count({ where: { productId: img.productId } });
  await db.productImage.create({
    data: {
      productId: img.productId, url: img.url, originalUrl: img.originalUrl, alt: img.alt, title: img.title,
      caption: img.caption, description: img.description, tags: img.tags, kind: img.kind,
      width: img.width, height: img.height, bytes: img.bytes, dominantColor: img.dominantColor,
      position: count, isFeatured: false,
    },
  });
  await revalProduct(img.productId);
  return { ok: true as const };
}

export async function setFeaturedImage(id: string) {
  await requireStaff();
  const img = await db.productImage.findUnique({ where: { id } });
  if (!img) return { error: "Not found." };
  await db.$transaction([
    db.productImage.updateMany({ where: { productId: img.productId }, data: { isFeatured: false } }),
    db.productImage.update({ where: { id }, data: { isFeatured: true } }),
  ]);
  await revalProduct(img.productId);
  return { ok: true as const };
}

export async function reorderProductImages(productId: string, ids: string[]) {
  await requireStaff();
  await db.$transaction(ids.map((id, i) => db.productImage.update({ where: { id }, data: { position: i } })));
  await revalProduct(productId);
  return { ok: true as const };
}
