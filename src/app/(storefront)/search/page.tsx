import { Search } from "lucide-react";
import { getProducts } from "@/lib/data/products";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { EmptyState } from "@/components/ui";
import { parseSort } from "@/components/storefront/Listing";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const { q, sort } = await searchParams;
  const query = (q ?? "").trim();
  const products = query ? await getProducts({ search: query, sort: parseSort(sort) }) : [];

  return (
    <section className="py-16">
      <div className="wrap">
        <span className="eyebrow">Smart Search</span>
        <h1 className="mb-6 text-[clamp(34px,4.6vw,52px)]">Search</h1>
        <form action="/search" method="get" className="mb-10 flex max-w-xl items-center gap-3 rounded-lg border border-line bg-panel px-4 py-3">
          <Search className="h-5 w-5 text-muted" strokeWidth={1.5} />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search products, brands, SKU…"
            className="w-full bg-transparent text-sm text-cream outline-none placeholder:text-muted"
            autoFocus
          />
          <button type="submit" className="text-xs uppercase tracking-[0.12em] text-gold">
            Search
          </button>
        </form>

        {query ? (
          products.length > 0 ? (
            <>
              <p className="mb-6 text-sm text-muted">
                {products.length} result{products.length === 1 ? "" : "s"} for “{query}”
              </p>
              <ProductGrid products={products} />
            </>
          ) : (
            <EmptyState
              title={`No results for “${query}”`}
              description="Try a different search term, brand or category."
            />
          )
        ) : (
          <p className="text-sm text-muted">Start typing to search our collection.</p>
        )}
      </div>
    </section>
  );
}
