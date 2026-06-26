import { getProducts } from "@/lib/data/products";
import { Listing, parseSort } from "@/components/storefront/Listing";

export const dynamic = "force-dynamic";
export const metadata = { title: "New Arrivals" };

export default async function NewArrivalsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const products = await getProducts({ sort: parseSort(sort) });
  return (
    <Listing
      eyebrow="Fresh In"
      title="New Arrivals"
      subtitle="The latest pieces to land in store."
      products={products}
    />
  );
}
