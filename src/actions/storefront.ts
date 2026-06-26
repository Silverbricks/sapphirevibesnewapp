"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getProductsByIds, type ProductCardData } from "@/lib/data/products";

const emailSchema = z.string().email();

export async function requestBackInStock(productId: string, email: string) {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { ok: false, message: "Please enter a valid email." };
  try {
    await db.stockNotification.upsert({
      where: { productId_email: { productId, email: parsed.data } },
      create: { productId, email: parsed.data },
      update: {},
    });
    return { ok: true, message: "You're on the waitlist — we'll email you." };
  } catch {
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}

export async function subscribeNewsletter(email: string) {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { ok: false, message: "Please enter a valid email." };
  try {
    await db.subscriber.upsert({
      where: { email: parsed.data },
      create: { email: parsed.data, segments: ["New subscribers"] },
      update: {},
    });
    return { ok: true, message: "Subscribed — welcome to the list! Enjoy 10% off." };
  } catch {
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}

/** Resolve recently-viewed product ids (from client localStorage) into card data. */
export async function getRecentlyViewed(ids: string[]): Promise<ProductCardData[]> {
  return getProductsByIds(ids.slice(0, 8));
}
