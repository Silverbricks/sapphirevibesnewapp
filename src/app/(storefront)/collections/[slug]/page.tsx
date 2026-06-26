import { notFound } from "next/navigation";
import { getProducts } from "@/lib/data/products";
import { getCollectionBySlug } from "@/lib/data/catalog";
import { Listing, parseSort } from "@/components/storefront/Listing";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  return { title: collection?.name ?? "Collection" };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const { sort } = await searchParams;
  const [collection, products] = await Promise.all([
    getCollectionBySlug(slug),
    getProducts({ collectionSlug: slug, sort: parseSort(sort) }),
  ]);
  if (!collection) notFound();
  return (
    <Listing
      eyebrow="Collection"
      title={collection.name}
      subtitle={collection.description ?? undefined}
      products={products}
    />
  );
}
