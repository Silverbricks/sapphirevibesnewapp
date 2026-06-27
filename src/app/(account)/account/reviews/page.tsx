import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { getUserReviewsData } from "@/lib/data/account";
import { RatingStars, buttonClasses } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Reviews" };

export default async function MyReviewsPage() {
  const user = await requireUser();
  const { reviews, pending } = await getUserReviewsData(user.id);

  return (
    <div>
      <h1 className="font-serif text-[34px]">My Reviews</h1>
      <p className="mb-7 text-[13px] text-muted">Reviews you&apos;ve written, and products waiting for your feedback.</p>

      {pending.map((p) => (
        <div key={p.productId} className="mb-3.5 flex flex-wrap items-center justify-between gap-3 rounded-card border border-dashed border-line-gold bg-card p-[22px]">
          <div className="flex items-center gap-3.5">
            {p.imageSnapshot && (
              <Image src={p.imageSnapshot} alt={p.nameSnapshot} width={50} height={50} className="h-[50px] w-[50px] rounded-[9px] object-cover" />
            )}
            <div>
              <div className="text-sm">{p.nameSnapshot}</div>
              <div className="text-xs text-muted">Delivered {formatDate(p.order.placedAt)} · earn 75 points for a photo review</div>
            </div>
          </div>
          <Link href={p.product ? `/products/${p.product.slug}` : "#"} className={buttonClasses("gold", "sm")}>
            Write Review
          </Link>
        </div>
      ))}

      {reviews.map((r) => (
        <div key={r.id} className="mb-3.5 rounded-card border border-line bg-card p-[22px]">
          <div className="mb-3 flex items-center gap-3.5">
            {r.product.images[0]?.url && (
              <Image src={r.product.images[0].url} alt={r.product.name} width={50} height={50} className="h-[50px] w-[50px] rounded-[9px] object-cover" />
            )}
            <div>
              <div className="text-sm">{r.product.name}</div>
              <RatingStars rating={r.rating} />
              <div className="text-xs text-muted">Reviewed {formatDate(r.createdAt)} · {r.helpfulCount} found this helpful</div>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-grey">{r.body}</p>
          {r.photos.length > 0 && (
            <div className="mt-3 flex gap-2">
              {r.photos.map((ph) => (
                <Image key={ph.id} src={ph.url} alt="" width={60} height={60} className="h-[60px] w-[60px] rounded-lg object-cover" />
              ))}
            </div>
          )}
        </div>
      ))}

      {reviews.length === 0 && pending.length === 0 && (
        <p className="text-sm text-muted">No reviews or pending items yet.</p>
      )}
    </div>
  );
}
