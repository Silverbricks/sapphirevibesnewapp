import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { stripe, stripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Gateway checkouts are abandoned after this long and their reservations released.
 * Stays clear of the 35-minute Stripe session expiry set in placeOrder, so a session is
 * already dead at Stripe — and can no longer be paid — before we release its stock.
 */
const ABANDON_AFTER_MINUTES = 45;

/**
 * Releases abandoned gateway checkouts. Placing an order reserves stock (and consumes
 * coupon uses, gift-card balance, store credit and points) *before* the customer is
 * sent to Stripe — so a customer who never pays would otherwise hold all of it forever.
 *
 * Only touches orders that have a Stripe session attached, so Bank Transfer and Cash on
 * Delivery orders — which are legitimately unpaid for days — are never swept.
 *
 * Call on a schedule, e.g. a VPS cron hitting /api/cron/release-unpaid?secret=…
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = req.headers.get("x-cron-secret") || new URL(req.url).searchParams.get("secret");
    if (provided !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - ABANDON_AFTER_MINUTES * 60 * 1000);
  const stale = await db.order.findMany({
    where: {
      paymentStatus: "UNPAID",
      paymentSessionId: { not: null },
      status: { notIn: ["CANCELLED", "REFUNDED"] },
      placedAt: { lt: cutoff },
    },
    include: { items: true },
  });

  const released: string[] = [];
  const skipped: string[] = [];

  for (const order of stale) {
    try {
      // Ask Stripe before releasing anything. A webhook can arrive late or be lost, so
      // "still UNPAID in our database" is not proof the customer didn't pay — and
      // cancelling a paid order would hand back stock we've already been paid for.
      // If Stripe can't give a straight answer, leave the order alone: stock held too
      // long is something staff can fix, a cancelled-but-paid order is not.
      if (order.paymentSessionId && stripeConfigured()) {
        let abandoned: boolean;
        try {
          const session = await stripe().checkout.sessions.retrieve(order.paymentSessionId);
          abandoned = session.payment_status === "unpaid";
        } catch (e) {
          console.error(`release-unpaid: couldn't verify ${order.number} with Stripe`, e);
          abandoned = false;
        }
        if (!abandoned) {
          skipped.push(order.number);
          continue;
        }
      }

      await db.$transaction(async (tx) => {
        // Claim it only while still unpaid — a webhook may be landing right now.
        const claimed = await tx.order.updateMany({
          where: { id: order.id, paymentStatus: "UNPAID" },
          data: { status: "CANCELLED" },
        });
        if (claimed.count === 0) return;

        // stock + sales counters
        for (const it of order.items) {
          if (!it.productId) continue; // product deleted since — nothing to restore
          await tx.product.update({
            where: { id: it.productId },
            data: { stock: { increment: it.quantity }, salesCount: { decrement: it.quantity } },
          });
        }

        // coupon use
        if (order.couponId) {
          await tx.coupon.update({ where: { id: order.couponId }, data: { usedCount: { decrement: 1 } } });
        }

        // gift card balance + its ledger row
        if (order.giftCardId && order.giftCardCents > 0) {
          await tx.giftCard.update({
            where: { id: order.giftCardId },
            data: { balanceCents: { increment: order.giftCardCents }, status: "ACTIVE" },
          });
          await tx.giftCardTxn.deleteMany({ where: { orderId: order.id } });
        }

        if (order.userId) {
          // points: reverse the net of everything booked against this order
          const txns = await tx.rewardTransaction.findMany({
            where: { orderId: order.id },
            select: { points: true },
          });
          const netPoints = txns.reduce((n, t) => n + t.points, 0);
          if (netPoints !== 0) {
            await tx.user.update({
              where: { id: order.userId },
              data: { pointsBalance: { decrement: netPoints } },
            });
          }
          await tx.rewardTransaction.deleteMany({ where: { orderId: order.id } });

          // store credit
          if (order.storeCreditCents > 0) {
            await tx.user.update({
              where: { id: order.userId },
              data: { storeCreditCents: { increment: order.storeCreditCents } },
            });
            await tx.storeCreditTxn.deleteMany({ where: { userId: order.userId, refId: order.number } });
          }
        }

        await tx.orderEvent.create({
          data: {
            orderId: order.id,
            kind: "SYSTEM",
            label: "Checkout abandoned — order cancelled and stock released",
            body: `No payment received within ${ABANDON_AFTER_MINUTES} minutes of checkout.`,
          },
        });

        released.push(order.number);
      });
    } catch (e) {
      // one bad order shouldn't stop the sweep
      console.error(`release-unpaid: failed to release ${order.number}`, e);
    }
  }

  if (released.length > 0) revalidatePath("/admin/orders");
  return NextResponse.json({ checked: stale.length, released, skipped });
}
