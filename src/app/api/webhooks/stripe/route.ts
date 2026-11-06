import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { formatMoney } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook — the authoritative signal that an order has been paid. The
 * customer's return to success_url is NOT trusted: they can close the tab after
 * paying, or craft the URL without paying.
 *
 * Point Stripe at POST /api/webhooks/stripe and subscribe to:
 *   checkout.session.completed, checkout.session.expired, checkout.session.async_payment_failed
 */
export async function POST(req: Request) {
  if (!stripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "stripe not configured" }, { status: 503 });
  }

  // Signature verification needs the unparsed body — req.json() would break it.
  const raw = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error("Stripe webhook signature verification failed", e);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await markPaid(event.data.object);
      break;
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed":
      await markFailed(event.data.object);
      break;
    default:
      break; // acknowledged and ignored
  }

  return NextResponse.json({ received: true });
}

/** Resolve the order a session belongs to, by session id then by reference. */
async function findOrder(session: Stripe.Checkout.Session) {
  const number = session.client_reference_id || session.metadata?.orderNumber;
  const order =
    (await db.order.findFirst({ where: { paymentSessionId: session.id } })) ??
    (number ? await db.order.findUnique({ where: { number } }) : null);
  if (!order) console.error(`Stripe webhook: no order for session ${session.id}`);
  return order;
}

async function markPaid(session: Stripe.Checkout.Session) {
  const order = await findOrder(session);
  if (!order) return;

  // Stripe retries webhooks for days — a replay must be a no-op.
  if (order.paymentStatus === "PAID") return;
  // Never resurrect a refunded order from a late webhook.
  if (order.paymentStatus === "REFUNDED" || order.paymentStatus === "PARTIALLY_REFUNDED") return;

  const paid = session.amount_total ?? order.totalCents;
  const intent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;

  await db.order.update({
    where: { id: order.id },
    data: { paymentStatus: "PAID", paymentRef: intent, paymentSessionId: session.id },
  });
  await db.orderEvent.create({
    data: {
      orderId: order.id,
      kind: "SYSTEM",
      label: `Payment of ${formatMoney(paid)} received via Stripe`,
      body: intent ? `Stripe payment intent: ${intent}` : null,
    },
  });

  // The amount charged should equal what we asked for. If it doesn't, flag it rather
  // than silently accepting — it means the session was tampered with or mispriced.
  if (session.amount_total != null && session.amount_total !== order.totalCents) {
    await db.orderEvent.create({
      data: {
        orderId: order.id,
        kind: "SYSTEM",
        label: "⚠ Paid amount differs from order total — please review",
        body: `Charged ${formatMoney(session.amount_total)} against an order total of ${formatMoney(order.totalCents)}.`,
      },
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.number}`);
}

async function markFailed(session: Stripe.Checkout.Session) {
  const order = await findOrder(session);
  if (!order || order.paymentStatus !== "UNPAID") return;

  await db.orderEvent.create({
    data: {
      orderId: order.id,
      kind: "SYSTEM",
      label: session.status === "expired" ? "Checkout expired without payment" : "Payment failed",
    },
  });
  revalidatePath(`/admin/orders/${order.number}`);
}
