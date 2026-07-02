import Link from "next/link";
import { getCategoryMenu } from "@/lib/data/catalog";
import { CategoryTiles } from "@/components/storefront/CategoryTiles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shop by Category" };

export default async function ShopIndexPage() {
  const categories = await getCategoryMenu();

  return (
    <div className="py-16">
      <div className="wrap">
        <span className="eyebrow">Browse the Range</span>
        <h1 className="mb-10 font-serif text-[clamp(34px,5vw,56px)] leading-tight">Shop by Category</h1>

        <CategoryTiles categories={categories} limit={100} />

        <div className="mt-16 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-line pt-12 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <div key={c.slug}>
              <Link href={`/shop/${c.slug}`} className="font-serif text-lg text-cream transition-colors hover:text-gold">{c.name}</Link>
              {c.children.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  {c.children.map((ch) => (
                    <Link key={ch.slug} href={`/shop/${ch.slug}`} className="text-sm text-muted transition-colors hover:text-cream">{ch.name}</Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
