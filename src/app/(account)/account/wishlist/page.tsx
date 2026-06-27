import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { getUserWishlist } from "@/lib/data/account";
import { EmptyState, buttonClasses } from "@/components/ui";
import { WishlistGrid } from "@/components/account/WishlistGrid";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const user = await requireUser();
  const products = await getUserWishlist(user.id);

  return (
    <div>
      <h1 className="font-serif text-[34px]">Wishlist</h1>
      <p className="mb-7 text-[13px] text-muted">
        {products.length} saved {products.length === 1 ? "piece" : "pieces"}. Move them to your cart whenever you&apos;re ready.
      </p>
      {products.length > 0 ? (
        <WishlistGrid products={products} />
      ) : (
        <EmptyState
          title="Your wishlist is empty"
          description="Tap the heart on any product to save it here."
          action={<Link href="/new-arrivals" className={buttonClasses("gold", "lg")}>Browse Products</Link>}
        />
      )}
    </div>
  );
}
