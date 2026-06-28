import { db } from "@/lib/db";

export async function getPromotions() {
  return db.promotion.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getCouponsData() {
  const coupons = await db.coupon.findMany({ orderBy: { usedCount: "desc" } });
  return {
    coupons,
    activeCount: coupons.filter((c) => c.isActive).length,
    totalRedemptions: coupons.reduce((s, c) => s + c.usedCount, 0),
  };
}

export async function getEmailData() {
  const [campaigns, automations, segments, subscriberCount] = await Promise.all([
    db.emailCampaign.findMany({ orderBy: { createdAt: "desc" } }),
    db.emailAutomation.findMany({ orderBy: { createdAt: "asc" } }),
    db.segment.findMany({ orderBy: { count: "desc" } }),
    db.subscriber.count(),
  ]);
  return { campaigns, automations, segments, subscriberCount };
}

export async function getLoyaltyData() {
  const [earn, redeem, members, pointsAgg] = await Promise.all([
    db.loyaltyEarnRule.findMany({ orderBy: { order: "asc" } }),
    db.loyaltyRedeemOption.findMany({ orderBy: { order: "asc" } }),
    db.user.count({ where: { pointsBalance: { gt: 0 } } }),
    db.rewardTransaction.aggregate({ _sum: { points: true }, where: { points: { gt: 0 } } }),
  ]);
  return { earn, redeem, members, pointsIssued: pointsAgg._sum.points ?? 0 };
}

export async function getVipTiersData() {
  const tiers = await db.vipTier.findMany({ orderBy: { order: "asc" } });
  const counts = await db.user.groupBy({ by: ["vipTierId"], _count: { _all: true } });
  const countMap = new Map(counts.map((c) => [c.vipTierId, c._count._all]));
  return tiers.map((t) => ({ ...t, members: countMap.get(t.id) ?? 0 }));
}

export async function getReferralLeaderboard() {
  const referrals = await db.referral.findMany({
    include: { referrer: { select: { name: true } } },
  });
  const byReferrer = new Map<string, { name: string; invites: number; converted: number; rewardCents: number }>();
  for (const r of referrals) {
    const key = r.referrerId;
    const entry = byReferrer.get(key) ?? { name: r.referrer.name ?? "—", invites: 0, converted: 0, rewardCents: 0 };
    entry.invites += 1;
    if (r.status === "CONVERTED") {
      entry.converted += 1;
      entry.rewardCents += r.rewardCents;
    }
    byReferrer.set(key, entry);
  }
  const leaderboard = [...byReferrer.values()].sort((a, b) => b.converted - a.converted).slice(0, 8);
  return {
    leaderboard,
    totalReferrers: byReferrer.size,
    invitations: referrals.length,
    converted: referrals.filter((r) => r.status === "CONVERTED").length,
  };
}

export async function getGiftCardsData() {
  const cards = await db.giftCard.findMany({ orderBy: { createdAt: "desc" } });
  return {
    cards,
    outstandingCents: cards.reduce((s, c) => s + c.balanceCents, 0),
    soldCount: cards.length,
  };
}

export async function getSegmentsData() {
  return db.segment.findMany({ orderBy: { count: "desc" } });
}

export async function getIntegrationsGrouped() {
  const integrations = await db.integration.findMany({ orderBy: { name: "asc" } });
  const groups = new Map<string, typeof integrations>();
  for (const i of integrations) {
    const list = groups.get(i.category) ?? [];
    list.push(i);
    groups.set(i.category, list);
  }
  return [...groups.entries()].map(([category, items]) => ({ category, items }));
}

export async function getGrowthHub() {
  const [marketingRev, loyaltyMembers, promotions, campaigns] = await Promise.all([
    db.order.aggregate({ _sum: { totalCents: true }, where: { couponId: { not: null } } }),
    db.user.count({ where: { pointsBalance: { gt: 0 } } }),
    db.promotion.findMany({ where: { status: "LIVE" }, orderBy: { redemptions: "desc" }, take: 4 }),
    db.emailCampaign.findMany({ where: { status: "SENT" }, orderBy: { openRate: "desc" }, take: 4 }),
  ]);
  return {
    marketingRevCents: marketingRev._sum.totalCents ?? 0,
    loyaltyMembers,
    promotions,
    campaigns,
  };
}
