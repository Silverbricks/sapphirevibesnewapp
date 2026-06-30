import Link from "next/link";
import { getCommentsForModeration } from "@/lib/data/content";
import { PageHead } from "@/components/admin/PageHead";
import { CommentModeration } from "@/components/admin/CommentModeration";

export const dynamic = "force-dynamic";
export const metadata = { title: "Comments · Admin" };

const FILTERS = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "", label: "All" },
];

export default async function CommentsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = status ?? "PENDING";
  const comments = await getCommentsForModeration(active || undefined);

  return (
    <>
      <Link href="/admin/content" className="mb-4 inline-block text-xs uppercase tracking-[0.12em] text-gold">← Content CMS</Link>
      <PageHead title="Comments" subtitle="Approve or reject reader comments before they appear on articles." />
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.label}
            href={f.key ? `/admin/content/comments?status=${f.key}` : "/admin/content/comments?status="}
            className={`fchip ${active === f.key ? "fchip-on" : ""}`}
          >
            {f.label}
          </Link>
        ))}
      </div>
      <CommentModeration comments={comments} />
    </>
  );
}
