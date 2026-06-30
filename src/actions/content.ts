"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth-helpers";
import { slugify } from "@/lib/utils";
import { saveUploadedImage } from "@/lib/upload";
import { Prisma } from "@prisma/client";
import type { ContentStatus } from "@prisma/client";
import type { BlogMeta } from "@/lib/cms";

function str(fd: FormData, key: string): string {
  return (fd.get(key) as string)?.trim() || "";
}
function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === "on";
}
/** Rough reading time from HTML body (~200 wpm). */
function readingTimeOf(html: string): number {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// ───────────────────────────── Blog posts ─────────────────────────────

export async function saveBlogPost(formData: FormData) {
  const staff = await requireStaff();
  const id = str(formData, "id");
  const title = str(formData, "title");
  const category = str(formData, "category") || "General";
  if (!title) return;

  const body = str(formData, "body");
  const status = (str(formData, "status") || "DRAFT") as ContentStatus;
  const scheduledAt = str(formData, "scheduledAt");

  const meta: BlogMeta = {
    author: str(formData, "author") || staff.name || "Sapphire Vibes",
    tags: str(formData, "tags").split(",").map((t) => t.trim()).filter(Boolean),
    featured: bool(formData, "featured"),
    pinned: bool(formData, "pinned"),
    allowComments: formData.get("allowComments") !== null ? bool(formData, "allowComments") : true,
    readingTime: readingTimeOf(body),
    scheduledAt: status === "SCHEDULED" && scheduledAt ? scheduledAt : null,
  };

  const uploaded = await saveUploadedImage(formData.get("coverFile") as File | null);
  const coverUrl = uploaded || str(formData, "coverUrl") || null;

  // publishedAt: now when publishing, the schedule date when scheduled, else keep/null
  let publishedAt: Date | null = null;
  if (status === "PUBLISHED") publishedAt = new Date();
  else if (status === "SCHEDULED" && scheduledAt) publishedAt = new Date(scheduledAt);

  const data = {
    title,
    category,
    excerpt: str(formData, "excerpt") || null,
    body,
    coverUrl,
    status,
    publishedAt,
    meta: meta as unknown as Prisma.InputJsonValue,
  };

  if (id) {
    await db.blogPost.update({ where: { id }, data });
    await db.auditLog.create({ data: { actorName: staff.name, action: "Updated blog post", targetType: "BlogPost", targetId: id, meta: { title } } });
  } else {
    const slug = `${slugify(title)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const created = await db.blogPost.create({ data: { ...data, slug } });
    await db.auditLog.create({ data: { actorName: staff.name, action: "Created blog post", targetType: "BlogPost", targetId: created.id, meta: { title } } });
  }

  revalidatePath("/admin/content/blog");
  revalidatePath("/blog");
  redirect("/admin/content/blog");
}

export async function deleteBlogPost(id: string) {
  const staff = await requireStaff();
  await db.blogPost.delete({ where: { id } });
  await db.auditLog.create({ data: { actorName: staff.name, action: "Deleted blog post", targetType: "BlogPost", targetId: id } });
  revalidatePath("/admin/content/blog");
  revalidatePath("/blog");
}

// ───────────────────────────── Static pages ─────────────────────────────

export async function savePage(formData: FormData) {
  const staff = await requireStaff();
  const id = str(formData, "id");
  const title = str(formData, "title");
  if (!title) return;
  const data = {
    title,
    body: str(formData, "body"),
    status: (str(formData, "status") || "PUBLISHED") as ContentStatus,
    seoTitle: str(formData, "seoTitle") || null,
    seoDesc: str(formData, "seoDesc") || null,
  };
  if (id) {
    await db.page.update({ where: { id }, data });
    await db.auditLog.create({ data: { actorName: staff.name, action: "Updated page", targetType: "Page", targetId: id, meta: { title } } });
  } else {
    const slug = str(formData, "slug") ? slugify(str(formData, "slug")) : slugify(title);
    const created = await db.page.create({ data: { ...data, slug } });
    await db.auditLog.create({ data: { actorName: staff.name, action: "Created page", targetType: "Page", targetId: created.id, meta: { title } } });
  }
  revalidatePath("/admin/content/pages");
  revalidatePath("/pages");
  redirect("/admin/content/pages");
}

export async function deletePage(id: string) {
  const staff = await requireStaff();
  await db.page.delete({ where: { id } });
  await db.auditLog.create({ data: { actorName: staff.name, action: "Deleted page", targetType: "Page", targetId: id } });
  revalidatePath("/admin/content/pages");
}

// ───────────────────────────── FAQs ─────────────────────────────

export async function saveFaq(formData: FormData) {
  const staff = await requireStaff();
  const id = str(formData, "id");
  const question = str(formData, "question");
  if (!question) return;
  const data = {
    question,
    answer: str(formData, "answer"),
    category: str(formData, "category") || "General",
    position: parseInt(str(formData, "position") || "0", 10) || 0,
  };
  if (id) await db.faq.update({ where: { id }, data });
  else await db.faq.create({ data });
  await db.auditLog.create({ data: { actorName: staff.name, action: id ? "Updated FAQ" : "Created FAQ", targetType: "Faq" } });
  revalidatePath("/admin/content/faqs");
  revalidatePath("/faqs");
  return { ok: true as const };
}

export async function deleteFaq(id: string) {
  await requireStaff();
  await db.faq.delete({ where: { id } });
  revalidatePath("/admin/content/faqs");
}

// ───────────────────────────── Testimonials ─────────────────────────────

export async function saveTestimonial(formData: FormData) {
  const staff = await requireStaff();
  const id = str(formData, "id");
  const quote = str(formData, "quote");
  const author = str(formData, "author");
  if (!quote || !author) return;
  const data = {
    quote,
    author,
    location: str(formData, "location") || null,
    rating: parseInt(str(formData, "rating") || "5", 10) || 5,
    isFeatured: bool(formData, "isFeatured"),
  };
  if (id) await db.testimonial.update({ where: { id }, data });
  else await db.testimonial.create({ data });
  await db.auditLog.create({ data: { actorName: staff.name, action: id ? "Updated testimonial" : "Created testimonial", targetType: "Testimonial" } });
  revalidatePath("/admin/content/testimonials");
  revalidatePath("/");
  return { ok: true as const };
}

export async function deleteTestimonial(id: string) {
  await requireStaff();
  await db.testimonial.delete({ where: { id } });
  revalidatePath("/admin/content/testimonials");
  revalidatePath("/");
}

// ───────────────────────────── Comments ─────────────────────────────

/** Public submission from the storefront — always starts as PENDING. */
export async function submitComment(postId: string, formData: FormData) {
  const author = str(formData, "author");
  const body = str(formData, "body");
  if (!author || !body) return { error: "Name and comment are required." };
  await db.blogComment.create({
    data: {
      postId,
      author: author.slice(0, 80),
      email: str(formData, "email").slice(0, 120) || null,
      body: body.slice(0, 2000),
      status: "PENDING",
    },
  });
  return { ok: true as const };
}

export async function moderateComment(id: string, status: "APPROVED" | "REJECTED") {
  const staff = await requireStaff();
  const c = await db.blogComment.update({ where: { id }, data: { status } });
  await db.auditLog.create({ data: { actorName: staff.name, action: "Moderated comment", targetType: "BlogComment", targetId: id, meta: { status } } });
  revalidatePath("/admin/content/comments");
  revalidatePath(`/blog`);
  return { ok: true as const, postId: c.postId };
}

export async function deleteComment(id: string) {
  await requireStaff();
  await db.blogComment.delete({ where: { id } });
  revalidatePath("/admin/content/comments");
}
