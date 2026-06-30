import Link from "next/link";
import { Pencil, ExternalLink } from "lucide-react";
import { getAllPages } from "@/lib/data/content";
import { Panel, Pill, buttonClasses, type PillColor } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { RowDeleteButton } from "@/components/admin/RowDeleteButton";
import { deletePage } from "@/actions/content";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pages · Admin" };

const STATUS_COLOR: Record<string, PillColor> = { PUBLISHED: "green", DRAFT: "amber", SCHEDULED: "gold" };

export default async function PagesListPage() {
  const pages = await getAllPages();
  return (
    <>
      <Link href="/admin/content" className="mb-4 inline-block text-xs uppercase tracking-[0.12em] text-gold">← Content CMS</Link>
      <PageHead
        title="Pages"
        subtitle="About, policies and custom static pages."
        actions={<Link href="/admin/content/pages/new" className={buttonClasses("gold", "md")}>+ New Page</Link>}
      />
      <Panel className="overflow-x-auto">
        {pages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No pages yet.</p>
        ) : (
          <table className="atable">
            <thead><tr><th>Title</th><th>URL</th><th>Status</th><th>Updated</th><th></th></tr></thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id}>
                  <td><Link href={`/admin/content/pages/${p.id}`} className="font-medium text-cream hover:text-gold">{p.title}</Link></td>
                  <td className="text-muted">
                    <Link href={`/pages/${p.slug}`} className="inline-flex items-center gap-1 hover:text-gold">/pages/{p.slug} <ExternalLink className="h-3 w-3" /></Link>
                  </td>
                  <td><Pill color={STATUS_COLOR[p.status] ?? "grey"}>{p.status.charAt(0) + p.status.slice(1).toLowerCase()}</Pill></td>
                  <td className="text-muted">{formatDate(p.updatedAt)}</td>
                  <td>
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/admin/content/pages/${p.id}`} className="text-muted hover:text-gold" aria-label="Edit"><Pencil className="h-4 w-4" /></Link>
                      <RowDeleteButton id={p.id} action={deletePage} confirmLabel="Delete this page?" />
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
