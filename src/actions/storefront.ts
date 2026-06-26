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

export interface TrackedOrder {
  number: string;
  status: string;
  customerName: string;
  placedAt: string;
  trackingNumber: string | null;
  carrier: string | null;
  totalCents: number;
  items: { name: string; quantity: number; image: string | null }[];
}

/** Guest order tracking by order number + email. */
export async function trackOrder(
  numberInput: string,
  emailInput: string,
): Promise<{ ok: true; order: TrackedOrder } | { ok: false; message: string }> {
  const number = numberInput.trim().toUpperCase();
  const email = emailInput.trim().toLowerCase();
  if (!number || !emailSchema.safeParse(email).success)
    return { ok: false, message: "Enter a valid order number and email." };

  const order = await db.order.findFirst({
    where: {
      number,
      OR: [{ guestEmail: email }, { user: { email } }],
    },
    include: { items: { select: { nameSnapshot: true, quantity: true, imageSnapshot: true } } },
  });
  if (!order) return { ok: false, message: "No order found with that number and email." };

  return {
    ok: true,
    order: {
      number: order.number,
      status: order.status,
      customerName: order.customerName,
      placedAt: order.placedAt.toISOString(),
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      totalCents: order.totalCents,
      items: order.items.map((i) => ({
        name: i.nameSnapshot,
        quantity: i.quantity,
        image: i.imageSnapshot,
      })),
    },
  };
}
