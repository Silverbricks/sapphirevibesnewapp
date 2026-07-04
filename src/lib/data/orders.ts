import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client";

const REVENUE_OK = { status: { notIn: ["CANCELLED", "REFUNDED"] as OrderStatus[] } };

export async function getOrdersDashboard() {
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [statusGroups, paymentFailed, revToday, revMonth, aov, todayCount, totalCount, archivedCount, returnsCount, topCustomers, bestSellers, byUser] =
    await Promise.all([
      db.order.groupBy({ by: ["status"], _count: { _all: true } }),
      db.order.count({ where: { paymentStatus: "FAILED" } }),
      db.order.aggregate({ _sum: { totalCents: true }, where: { placedAt: { gte: startToday }, ...REVENUE_OK } }),
      db.order.aggregate({ _sum: { totalCents: true }, where: { placedAt: { gte: startMonth }, ...REVENUE_OK } }),
      db.order.aggregate({ _avg: { totalCents: true }, where: REVENUE_OK }),
      db.order.count({ where: { placedAt: { gte: startToday } } }),
      db.order.count(),
      db.order.count({ where: { archivedAt: { not: null } } }),
      db.return.count(),
      db.order.groupBy({ by: ["customerName"], _sum: { totalCents: true }, _count: { _all: true }, where: REVENUE_OK, orderBy: { _sum: { totalCents: "desc" } }, take: 5 }),
      db.orderItem.groupBy({ by: ["nameSnapshot"], _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
      db.order.groupBy({ by: ["userId"], _count: { _all: true }, where: { userId: { not: null } } }),
    ]);

  const byStatus: Record<string, number> = {};
  for (const g of statusGroups) byStatus[g.status] = g._count._all;

  return {
    byStatus,
    totalCount,
    todayCount,
    archivedCount,
    paymentFailed,
    returnsCount,
    revenueTodayCents: revToday._sum.totalCents ?? 0,
    revenueMonthCents: revMonth._sum.totalCents ?? 0,
    aovCents: Math.round(aov._avg.totalCents ?? 0),
    repeatCustomers: byUser.filter((g) => g._count._all > 1).length,
    topCustomers: topCustomers.map((c) => ({ name: c.customerName, spendCents: c._sum.totalCents ?? 0, orders: c._count._all })),
    bestSellers: bestSellers.map((b) => ({ name: b.nameSnapshot, qty: b._sum.quantity ?? 0 })),
  };
}

export interface OrderFilters {
  q?: string;
  status?: string; // OrderStatus | "all" | "ARCHIVED" | "FAILED_PAYMENT"
  paymentMethod?: string;
  shippingMethod?: string;
  state?: string;
  country?: string;
  customer?: string; // has_email | missing_email | has_mobile | missing_mobile | business | individual | vip | repeat
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}

const PER_PAGE = 25;

export async function getOrders(f: OrderFilters = {}) {
  const where: Prisma.OrderWhereInput = {};
  const and: Prisma.OrderWhereInput[] = [];

  // customer-based filters (contact/segment)
  switch (f.customer) {
    case "has_email": and.push({ OR: [{ user: { email: { not: "" } } }, { guestEmail: { not: null } }] }); break;
    case "missing_email": and.push({ userId: null, guestEmail: null }); break;
    case "has_mobile": and.push({ user: { phone: { not: null } } }); break;
    case "missing_mobile": and.push({ OR: [{ userId: null }, { user: { phone: null } }] }); break;
    case "business": and.push({ user: { OR: [{ company: { not: null } }, { customerType: { in: ["CORPORATE", "TRADE"] } }] } }); break;
    case "individual": and.push({ user: { customerType: { in: ["RETAIL", "VIP"] } } }); break;
    case "vip": and.push({ user: { customerType: "VIP" } }); break;
    case "repeat": {
      const grouped = await db.order.groupBy({ by: ["userId"], _count: { _all: true }, where: { userId: { not: null } } });
      const ids = grouped.filter((g) => g._count._all > 1).map((g) => g.userId as string);
      and.push({ userId: { in: ids.length ? ids : ["__none__"] } });
      break;
    }
  }

  // Archived is orthogonal to fulfilment status.
  if (f.status === "ARCHIVED") where.archivedAt = { not: null };
  else where.archivedAt = null;

  if (f.status === "FAILED_PAYMENT") {
    where.paymentStatus = "FAILED";
  } else if (f.status && f.status !== "all" && f.status !== "ARCHIVED") {
    where.status = f.status as OrderStatus;
  }

  if (f.paymentMethod) where.paymentMethod = f.paymentMethod as PaymentMethod;
  if (f.shippingMethod) where.shippingMethod = f.shippingMethod;
  if (f.state) and.push({ shippingSnapshot: { path: ["region"], equals: f.state } });
  if (f.country) and.push({ shippingSnapshot: { path: ["country"], equals: f.country } });

  if (f.dateFrom || f.dateTo) {
    where.placedAt = {};
    if (f.dateFrom) where.placedAt.gte = new Date(f.dateFrom);
    if (f.dateTo) {
      const to = new Date(f.dateTo);
      to.setHours(23, 59, 59, 999);
      where.placedAt.lte = to;
    }
  }

  const q = f.q?.trim();
  if (q) {
    const like = { contains: q, mode: "insensitive" as const };
    where.OR = [
      { number: like },
      { customerName: like },
      { guestEmail: like },
      { trackingNumber: like },
      { invoiceNumber: like },
      { user: { email: like } },
      { user: { phone: like } },
      { user: { company: like } },
      { items: { some: { OR: [{ skuSnapshot: like }, { nameSnapshot: like }] } } },
    ];
  }

  if (and.length) where.AND = and;

  const page = Math.max(1, f.page ?? 1);
  const perPage = f.perPage ?? PER_PAGE;

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { placedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        _count: { select: { items: true } },
        user: { select: { id: true, phone: true, email: true, company: true } },
      },
    }),
    db.order.count({ where }),
  ]);

  return { orders, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getOrderDetail(number: string) {
  return db.order.findUnique({
    where: { number },
    include: {
      items: true,
      shippingAddress: true,
      coupon: true,
      user: {
        select: {
          id: true, name: true, email: true, phone: true, alternatePhone: true,
          company: true, abn: true, notes: true, customerType: true,
        },
      },
      events: { orderBy: { createdAt: "desc" } },
      returns: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getCustomerProfile(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, alternatePhone: true, company: true, abn: true, notes: true, customerType: true, pointsBalance: true, createdAt: true },
  });
  if (!user) return null;
  const [agg, orders] = await Promise.all([
    db.order.aggregate({ _sum: { totalCents: true }, _count: { _all: true }, where: { userId, status: { notIn: ["CANCELLED", "REFUNDED"] } } }),
    db.order.findMany({
      where: { userId },
      orderBy: { placedAt: "desc" },
      take: 6,
      select: { number: true, totalCents: true, status: true, placedAt: true, shippingSnapshot: true, billingSnapshot: true, billingSameAsShipping: true },
    }),
  ]);
  const latest = orders[0];
  return {
    ...user,
    totalSpendCents: agg._sum.totalCents ?? 0,
    orderCount: agg._count._all,
    recentOrders: orders.map((o) => ({ number: o.number, totalCents: o.totalCents, status: o.status, placedAt: o.placedAt })),
    shipping: (latest?.shippingSnapshot ?? null) as Record<string, string> | null,
    billing: (latest?.billingSameAsShipping ? latest?.shippingSnapshot : latest?.billingSnapshot ?? null) as Record<string, string> | null,
  };
}

export type CustomerProfile = NonNullable<Awaited<ReturnType<typeof getCustomerProfile>>>;

/** Orders ready to pick/pack (for the printable dispatch list). */
export async function getDispatchList() {
  return db.order.findMany({
    where: { archivedAt: null, status: { in: ["PACKED", "READY_FOR_DISPATCH"] } },
    orderBy: { placedAt: "asc" },
    include: { items: true },
  });
}
