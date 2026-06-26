import { getProducts } from "@/lib/data/products";
import { Listing, parseSort } from "@/components/storefront/Listing";

export const dynamic = "force-dynamic";

function titleCase(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: titleCase(slug) };
}

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const { sort } = await searchParams;
  const room = titleCase(slug);
  const products = await getProducts({ room, sort: parseSort(sort) });
  return (
    <Listing
      eyebrow="Shop by Room"
      title={room}
      subtitle={`Curated pieces for the ${room.toLowerCase()}.`}
      products={products}
    />
  );
}
