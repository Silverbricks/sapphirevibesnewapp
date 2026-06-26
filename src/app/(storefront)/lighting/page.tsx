import { getProducts } from "@/lib/data/products";
import { Listing, parseSort } from "@/components/storefront/Listing";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lighting" };

export default async function LightingPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const products = await getProducts({ categorySlug: "lighting", sort: parseSort(sort) });
  return (
    <Listing
      eyebrow="Signature Series"
      title="Lighting"
      subtitle="Hand-finished chandeliers, pendants and lamps in brass, alabaster and glass."
      products={products}
    />
  );
}
