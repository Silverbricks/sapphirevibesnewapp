import Link from "next/link";
import { getAdminReviews } from "@/lib/data/admin";
import { Panel, Pill, Avatar, RatingStars, type PillColor } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { ReviewModeration } from "@/components/admin/ReviewModeration";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reviews · Admin" };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "PUBLISHED", label: "Published" },
  { key: "FLAGGED", label: "Flagged" },
];

const STATUS_COLOR: Record<string, PillColor> = {
  PUBLISHED: "green",
  PENDING: "amber",
  FLAGGED: "red",
  REJECTED: "grey",
};

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "all" } = await searchParams;
  const reviews = await getAdminReviews(status);

  return (
    <>
      <PageHead title="Reviews & Q&A" subtitle="Moderate customer reviews and ratings." />

      <div className="mb-[18px] flex flex-wrap gap-2.5">
        {FILTERS.map((f) => (
          <Link key={f.key} href={`/admin/reviews?status=${f.key}`} className={`fchip ${status === f.key ? "fchip-on" : ""}`}>
            {f.label}
          </Link>
        ))}
      </div>

      <Panel>
        {reviews.length === 0 && <p className="text-sm text-muted">No reviews in this view.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-4 border-b border-line py-3.5 last:border-0">
            <div className="flex items-center gap-3">
              <Avatar name={r.authorName} size={38} />
              <div>
                <div className="flex items-center gap-2 text-sm">
                  {r.authorName} <RatingStars rating={r.rating} />
                </div>
                <div className="text-[11px] text-muted">{r.product.name} — {r.body}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Pill color={STATUS_COLOR[r.status] ?? "grey"}>{r.status.charAt(0) + r.status.slice(1).toLowerCase()}</Pill>
              <ReviewModeration id={r.id} />
            </div>
          </div>
        ))}
      </Panel>
    </>
  );
}
