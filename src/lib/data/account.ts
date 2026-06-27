import { db } from "@/lib/db";
import { productCardSelect } from "./products";

const ACTIVE_STATUSES = ["PENDING", "PROCESSING", "PACKED", "SHIPPED", "IN_TRANSIT"] as const;

export async function getAccountSummary(userId: string) {
  const [totalOrders, inProgress, spendAgg, user] = await Promise.all([
    db.order.count({ where: { userId } }),
    db.order.count({ where: { userId, status: { in: [...ACTIVE_STATUSES] } } }),
    db.order.aggregate({
      where: { userId, status: { notIn: ["CANCELLED", "REFUNDED"] } },
      _sum: { totalCents: true },
    }),
    db.user.findUnique({ where: { id: userId }, select: { pointsBalance: true } }),
  ]);
  return {
    totalOrders,
    inProgress,
    lifetimeSpendCents: spendAgg._sum.totalCents ?? 0,
    points: user?.pointsBalance ?? 0,
  };
}

export async function getUserOrders(userId: string) {
  return db.order.findMany({
    where: { userId },
    orderBy: { placedAt: "desc" },
    include: { items: true },
  });
}

export type UserOrder = Awaited<ReturnType<typeof getUserOrders>>[number];

export async function getOrderDetail(userId: string, number: string) {
  return db.order.findFirst({
    where: { userId, number },
    include: { items: true, shippingAddress: true, coupon: true },
  });
}

export async function getLatestActiveOrder(userId: string) {
  return db.order.findFirst({
    where: { userId, status: { in: [...ACTIVE_STATUSES] } },
    orderBy: { placedAt: "desc" },
    include: { items: true },
  });
}

export async function getUserWishlist(userId: string) {
  const items = await db.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { product: { select: productCardSelect } },
  });
  return items.map((i) => i.product);
}

export async function getRewardsData(userId: string) {
  const [user, txns, tiers, spendAgg] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: { vipTier: true },
    }),
    db.rewardTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.vipTier.findMany({ orderBy: { order: "asc" } }),
    db.order.aggregate({
      where: { userId, status: { notIn: ["CANCELLED", "REFUNDED"] } },
      _sum: { totalCents: true },
    }),
  ]);
  return {
    user,
    txns,
    tiers,
    lifetimeSpendCents: spendAgg._sum.totalCents ?? 0,
  };
}

export async function getReferralData(userId: string) {
  const [user, referrals] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { referralCode: true, storeCreditCents: true, name: true },
    }),
    db.referral.findMany({ where: { referrerId: userId }, orderBy: { createdAt: "desc" } }),
  ]);
  const converted = referrals.filter((r) => r.status === "CONVERTED");
  return {
    referralCode: user?.referralCode ?? "FRIEND",
    storeCreditCents: user?.storeCreditCents ?? 0,
    referrals,
    invitesSent: referrals.length,
    joined: referrals.filter((r) => r.status !== "INVITED").length,
    creditEarnedCents: converted.reduce((s, r) => s + r.rewardCents, 0),
  };
}

export async function getGiftCentreData(userId: string) {
  const giftCards = await db.giftCard.findMany({
    where: { purchaserId: userId },
    orderBy: { createdAt: "desc" },
  });
  return { giftCards };
}

export async function getUserReviewsData(userId: string) {
  const reviews = await db.review.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      photos: true,
      product: { select: { name: true, slug: true, images: { take: 1, select: { url: true } } } },
    },
  });
  const reviewedProductIds = new Set(reviews.map((r) => r.productId));

  // delivered items not yet reviewed → awaiting review
  const deliveredItems = await db.orderItem.findMany({
    where: { order: { userId, status: "DELIVERED" }, productId: { not: null } },
    select: {
      productId: true,
      nameSnapshot: true,
      imageSnapshot: true,
      product: { select: { slug: true } },
      order: { select: { placedAt: true } },
    },
  });
  const pendingMap = new Map<string, (typeof deliveredItems)[number]>();
  for (const it of deliveredItems) {
    if (it.productId && !reviewedProductIds.has(it.productId) && !pendingMap.has(it.productId)) {
      pendingMap.set(it.productId, it);
    }
  }
  return { reviews, pending: [...pendingMap.values()] };
}

export async function getAddresses(userId: string) {
  return db.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });
}

export async function getUserProfile(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    include: { vipTier: true },
  });
}
