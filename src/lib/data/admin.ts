import { db } from "@/lib/db";
import { OrderStatus, Role } from "@prisma/client";

const NON_CANCELLED = {
  status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] },
};
const CUSTOMER_ROLES: Role[] = [Role.CUSTOMER, Role.INTERIOR_DESIGNER, Role.CORPORATE];
const STAFF_ROLES_LIST: Role[] = [
  Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY_MANAGER, Role.CATALOGUE_MANAGER,
  Role.CONTENT_EDITOR, Role.ORDER_FULFILMENT, Role.MARKETING_MANAGER,
  Role.FINANCE_MANAGER, Role.CUSTOMER_SUPPORT,
];

export async function getAdminDashboard() {
  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setDate(now.getDate() - 30);
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);

  const [
    rev30,
    revToday,
    ordersCount,
    pending,
    completed,
    cancelled,
    totalProducts,
    lowStock,
    outStock,
    totalCustomers,
    newCustomers,
    topProducts,
    recentOrders,
  ] = await Promise.all([
    db.order.aggregate({ _sum: { totalCents: true }, where: { placedAt: { gte: monthAgo }, ...NON_CANCELLED } }),
    db.order.aggregate({ _sum: { totalCents: true }, where: { placedAt: { gte: startToday }, ...NON_CANCELLED } }),
    db.order.count(),
    db.order.count({ where: { status: { in: ["PENDING", "PROCESSING", "PACKED"] } } }),
    db.order.count({ where: { status: "DELIVERED" } }),
    db.order.count({ where: { status: "CANCELLED" } }),
    db.product.count(),
    db.product.count({ where: { stock: { gt: 0, lte: 10 } } }),
    db.product.count({ where: { stock: 0 } }),
    db.user.count({ where: { role: { in: [...CUSTOMER_ROLES] } } }),
    db.user.count({ where: { role: { in: [...CUSTOMER_ROLES] }, createdAt: { gte: weekAgo } } }),
    db.product.findMany({
      orderBy: { salesCount: "desc" },
      take: 4,
      select: { id: true, name: true, salesCount: true, priceCents: true, images: { take: 1, select: { url: true } } },
    }),
    db.order.findMany({
      orderBy: { placedAt: "desc" },
      take: 5,
      select: { id: true, number: true, customerName: true, totalCents: true, status: true, placedAt: true, _count: { select: { items: true } } },
    }),
  ]);

  return {
    revenue30Cents: rev30._sum.totalCents ?? 0,
    revenueTodayCents: revToday._sum.totalCents ?? 0,
    ordersCount,
    pending,
    completed,
    cancelled,
    totalProducts,
    lowStock,
    outStock,
    totalCustomers,
    newCustomers,
    topProducts,
    recentOrders,
  };
}

export async function getInventory() {
  return db.product.findMany({
    orderBy: { name: "asc" },
    include: {
      category: { select: { name: true } },
      images: { take: 1, orderBy: { position: "asc" }, select: { url: true } },
    },
  });
}

export async function getAdminProducts() {
  return db.product.findMany({
    orderBy: { salesCount: "desc" },
    include: { brand: { select: { name: true } }, category: { select: { name: true } }, images: { take: 1, select: { url: true } } },
  });
}

export async function getProductForEdit(id: string) {
  return db.product.findUnique({
    where: { id },
    include: { images: { orderBy: { position: "asc" } }, brand: true, category: true },
  });
}

export async function getAdminCategories() {
  return db.category.findMany({
    where: { parentId: null },
    orderBy: { displayOrder: "asc" },
    include: { children: { select: { name: true } }, _count: { select: { products: true } } },
  });
}

export async function getAdminCollections() {
  return db.collection.findMany({
    orderBy: { displayOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function getPriceRules() {
  return db.priceRule.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getAdminOrders(status?: string) {
  return db.order.findMany({
    where: status && status !== "all" ? { status: status as never } : undefined,
    orderBy: { placedAt: "desc" },
    include: { _count: { select: { items: true } } },
  });
}

export async function getAdminOrderDetail(number: string) {
  return db.order.findUnique({
    where: { number },
    include: { items: true, shippingAddress: true, user: { select: { email: true } } },
  });
}

export async function getAdminCustomers() {
  const customers = await db.user.findMany({
    where: { role: { in: [...CUSTOMER_ROLES] } },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true } },
      orders: { where: NON_CANCELLED, select: { totalCents: true } },
    },
  });
  const [total, trade, vipCorp] = await Promise.all([
    db.user.count({ where: { role: { in: [...CUSTOMER_ROLES] } } }),
    db.user.count({ where: { customerType: "TRADE" } }),
    db.user.count({ where: { customerType: { in: ["VIP", "CORPORATE"] } } }),
  ]);
  return {
    stats: { total, trade, vipCorp },
    customers: customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      type: c.customerType,
      orders: c._count.orders,
      ltvCents: c.orders.reduce((s, o) => s + o.totalCents, 0),
    })),
  };
}

export async function getAdminReviews(status?: string) {
  return db.review.findMany({
    where: status && status !== "all" ? { status: status as never } : undefined,
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true } }, user: { select: { name: true } } },
  });
}

export async function getTeamData() {
  const [staff, logs, logins] = await Promise.all([
    db.user.findMany({
      where: { role: { in: STAFF_ROLES_LIST } },
      orderBy: { lastActiveAt: "desc" },
      select: {
        id: true, name: true, email: true, role: true,
        twoFactorEnabled: true, suspended: true, permissions: true, lastActiveAt: true,
      },
    }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
    db.loginLog.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
  ]);
  return { staff, logs, logins };
}

export async function getContentData() {
  const [pages, posts] = await Promise.all([
    db.page.findMany({ orderBy: { title: "asc" } }),
    db.blogPost.findMany({ orderBy: { publishedAt: "desc" } }),
  ]);
  return { pages, posts };
}

export async function getSettingsData() {
  const [settings, integrations] = await Promise.all([
    db.setting.findMany(),
    db.integration.findMany({ orderBy: { name: "asc" } }),
  ]);
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value])) as Record<string, unknown>;
  return { settings: map, integrations };
}

export async function getAdminReports() {
  const [units, returns, totalOrders, repeatBuyers, ytdRevenue] = await Promise.all([
    db.orderItem.aggregate({ _sum: { quantity: true } }),
    db.order.count({ where: { status: { in: ["RETURNED", "REFUNDED"] } } }),
    db.order.count(),
    db.order.groupBy({ by: ["userId"], where: { userId: { not: null } }, _count: { _all: true }, having: { userId: { _count: { gt: 1 } } } }),
    db.order.aggregate({ _sum: { totalCents: true }, where: NON_CANCELLED }),
  ]);
  return {
    ytdRevenueCents: ytdRevenue._sum.totalCents ?? 0,
    unitsSold: units._sum.quantity ?? 0,
    returnRate: totalOrders ? (returns / totalOrders) * 100 : 0,
    repeatBuyers: repeatBuyers.length,
  };
}
