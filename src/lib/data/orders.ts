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
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}

const PER_PAGE = 25;

export async function getOrders(f: OrderFilters = {}) {
  const where: Prisma.OrderWhereInput = {};
  const and: Prisma.OrderWhereInput[] = [];

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
        user: { select: { phone: true, email: true } },
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

/** Orders ready to pick/pack (for the printable dispatch list). */
export async function getDispatchList() {
  return db.order.findMany({
    where: { archivedAt: null, status: { in: ["PACKED", "READY_FOR_DISPATCH"] } },
    orderBy: { placedAt: "asc" },
    include: { items: true },
  });
}
