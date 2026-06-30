import Link from "next/link";
import { Pencil } from "lucide-react";
import { getAllBlogPosts } from "@/lib/data/content";
import { Panel, Pill, buttonClasses, type PillColor } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { RowDeleteButton } from "@/components/admin/RowDeleteButton";
import { deleteBlogPost } from "@/actions/content";
import { formatNumber, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Blog · Admin" };

const STATUS_COLOR: Record<string, PillColor> = { PUBLISHED: "green", DRAFT: "amber", SCHEDULED: "gold" };

export default async function BlogListPage() {
  const posts = await getAllBlogPosts();
  return (
    <>
      <Link href="/admin/content" className="mb-4 inline-block text-xs uppercase tracking-[0.12em] text-gold">← Content CMS</Link>
      <PageHead
        title="Blog Posts"
        subtitle="Write, schedule and publish articles."
        actions={<Link href="/admin/content/blog/new" className={buttonClasses("gold", "md")}>+ New Post</Link>}
      />
      <Panel className="overflow-x-auto">
        {posts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No posts yet — create your first article.</p>
        ) : (
          <table className="atable">
            <thead>
              <tr><th>Title</th><th>Status</th><th>Comments</th><th>Views</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/content/blog/${p.id}`} className="font-medium text-cream hover:text-gold">{p.title}</Link>
                    <div className="text-[11px] uppercase tracking-[0.12em] text-muted">{p.category}</div>
                  </td>
                  <td><Pill color={STATUS_COLOR[p.status] ?? "grey"}>{p.status.charAt(0) + p.status.slice(1).toLowerCase()}</Pill></td>
                  <td>{p._count.comments}</td>
                  <td>{formatNumber(p.views)}</td>
                  <td className="text-muted">{p.publishedAt ? formatDate(p.publishedAt) : "—"}</td>
                  <td>
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/admin/content/blog/${p.id}`} className="text-muted hover:text-gold" aria-label="Edit"><Pencil className="h-4 w-4" /></Link>
                      <RowDeleteButton id={p.id} action={deleteBlogPost} confirmLabel="Delete this post?" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </>
  );
}
