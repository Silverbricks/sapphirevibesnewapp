"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth-helpers";
import { getSiteSettings } from "@/lib/data/settings";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { formatMoney, formatDate } from "@/lib/format";
import { GST_RATE, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/constants";
import { Prisma } from "@prisma/client";
import type { OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client";

// ───────────────────────── helpers ─────────────────────────

const str = (fd: FormData, k: string) => (fd.get(k) as string)?.trim() || "";
const cents = (fd: FormData, k: string) => Math.round(parseFloat((fd.get(k) as string) || "0") * 100) || 0;
const label = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");

function revalidateOrder(number?: string) {
  revalidatePath("/admin/orders");
  if (number) revalidatePath(`/admin/orders/${number}`);
}

async function logEvent(orderId: string, kind: string, eventLabel: string, body?: string | null, staffName?: string | null) {
  await db.orderEvent.create({ data: { orderId, kind, label: eventLabel, body: body ?? null, staffName: staffName ?? null } });
}

async function nextOrderNumber() {
  const existing = await db.order.findMany({ select: { number: true } });
  const maxNum = existing.reduce((m, o) => Math.max(m, parseInt(o.number.replace(/\D/g, "")) || 0), 10482);
  return `SV-${maxNum + 1}`;
}

async function nextRmaNumber() {
  const last = await db.return.findFirst({ orderBy: { createdAt: "desc" }, select: { number: true } });
  const n = last ? parseInt(last.number.replace(/\D/g, "")) || 1000 : 1000;
  return `RMA-${n + 1}`;
}

// ───────────────────────── status & fulfilment ─────────────────────────

export async function updateOrderStatus(orderId: string, status: string) {
  const staff = await requireStaff();
  const data: Prisma.OrderUpdateInput = { status: status as OrderStatus };
  if (status === "SHIPPED") data.dispatchedAt = new Date();
  if (status === "DELIVERED") data.deliveredAt = new Date();
  const order = await db.order.update({ where: { id: orderId }, data });
  await logEvent(order.id, "STATUS", `Status changed to ${label(status)}`, null, staff.name);
  await db.auditLog.create({ data: { actorName: staff.name, action: "Updated order status", targetType: "Order", targetId: order.number, meta: { status } } });
  revalidateOrder(order.number);
  return { ok: true as const };
}

export async function updateDelivery(orderId: string, formData: FormData) {
  const staff = await requireStaff();
  const date = (k: string) => (str(formData, k) ? new Date(str(formData, k)) : null);
  const order = await db.order.update({
    where: { id: orderId },
    data: {
      carrier: str(formData, "carrier") || null,
      trackingNumber: str(formData, "trackingNumber") || null,
      trackingUrl: str(formData, "trackingUrl") || null,
      dispatchedAt: date("dispatchedAt"),
      estimatedDeliveryAt: date("estimatedDeliveryAt"),
      deliveredAt: date("deliveredAt"),
      proofOfDelivery: str(formData, "proofOfDelivery") || null,
      deliveryNotes: str(formData, "deliveryNotes") || null,
    },
  });
  await logEvent(order.id, "SYSTEM", "Delivery details updated", null, staff.name);
  await db.auditLog.create({ data: { actorName: staff.name, action: "Updated delivery info", targetType: "Order", targetId: order.number } });
  revalidateOrder(order.number);
  return { ok: true as const };
}

export async function updateOrderCustomer(orderId: string, formData: FormData) {
  const staff = await requireStaff();
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Order not found." };

  const name = str(formData, "customerName") || order.customerName;
  const email = str(formData, "email");
  await db.order.update({
    where: { id: orderId },
    data: { customerName: name, guestEmail: order.userId ? order.guestEmail : email || order.guestEmail },
  });

  if (order.userId) {
    try {
      await db.user.update({
        where: { id: order.userId },
        data: {
          name,
          ...(email ? { email } : {}),
          phone: str(formData, "phone") || null,
          alternatePhone: str(formData, "alternatePhone") || null,
          company: str(formData, "company") || null,
          abn: str(formData, "abn") || null,
          notes: str(formData, "notes") || null,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return { error: "That email is already used by another account." };
      }
      throw e;
    }
  }
  await logEvent(order.id, "SYSTEM", "Customer details updated", null, staff.name);
  revalidateOrder(order.number);
  return { ok: true as const };
}

export async function updateOrderAddresses(orderId: string, formData: FormData) {
  const staff = await requireStaff();
  const addr = (p: string) => ({
    fullName: str(formData, `${p}FullName`),
    company: str(formData, `${p}Company`) || null,
    line1: str(formData, `${p}Line1`),
    line2: str(formData, `${p}Line2`) || null,
    city: str(formData, `${p}City`),
    region: str(formData, `${p}Region`),
    postalCode: str(formData, `${p}PostalCode`),
    country: str(formData, `${p}Country`) || "Australia",
    phone: str(formData, `${p}Phone`) || null,
    instructions: str(formData, `${p}Instructions`) || null,
  });
  const sameBilling = formData.get("billingSameAsShipping") === "on";
  const order = await db.order.update({
    where: { id: orderId },
    data: {
      shippingSnapshot: addr("ship") as Prisma.InputJsonValue,
      billingSameAsShipping: sameBilling,
      billingSnapshot: sameBilling ? Prisma.DbNull : (addr("bill") as Prisma.InputJsonValue),
    },
  });
  await logEvent(order.id, "SYSTEM", "Addresses updated", null, staff.name);
  revalidateOrder(order.number);
  return { ok: true as const };
}

export async function saveInternalNotes(orderId: string, formData: FormData) {
  const staff = await requireStaff();
  const notes = {
    packing: str(formData, "packing"),
    delivery: str(formData, "delivery"),
    warehouse: str(formData, "warehouse"),
    support: str(formData, "support"),
    refund: str(formData, "refund"),
  };
  const order = await db.order.update({ where: { id: orderId }, data: { internalNotes: notes as Prisma.InputJsonValue } });
  await db.auditLog.create({ data: { actorName: staff.name, action: "Updated internal notes", targetType: "Order", targetId: order.number } });
  revalidateOrder(order.number);
  return { ok: true as const };
}

export async function assignOrder(orderId: string, staffName: string) {
  const staff = await requireStaff();
  const order = await db.order.update({ where: { id: orderId }, data: { assignedToName: staffName || null } });
  await logEvent(order.id, "SYSTEM", staffName ? `Assigned to ${staffName}` : "Unassigned", null, staff.name);
  revalidateOrder(order.number);
  return { ok: true as const };
}

export async function addOrderNote(orderId: string, formData: FormData) {
  const staff = await requireStaff();
  const body = str(formData, "note");
  if (!body) return { error: "Note is empty." };
  const order = await db.order.findUnique({ where: { id: orderId }, select: { number: true } });
  await logEvent(orderId, "NOTE", "Internal note", body, staff.name);
  revalidateOrder(order?.number);
  return { ok: true as const };
}

// ───────────────────────── refund / cancel / archive ─────────────────────────

export async function refundOrder(orderId: string, formData: FormData) {
  const staff = await requireStaff();
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Order not found." };
  const amount = cents(formData, "amount") || order.totalCents;
  const reason = str(formData, "reason") || null;
  const newRefunded = Math.min(order.totalCents, order.refundedCents + amount);
  const full = newRefunded >= order.totalCents;
  await db.order.update({
    where: { id: orderId },
    data: {
      refundedCents: newRefunded,
      refundReason: reason,
      paymentStatus: (full ? "REFUNDED" : "PARTIALLY_REFUNDED") as PaymentStatus,
      status: full ? "REFUNDED" : order.status,
    },
  });
  await logEvent(order.id, "SYSTEM", `Refund of ${formatMoney(amount)} recorded${reason ? ` — ${reason}` : ""}`, null, staff.name);
  await db.auditLog.create({ data: { actorName: staff.name, action: "Refunded order", targetType: "Order", targetId: order.number, meta: { amount, reason } } });
  revalidateOrder(order.number);
  return { ok: true as const };
}

export async function cancelOrder(orderId: string, reason?: string) {
  const staff = await requireStaff();
  const order = await db.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
  await logEvent(order.id, "STATUS", `Order cancelled${reason ? ` — ${reason}` : ""}`, null, staff.name);
  await db.auditLog.create({ data: { actorName: staff.name, action: "Cancelled order", targetType: "Order", targetId: order.number } });
  revalidateOrder(order.number);
  return { ok: true as const };
}

export async function setArchived(orderId: string, archived: boolean) {
  const staff = await requireStaff();
  const order = await db.order.update({ where: { id: orderId }, data: { archivedAt: archived ? new Date() : null } });
  await logEvent(order.id, "SYSTEM", archived ? "Order archived" : "Order restored", null, staff.name);
  revalidateOrder(order.number);
  return { ok: true as const };
}

// ───────────────────────── communications ─────────────────────────

export async function logCommunication(orderId: string, kind: string, eventLabel: string, body?: string) {
  const staff = await requireStaff();
  const order = await db.order.findUnique({ where: { id: orderId }, select: { number: true } });
  await logEvent(orderId, kind, eventLabel, body ?? null, staff.name);
  revalidateOrder(order?.number);
  return { ok: true as const };
}

function invoiceEmailHtml(storeName: string, order: { number: string; customerName: string; totalCents: number; invoiceNumber: string | null }) {
  return `<div style="font-family:Georgia,serif;color:#1a1a1a">
    <h2>${storeName}</h2>
    <p>Hi ${order.customerName},</p>
    <p>Thank you for your order <strong>${order.number}</strong>${order.invoiceNumber ? ` (Invoice ${order.invoiceNumber})` : ""}.</p>
    <p>Order total: <strong>${formatMoney(order.totalCents)}</strong></p>
    <p>You can reply to this email if you have any questions.</p>
    <p>— The ${storeName} team</p>
  </div>`;
}

function trackingEmailHtml(storeName: string, order: { number: string; customerName: string; carrier: string | null; trackingNumber: string | null; trackingUrl: string | null }) {
  return `<div style="font-family:Georgia,serif;color:#1a1a1a">
    <h2>${storeName}</h2>
    <p>Hi ${order.customerName},</p>
    <p>Good news — your order <strong>${order.number}</strong> is on its way!</p>
    ${order.carrier ? `<p>Carrier: <strong>${order.carrier}</strong></p>` : ""}
    ${order.trackingNumber ? `<p>Tracking number: <strong>${order.trackingNumber}</strong></p>` : ""}
    ${order.trackingUrl ? `<p><a href="${order.trackingUrl}">Track your parcel</a></p>` : ""}
    <p>— The ${storeName} team</p>
  </div>`;
}

export async function sendOrderEmail(orderId: string, template: "invoice" | "tracking" | "custom", custom?: { subject: string; body: string }) {
  const staff = await requireStaff();
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { email: true } } },
  });
  if (!order) return { error: "Order not found." };
  const to = order.user?.email || order.guestEmail;
  if (!to) return { error: "This order has no customer email." };

  const { store } = await getSiteSettings();
  let subject = "";
  let html = "";
  if (template === "invoice") {
    subject = `Your ${store.name} invoice — ${order.number}`;
    html = invoiceEmailHtml(store.name, order);
  } else if (template === "tracking") {
    subject = `Your ${store.name} order is on its way — ${order.number}`;
    html = trackingEmailHtml(store.name, order);
  } else {
    subject = custom?.subject || `A message about your order ${order.number}`;
    html = `<div style="font-family:Georgia,serif;color:#1a1a1a"><p>${(custom?.body || "").replace(/\n/g, "<br/>")}</p></div>`;
  }

  try {
    await sendEmail({ to, subject, html });
  } catch (e) {
    return { error: (e as Error).message };
  }
  await logEvent(order.id, "EMAIL", `Email sent: ${subject}`, `To: ${to}`, staff.name);
  revalidateOrder(order.number);
  return { ok: true as const };
}

