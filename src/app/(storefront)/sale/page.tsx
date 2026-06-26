import { getProducts } from "@/lib/data/products";
import { Listing, parseSort } from "@/components/storefront/Listing";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sale" };

export default async function SalePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const products = await getProducts({ onSale: true, sort: parseSort(sort) });
  return (
    <Listing
      eyebrow="Last Chance"
      title="Sale"
      subtitle="Limited-time pricing on selected pieces."
      products={products}
    />
  );
}
