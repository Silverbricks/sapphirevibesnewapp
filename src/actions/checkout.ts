"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "../../auth";
import { GST_RATE, FREE_SHIPPING_THRESHOLD_CENTS, SHIPPING_METHODS } from "@/lib/constants";
import type { PaymentMethod } from "@prisma/client";

export interface CheckoutInput {
  lines: { productId: string; qty: number }[];
  email: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country?: string;
  phone?: string;
  shippingMethod: string;
  paymentMethod: string;
  couponCode?: string;
  giftCardCode?: string;
  applyStoreCredit?: boolean;
  redeemPoints?: boolean;
  giftWrap?: boolean;
  orderNotes?: string;
}

export type CheckoutResult = { error: string };

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!input.lines.length) return { error: "Your cart is empty." };
  if (!input.email || !input.fullName || !input.line1 || !input.city) {
    return { error: "Please complete your contact and shipping details." };
  }

  const products = await db.product.findMany({
    where: { id: { in: input.lines.map((l) => l.productId) } },
    include: { images: { take: 1, orderBy: { position: "asc" }, select: { url: true } } },
  });

  const items: {
    productId: string; nameSnapshot: string; skuSnapshot: string; imageSnapshot: string | null;
    unitCents: number; quantity: number; lineCents: number;
  }[] = [];
  let subtotal = 0;
  for (const line of input.lines) {
    const p = products.find((x) => x.id === line.productId);
    if (!p) continue;
    const qty = Math.max(1, Math.min(line.qty, p.stock));
    if (p.stock < 1) return { error: `${p.name} is out of stock.` };
    const lineCents = p.priceCents * qty;
    subtotal += lineCents;
    items.push({
      productId: p.id, nameSnapshot: p.name, skuSnapshot: p.sku,
      imageSnapshot: p.images[0]?.url ?? null, unitCents: p.priceCents, quantity: qty, lineCents,
    });
  }
  if (!items.length) return { error: "None of your items are available." };

  // shipping
  const method = SHIPPING_METHODS.find((m) => m.id === input.shippingMethod) ?? SHIPPING_METHODS[0];
  let shipping = subtotal >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : method.cents;

  // coupon
  let discount = 0;
  let couponId: string | null = null;
  if (input.couponCode?.trim()) {
    const coupon = await db.coupon.findUnique({ where: { code: input.couponCode.trim().toUpperCase() } });
    if (!coupon || !coupon.isActive) return { error: "That coupon code isn't valid." };
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return { error: "That coupon has expired." };
    if (coupon.minSubtotal && subtotal < coupon.minSubtotal) return { error: `Spend ${(coupon.minSubtotal / 100).toFixed(0)}+ to use ${coupon.code}.` };
    if (coupon.firstOrderOnly && userId) {
      const prior = await db.order.count({ where: { userId } });
      if (prior > 0) return { error: "That code is for first orders only." };
    }
    couponId = coupon.id;
    if (coupon.type === "PERCENT") discount = Math.round(subtotal * ((coupon.percent ?? 0) / 100));
    else if (coupon.type === "FIXED") discount = Math.min(coupon.valueCents ?? 0, subtotal);
    else if (coupon.type === "FREE_SHIPPING") shipping = 0;
  }

  // gift card
  let giftCardId: string | null = null;
  let giftCardUsed = 0;
  let giftCardBalanceAfter = 0;
  if (input.giftCardCode?.trim()) {
    const gc = await db.giftCard.findUnique({ where: { code: input.giftCardCode.trim().toUpperCase() } });
    if (!gc || gc.status !== "ACTIVE") return { error: "That gift card isn't valid." };
    giftCardId = gc.id;
    giftCardUsed = Math.min(gc.balanceCents, subtotal - discount);
    giftCardBalanceAfter = gc.balanceCents - giftCardUsed;
  }

  // store credit + points (logged-in only)
  let storeCreditUsed = 0;
  let pointsRedeemed = 0;
  let pointsRedeemedCents = 0;
  let user = userId ? await db.user.findUnique({ where: { id: userId } }) : null;
  const remainingBeforeCredit = subtotal - discount - giftCardUsed;
  if (user && input.applyStoreCredit && user.storeCreditCents > 0) {
    storeCreditUsed = Math.min(user.storeCreditCents, remainingBeforeCredit);
  }
  if (user && input.redeemPoints && user.pointsBalance > 0) {
    const afterCredit = remainingBeforeCredit - storeCreditUsed;
    pointsRedeemed = Math.min(user.pointsBalance, afterCredit); // 1 pt = 1 cent
    pointsRedeemedCents = pointsRedeemed;
  }

  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * GST_RATE);
  let total = subtotal - discount + shipping + tax - giftCardUsed - storeCreditUsed - pointsRedeemedCents;
  if (total < 0) total = 0;

  // order number
  const existing = await db.order.findMany({ select: { number: true } });
  const maxNum = existing.reduce((m, o) => Math.max(m, parseInt(o.number.replace(/\D/g, "")) || 0), 10482);
  const number = `SV-${maxNum + 1}`;

  const pointsEarned = Math.floor(total / 100);

  await db.$transaction(async (tx) => {
    await tx.order.create({
      data: {
        number,
        userId,
        guestEmail: userId ? null : input.email,
        customerName: input.fullName,
        status: "PROCESSING",
        paymentStatus: "PAID",
        paymentMethod: (input.paymentMethod as PaymentMethod) || "MOCK",
        subtotalCents: subtotal,
        discountCents: discount,
        shippingCents: shipping,
        taxCents: tax,
        giftCardCents: giftCardUsed,
        storeCreditCents: storeCreditUsed,
        pointsRedeemedCents,
        totalCents: total,
        couponId,
        giftCardId,
        shippingMethod: method.label,
        giftWrap: !!input.giftWrap,
        orderNotes: input.orderNotes || null,
        shippingSnapshot: {
          fullName: input.fullName, line1: input.line1, line2: input.line2 ?? null,
          city: input.city, region: input.region, postalCode: input.postalCode, country: input.country ?? "Australia",
        },
        items: { create: items },
      },
    });

    // stock + sales
    for (const it of items) {
      await tx.product.update({
        where: { id: it.productId },
        data: { stock: { decrement: it.quantity }, salesCount: { increment: it.quantity } },
      });
    }

    if (couponId) await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
    if (giftCardId) {
      await tx.giftCard.update({ where: { id: giftCardId }, data: { balanceCents: giftCardBalanceAfter, status: giftCardBalanceAfter <= 0 ? "REDEEMED" : "ACTIVE" } });
    }

    if (user) {
      const created = await tx.order.findUnique({ where: { number }, select: { id: true } });
      // earn points
      if (pointsEarned > 0) {
        await tx.rewardTransaction.create({ data: { userId: user.id, orderId: created!.id, points: pointsEarned, reason: "ORDER_EARN", note: `Order ${number}` } });
      }
      // spend credit / points
      if (storeCreditUsed > 0) {
        await tx.storeCreditTxn.create({ data: { userId: user.id, deltaCents: -storeCreditUsed, reason: `Order ${number}`, refId: number } });
      }
      if (pointsRedeemed > 0) {
        await tx.rewardTransaction.create({ data: { userId: user.id, orderId: created!.id, points: -pointsRedeemed, reason: "REDEEM", note: `Redeemed at checkout` } });
      }
      await tx.user.update({
        where: { id: user.id },
        data: {
          pointsBalance: { increment: pointsEarned - pointsRedeemed },
          storeCreditCents: { decrement: storeCreditUsed },
        },
      });
    }

    // referral conversion (this buyer was referred — matched by the email they entered)
    const referral = await tx.referral.findFirst({
      where: { status: { in: ["INVITED", "JOINED"] }, refereeEmail: input.email },
    });
    if (referral) {
      const created = await tx.order.findUnique({ where: { number }, select: { id: true } });
      await tx.referral.update({ where: { id: referral.id }, data: { status: "CONVERTED", orderId: created!.id, refereeUserId: userId ?? undefined } });
      await tx.user.update({ where: { id: referral.referrerId }, data: { storeCreditCents: { increment: referral.rewardCents } } });
      await tx.storeCreditTxn.create({ data: { userId: referral.referrerId, deltaCents: referral.rewardCents, reason: `Referral converted`, refId: number } });
    }
  });

  revalidatePath("/account");
  revalidatePath("/admin/orders");
  redirect(`/checkout/confirmation/${number}`);
}
