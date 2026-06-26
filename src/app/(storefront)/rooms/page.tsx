import { SectionHead, ShopByRoom } from "@/components/storefront/sections";

export const metadata = { title: "Shop by Room" };

export default function RoomsPage() {
  return (
    <section className="py-16">
      <div className="wrap">
        <SectionHead eyebrow="Curated Spaces" title="Shop by Room" />
        <ShopByRoom />
      </div>
    </section>
  );
}