export async function sendOrderSms(orderId: string, body: string) {
  const staff = await requireStaff();
  const order = await db.order.findUnique({ where: { id: orderId }, include: { user: { select: { phone: true } } } });
  if (!order) return { error: "Order not found." };
  const to = order.user?.phone;
  if (!to) return { error: "This customer has no mobile number." };
  try {
    await sendSms({ to, body });
  } catch (e) {
    return { error: (e as Error).message };
  }
  await logEvent(order.id, "SMS", "SMS sent", body, staff.name);
  revalidateOrder(order.number);
  return { ok: true as const };
}

// ───────────────────────── returns (RMA) ─────────────────────────

export async function createReturn(orderId: string, formData: FormData) {
  const staff = await requireStaff();
  const order = await db.order.findUnique({ where: { id: orderId }, select: { number: true } });
  if (!order) return { error: "Order not found." };
  const number = await nextRmaNumber();
  await db.return.create({
    data: {
      number,
      orderId,
      status: "REQUESTED",
      reason: str(formData, "reason") || null,
      refundCents: cents(formData, "refund"),
      notes: str(formData, "notes") || null,
      items: Prisma.JsonNull,
    },
  });
  await logEvent(orderId, "RETURN", `Return requested (${number})`, str(formData, "reason") || null, staff.name);
  await db.auditLog.create({ data: { actorName: staff.name, action: "Created return", targetType: "Order", targetId: order.number, meta: { number } } });
  revalidateOrder(order.number);
  return { ok: true as const };
}

