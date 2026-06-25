import { db } from "@/lib/db";

export async function getTopCategories() {
  return db.category.findMany({
    where: { parentId: null },
    orderBy: { displayOrder: "asc" },
    include: {
      children: { orderBy: { name: "asc" } },
      _count: { select: { products: { where: { status: "ACTIVE" } } } },
    },
  });
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({
    where: { slug },
    include: { children: true, parent: true },
  });
}

export async function getFeaturedCollections(limit?: number) {
  return db.collection.findMany({
    where: { isFeatured: true },
    orderBy: { displayOrder: "asc" },
    take: limit,
    include: { _count: { select: { products: true } } },
  });
}

export async function getAllCollections() {
  return db.collection.findMany({
    orderBy: { displayOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function getCollectionBySlug(slug: string) {
  return db.collection.findUnique({ where: { slug } });
}

export async function getBrands() {
  return db.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

/** Distinct room values present on active products (for the room filter). */
export async function getRoomsWithCounts() {
  const grouped = await db.product.groupBy({
    by: ["room"],
    where: { status: "ACTIVE", room: { not: null } },
    _count: { _all: true },
  });
  return grouped
    .filter((g) => g.room)
    .map((g) => ({ room: g.room as string, count: g._count._all }));
}

export async function getShopTheLook() {
  return db.shopTheLook.findFirst({
    include: {
      products: {
        select: {
          id: true,
          name: true,
          slug: true,
          priceCents: true,
          images: { take: 1, orderBy: { position: "asc" }, select: { url: true } },
        },
      },
    },
  });
}
