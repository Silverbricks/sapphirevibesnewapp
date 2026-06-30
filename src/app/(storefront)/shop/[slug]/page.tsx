import { notFound } from "next/navigation";
import { getProducts } from "@/lib/data/products";
import { getCategoryBySlug } from "@/lib/data/catalog";
import { Listing, parseSort } from "@/components/storefront/Listing";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return { title: category?.name ?? "Shop" };
}

export default async function ShopCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const { sort } = await searchParams;
  const [category, products] = await Promise.all([
    getCategoryBySlug(slug),
    getProducts({ categorySlug: slug, sort: parseSort(sort) }),
  ]);
  if (!category) notFound();
  return (
    <Listing
      eyebrow="Shop"
      title={category.name}
      subtitle={category.description ?? undefined}
      products={products}
    />
  );
}