export async function updateReturnStatus(returnId: string, status: string) {
  const staff = await requireStaff();
  const ret = await db.return.update({ where: { id: returnId }, data: { status }, include: { order: { select: { id: true, number: true } } } });
  await logEvent(ret.orderId, "RETURN", `Return ${ret.number} → ${label(status)}`, null, staff.name);
  revalidateOrder(ret.order.number);
  return { ok: true as const };
}

// ───────────────────────── duplicate / manual / bulk ─────────────────────────

export async function duplicateOrder(orderId: string) {
  const staff = await requireStaff();
  const src = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!src) return;
  const number = await nextOrderNumber();
  const created = await db.order.create({
    data: {
      number,
      userId: src.userId,
      guestEmail: src.guestEmail,
      customerName: src.customerName,
      status: "PENDING",
      paymentStatus: "UNPAID",
      paymentMethod: src.paymentMethod,
      subtotalCents: src.subtotalCents,
      discountCents: src.discountCents,
      shippingCents: src.shippingCents,
      taxCents: src.taxCents,
      totalCents: src.totalCents,
      shippingMethod: src.shippingMethod,
      shippingSnapshot: (src.shippingSnapshot ?? Prisma.DbNull) as Prisma.InputJsonValue,
      invoiceNumber: `INV-${number.replace(/\D/g, "")}`,
      items: {
        create: src.items.map((it) => ({
          productId: it.productId, nameSnapshot: it.nameSnapshot, skuSnapshot: it.skuSnapshot,
          imageSnapshot: it.imageSnapshot, colour: it.colour, variant: it.variant, size: it.size,
          unitCents: it.unitCents, quantity: it.quantity, discountCents: it.discountCents, lineCents: it.lineCents,
        })),
      },
      events: { create: [{ kind: "SYSTEM", label: `Duplicated from ${src.number}`, staffName: staff.name }] },
    },
  });
  await db.auditLog.create({ data: { actorName: staff.name, action: "Duplicated order", targetType: "Order", targetId: created.number, meta: { from: src.number } } });
  revalidatePath("/admin/orders");
  redirect(`/admin/orders/${created.number}`);
}

