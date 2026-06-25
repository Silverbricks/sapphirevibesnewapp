import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/** Fields needed to render a ProductCard. */
export const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  priceCents: true,
  compareCents: true,
  ratingAvg: true,
  ratingCount: true,
  badges: true,
  stock: true,
  brand: { select: { name: true } },
  images: {
    take: 1,
    orderBy: { position: "asc" },
    select: { url: true, alt: true },
  },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{
  select: typeof productCardSelect;
}>;

const ACTIVE = { status: "ACTIVE" } as const;

export async function getNewArrivals(limit = 4): Promise<ProductCardData[]> {
  return db.product.findMany({
    where: ACTIVE,
    orderBy: [{ createdAt: "desc" }, { name: "asc" }],
    take: limit,
    select: productCardSelect,
  });
}

export async function getBestSellers(limit = 4): Promise<ProductCardData[]> {
  return db.product.findMany({
    where: ACTIVE,
    orderBy: { salesCount: "desc" },
    take: limit,
    select: productCardSelect,
  });
}

export async function getSaleProducts(limit?: number): Promise<ProductCardData[]> {
  return db.product.findMany({
    where: { ...ACTIVE, compareCents: { not: null } },
    orderBy: { salesCount: "desc" },
    take: limit,
    select: productCardSelect,
  });
}

export async function getProductsByIds(ids: string[]): Promise<ProductCardData[]> {
  if (ids.length === 0) return [];
  const rows = await db.product.findMany({
    where: { id: { in: ids } },
    select: productCardSelect,
  });
  // preserve incoming order (recently-viewed)
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as ProductCardData[];
}

export interface ProductFilters {
  categorySlug?: string;
  room?: string;
  collectionSlug?: string;
  brandSlug?: string;
  onSale?: boolean;
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "popular";
  minPrice?: number;
  maxPrice?: number;
}

export async function getProducts(filters: ProductFilters = {}): Promise<ProductCardData[]> {
  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };

  if (filters.categorySlug) {
    where.category = {
      OR: [{ slug: filters.categorySlug }, { parent: { slug: filters.categorySlug } }],
    };
  }
  if (filters.room) where.room = filters.room;
  if (filters.collectionSlug)
    where.collections = { some: { slug: filters.collectionSlug } };
  if (filters.brandSlug) where.brand = { slug: filters.brandSlug };
  if (filters.onSale) where.compareCents = { not: null };
  if (filters.minPrice != null || filters.maxPrice != null) {
    where.priceCents = {
      gte: filters.minPrice ?? undefined,
      lte: filters.maxPrice ?? undefined,
    };
  }
  if (filters.search) {
    const q = filters.search;
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { brand: { name: { contains: q, mode: "insensitive" } } },
      { tags: { has: q.toLowerCase() } },
    ];
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    filters.sort === "price_asc"
      ? { priceCents: "asc" }
      : filters.sort === "price_desc"
        ? { priceCents: "desc" }
        : filters.sort === "popular"
          ? { salesCount: "desc" }
          : { createdAt: "desc" };

  return db.product.findMany({ where, orderBy, select: productCardSelect });
}

export async function searchProducts(query: string): Promise<ProductCardData[]> {
  if (!query.trim()) return [];
  return getProducts({ search: query.trim() });
}

export async function getProductBySlug(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      category: { select: { name: true, slug: true, parent: { select: { name: true, slug: true } } } },
      images: { orderBy: { position: "asc" } },
      collections: { select: { name: true, slug: true } },
      reviews: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        include: { photos: true },
      },
      questions: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export type ProductDetail = NonNullable<
  Awaited<ReturnType<typeof getProductBySlug>>
>;

export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit = 4,
): Promise<ProductCardData[]> {
  return db.product.findMany({
    where: { status: "ACTIVE", categoryId, id: { not: productId } },
    take: limit,
    orderBy: { salesCount: "desc" },
    select: productCardSelect,
  });
}

export async function getAllProductSlugs(): Promise<string[]> {
  const rows = await db.product.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}
