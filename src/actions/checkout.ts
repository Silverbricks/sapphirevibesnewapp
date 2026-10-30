"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "../../auth";
import { getFulfilmentSettings, getPaymentSettings, getTaxRate } from "@/lib/data/settings";
import { quoteDelivery, enabledPaymentKeys, fulfilmentAllows } from "@/lib/fulfilment";
import { Prisma } from "@prisma/client";
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
  fulfilmentType: "pickup" | "delivery";
  paymentMethod: string;
  couponCode?: string;
  giftCardCode?: string;
  applyStoreCredit?: boolean;
  redeemPoints?: boolean;
  giftWrap?: boolean;
  orderNotes?: string;
}

export type CheckoutResult = { error: string };

/** Account tiers that may use a coupon flagged `tradeOnly`. */
const TRADE_TIERS: string[] = ["TRADE", "CORPORATE", "VIP"];

/** Next order number, derived from the highest number already issued. */
async function nextOrderNumber(): Promise<string> {
  const existing = await db.order.findMany({ select: { number: true } });
  const maxNum = existing.reduce((m, o) => Math.max(m, parseInt(o.number.replace(/\D/g, "")) || 0), 10482);
  return `SV-${maxNum + 1}`;
}

/** A write that failed because a concurrent checkout claimed the same order number. */
function isOrderNumberClash(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

/** Thrown inside the transaction when the guarded stock decrement finds nothing left. */
class StockError extends Error {}

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!input.lines?.length) return { error: "Your cart is empty." };
  if (!input.email || !input.fullName) {
    return { error: "Please complete your contact details." };
  }
  if (input.fulfilmentType === "delivery" && (!input.line1 || !input.city || !input.postalCode)) {
    return { error: "Please complete your delivery address, including postcode." };
  }

  // This is a public server action — coalesce repeated lines and force whole, positive
  // quantities so crafted input can't oversell or write fractional cents into Int columns.
  const wanted = new Map<string, number>();
  for (const line of input.lines) {
    const qty = Math.floor(Number(line?.qty));
    if (!line?.productId || !Number.isSafeInteger(qty) || qty < 1) continue;
    wanted.set(line.productId, (wanted.get(line.productId) ?? 0) + qty);
  }
  if (!wanted.size) return { error: "Your cart is empty." };

  const products = await db.product.findMany({
    where: { id: { in: [...wanted.keys()] } },
    include: { images: { take: 1, orderBy: { position: "asc" }, select: { url: true } } },
  });

  const items: {
    productId: string; nameSnapshot: string; skuSnapshot: string; imageSnapshot: string | null;
    colour: string | null; unitCents: number; quantity: number; lineCents: number;
  }[] = [];
  let subtotal = 0;
  for (const [productId, qty] of wanted) {
    const p = products.find((x) => x.id === productId);
    if (!p) continue;
    if (p.stock < 1) return { error: `${p.name} is out of stock.` };
    // never silently reduce the order — tell the customer instead of charging for fewer
    if (qty > p.stock) return { error: `Only ${p.stock} × ${p.name} left in stock. Please reduce the quantity.` };
    const lineCents = p.priceCents * qty;
    subtotal += lineCents;
    items.push({
      productId: p.id, nameSnapshot: p.name, skuSnapshot: p.sku,
      imageSnapshot: p.images[0]?.url ?? null, colour: p.colour ?? null, unitCents: p.priceCents, quantity: qty, lineCents,
    });
  }
  if (!items.length) return { error: "None of your items are available." };

  // fulfilment — recompute the delivery fee authoritatively from saved settings (never trust the client)
  const fulfilment = await getFulfilmentSettings();
  let shipping = 0;
  let shippingMethodLabel = "Pickup";
  if (input.fulfilmentType === "delivery") {
    if (!fulfilmentAllows(fulfilment, "delivery")) return { error: "Delivery isn't available right now." };
    const quote = quoteDelivery(input.postalCode, subtotal, fulfilment.delivery);
    if (!quote.available || !quote.zone) {
      return { error: quote.reason ?? "Delivery isn't available for this address." };
    }
    shipping = quote.feeCents;
    shippingMethodLabel = `Delivery — ${quote.zone.name}`;
  } else {
    if (!fulfilmentAllows(fulfilment, "pickup")) return { error: "Pickup isn't available right now." };
  }

  // payment — only methods the owner has switched on, and nothing at all when every one is off
  const enabled = enabledPaymentKeys(await getPaymentSettings());
  if (!enabled.includes(input.paymentMethod)) {
    return { error: "That payment method isn't available. Please choose another." };
  }
  // Cash on Delivery and Bank Transfer are collected later — the order is not paid at checkout.
  const deferredPayment = input.paymentMethod === "CASH_ON_DELIVERY" || input.paymentMethod === "BANK_TRANSFER";
  const paymentStatus = deferredPayment ? "UNPAID" : "PAID";
  const paymentEventLabel = deferredPayment
    ? input.paymentMethod === "CASH_ON_DELIVERY"
      ? "Awaiting payment on delivery/pickup"
      : "Awaiting bank transfer"
    : "Payment received";

  const user = userId ? await db.user.findUnique({ where: { id: userId } }) : null;

  // coupon
  let discount = 0;
  let couponId: string | null = null;
  if (input.couponCode?.trim()) {
    const coupon = await db.coupon.findUnique({ where: { code: input.couponCode.trim().toUpperCase() } });
    if (!coupon || !coupon.isActive) return { error: "That coupon code isn't valid." };
    if (coupon.startsAt && coupon.startsAt > new Date()) return { error: "That coupon isn't active yet." };
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return { error: "That coupon has expired." };
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return { error: "That coupon has reached its usage limit." };
    }
    if (coupon.minSubtotal && subtotal < coupon.minSubtotal) return { error: `Spend $${(coupon.minSubtotal / 100).toFixed(0)}+ to use ${coupon.code}.` };
    if (coupon.tradeOnly && !(user && TRADE_TIERS.includes(user.customerType))) {
      return { error: "That code is for trade and Elite accounts only." };
    }
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
    if (gc.expiresAt && gc.expiresAt < new Date()) return { error: "That gift card has expired." };
    if (gc.balanceCents <= 0) return { error: "That gift card has no balance left." };
    giftCardId = gc.id;
    giftCardUsed = Math.min(gc.balanceCents, subtotal - discount);
    giftCardBalanceAfter = gc.balanceCents - giftCardUsed;
  }

  // store credit + points (logged-in only)
  let storeCreditUsed = 0;
  let pointsRedeemed = 0;
  let pointsRedeemedCents = 0;
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
  const tax = Math.round(taxable * (await getTaxRate()));
  let total = subtotal - discount + shipping + tax - giftCardUsed - storeCreditUsed - pointsRedeemedCents;
  if (total < 0) total = 0;

  const pointsEarned = Math.floor(total / 100);

  // Order numbers come from the current maximum, so two simultaneous checkouts can land
  // on the same one. Re-derive and retry rather than failing the customer's order.
  let number = "";
  for (let attempt = 0; ; attempt++) {
    number = await nextOrderNumber();
    const orderNumber = number;
    try {
      await db.$transaction(async (tx) => {
        const order = await tx.order.create({
          select: { id: true },
          data: {
            number: orderNumber,
            userId,
            guestEmail: userId ? null : input.email,
            customerName: input.fullName,
            status: "PROCESSING",
            paymentStatus,
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
            shippingMethod: shippingMethodLabel,
            invoiceNumber: `INV-${orderNumber.replace(/\D/g, "")}`,
            giftWrap: !!input.giftWrap,
            orderNotes: input.orderNotes || null,
            shippingSnapshot:
              input.fulfilmentType === "pickup"
                ? {
                    fullName: input.fullName,
                    method: "Pickup",
                    pickupAddress: fulfilment.pickup.address,
                    phone: input.phone ?? null,
                  }
                : {
                    fullName: input.fullName, line1: input.line1, line2: input.line2 ?? null,
                    city: input.city, region: input.region, postalCode: input.postalCode, country: input.country ?? "Australia",
                    phone: input.phone ?? null,
                  },
            items: { create: items },
            events: {
              create: [
                { kind: "SYSTEM", label: "Order placed" },
                { kind: "SYSTEM", label: paymentEventLabel },
                { kind: "STATUS", label: "Processing started" },
              ],
            },
          },
        });

        // stock + sales — guarded so two concurrent orders can't claim the same unit
        for (const it of items) {
          const claimed = await tx.product.updateMany({
            where: { id: it.productId, stock: { gte: it.quantity } },
            data: { stock: { decrement: it.quantity }, salesCount: { increment: it.quantity } },
          });
          if (claimed.count === 0) throw new StockError(`${it.nameSnapshot} just sold out. Please adjust your cart.`);
        }

        if (couponId) await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
        if (giftCardId) {
          await tx.giftCard.update({ where: { id: giftCardId }, data: { balanceCents: giftCardBalanceAfter, status: giftCardBalanceAfter <= 0 ? "REDEEMED" : "ACTIVE" } });
          // ledger entry for the redemption, so a card's balance history is auditable
          if (giftCardUsed > 0) {
            await tx.giftCardTxn.create({ data: { giftCardId, orderId: order.id, deltaCents: -giftCardUsed } });
          }
        }

        if (user) {
          // earn points
          if (pointsEarned > 0) {
            await tx.rewardTransaction.create({ data: { userId: user.id, orderId: order.id, points: pointsEarned, reason: "ORDER_EARN", note: `Order ${orderNumber}` } });
          }
          // spend credit / points
          if (storeCreditUsed > 0) {
            await tx.storeCreditTxn.create({ data: { userId: user.id, deltaCents: -storeCreditUsed, reason: `Order ${orderNumber}`, refId: orderNumber } });
          }
          if (pointsRedeemed > 0) {
            await tx.rewardTransaction.create({ data: { userId: user.id, orderId: order.id, points: -pointsRedeemed, reason: "REDEEM", note: `Redeemed at checkout` } });
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
          await tx.referral.update({ where: { id: referral.id }, data: { status: "CONVERTED", orderId: order.id, refereeUserId: userId ?? undefined } });
          await tx.user.update({ where: { id: referral.referrerId }, data: { storeCreditCents: { increment: referral.rewardCents } } });
          await tx.storeCreditTxn.create({ data: { userId: referral.referrerId, deltaCents: referral.rewardCents, reason: `Referral converted`, refId: orderNumber } });
        }
      });
      break;
    } catch (e) {
      if (e instanceof StockError) return { error: e.message };
      if (attempt < 4 && isOrderNumberClash(e)) continue;
      throw e;
    }
  }

  revalidatePath("/account");
  revalidatePath("/admin/orders");
  redirect(`/checkout/confirmation/${number}`);
}