export async function createManualOrder(formData: FormData) {
  const staff = await requireStaff();
  const name = str(formData, "customerName");
  const email = str(formData, "email");
  if (!name) return { error: "Customer name is required." };

  let lines: { productId: string; qty: number }[] = [];
  try {
    lines = JSON.parse(str(formData, "items") || "[]");
  } catch {
    lines = [];
  }
  lines = lines.filter((l) => l.productId && l.qty > 0);
  if (!lines.length) return { error: "Add at least one product." };

  const products = await db.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) } },
    include: { images: { take: 1, orderBy: { position: "asc" }, select: { url: true } } },
  });

  const items = lines.map((l) => {
    const p = products.find((x) => x.id === l.productId)!;
    return {
      productId: p.id, nameSnapshot: p.name, skuSnapshot: p.sku, imageSnapshot: p.images[0]?.url ?? null,
      colour: p.colour ?? null, unitCents: p.priceCents, quantity: l.qty, lineCents: p.priceCents * l.qty,
    };
  });
  const subtotal = items.reduce((s, i) => s + i.lineCents, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : 995;
  const tax = Math.round(subtotal * GST_RATE);
  const total = subtotal + shipping + tax;

  const user = email ? await db.user.findUnique({ where: { email }, select: { id: true } }) : null;
  const number = await nextOrderNumber();
  const created = await db.order.create({
    data: {
      number,
      userId: user?.id ?? null,
      guestEmail: user ? null : email || null,
      customerName: name,
      status: (str(formData, "status") || "PROCESSING") as OrderStatus,
      paymentStatus: (str(formData, "paymentStatus") || "PAID") as PaymentStatus,
      paymentMethod: (str(formData, "paymentMethod") || "BANK_TRANSFER") as PaymentMethod,
      subtotalCents: subtotal, shippingCents: shipping, taxCents: tax, totalCents: total,
      salesChannel: "Manual",
      invoiceNumber: `INV-${number.replace(/\D/g, "")}`,
      shippingMethod: shipping === 0 ? "Free Express Shipping" : "Standard Shipping",
      shippingSnapshot: {
        fullName: name, company: str(formData, "company") || null,
        line1: str(formData, "line1"), line2: str(formData, "line2") || null,
        city: str(formData, "city"), region: str(formData, "region"),
        postalCode: str(formData, "postalCode"), country: str(formData, "country") || "Australia",
        phone: str(formData, "phone") || null,
      } as Prisma.InputJsonValue,
      items: { create: items },
      events: { create: [{ kind: "SYSTEM", label: "Manual order created", staffName: staff.name }] },
    },
  });
  await db.auditLog.create({ data: { actorName: staff.name, action: "Created manual order", targetType: "Order", targetId: created.number } });
  revalidatePath("/admin/orders");
  redirect(`/admin/orders/${created.number}`);
}

export async function bulkOrderAction(ids: string[], action: string, value?: string) {
  const staff = await requireStaff();
  if (!ids.length) return { error: "No orders selected." };
  const orders = await db.order.findMany({ where: { id: { in: ids } }, select: { id: true } });

  if (action === "status" && value) {
    await db.order.updateMany({ where: { id: { in: ids } }, data: { status: value as OrderStatus } });
    for (const o of orders) await logEvent(o.id, "STATUS", `Bulk status → ${label(value)}`, null, staff.name);
  } else if (action === "archive") {
    await db.order.updateMany({ where: { id: { in: ids } }, data: { archivedAt: new Date() } });
  } else if (action === "unarchive") {
    await db.order.updateMany({ where: { id: { in: ids } }, data: { archivedAt: null } });
  } else if (action === "assign" && value) {
    await db.order.updateMany({ where: { id: { in: ids } }, data: { assignedToName: value } });
  } else {
    return { error: "Unknown bulk action." };
  }
  await db.auditLog.create({ data: { actorName: staff.name, action: `Bulk ${action}`, targetType: "Order", meta: { count: ids.length, value } } });
  revalidatePath("/admin/orders");
  return { ok: true as const, count: ids.length };
}
