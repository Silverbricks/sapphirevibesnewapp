import { ProductGrid } from "./ProductGrid";
import { SortSelect } from "./SortSelect";
import { EmptyState } from "@/components/ui";
import type { ProductCardData } from "@/lib/data/products";

export function Listing({
  eyebrow,
  title,
  subtitle,
  products,
  showSort = true,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  products: ProductCardData[];
  showSort?: boolean;
}) {
  return (
    <section className="py-16">
      <div className="wrap">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h1 className="text-[clamp(34px,4.6vw,52px)]">{title}</h1>
            {subtitle && <p className="mt-1 max-w-xl text-sm text-muted">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">{products.length} items</span>
            {showSort && <SortSelect />}
          </div>
        </div>
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <EmptyState
            title="Nothing here just yet"
            description="New pieces are added often — check back soon."
          />
        )}
      </div>
    </section>
  );
}

export type SortParam = "newest" | "popular" | "price_asc" | "price_desc";
export function parseSort(value?: string): SortParam {
  if (value === "popular" || value === "price_asc" || value === "price_desc")
    return value;
  return "newest";
}
