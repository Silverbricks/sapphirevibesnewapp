import { getProducts } from "@/lib/data/products";
import { Listing, parseSort } from "@/components/storefront/Listing";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gifts" };

export default async function GiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const products = await getProducts({ collectionSlug: "gifts-under-100", sort: parseSort(sort) });
  return (
    <Listing
      eyebrow="The Gift Edit"
      title="Gifts Under $100"
      subtitle="Thoughtfully curated pieces for every reason to celebrate."
      products={products}
    />
  );
}
