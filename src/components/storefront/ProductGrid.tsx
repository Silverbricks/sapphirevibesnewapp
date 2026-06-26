import { ProductCard } from "./ProductCard";
import type { ProductCardData } from "@/lib/data/products";
import { cn } from "@/lib/utils";

export function ProductGrid({
  products,
  className,
}: {
  products: ProductCardData[];
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-5 lg:grid-cols-4", className)}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
