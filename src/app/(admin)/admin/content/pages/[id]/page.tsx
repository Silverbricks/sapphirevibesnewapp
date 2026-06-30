import Link from "next/link";
import { notFound } from "next/navigation";
import { getPageById } from "@/lib/data/content";
import { PageHead } from "@/components/admin/PageHead";
import { PageEditor } from "@/components/admin/PageEditor";

export const dynamic = "force-dynamic";

export default async function PageEditorRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const page = isNew ? null : await getPageById(id);
  if (!isNew && !page) notFound();

  return (
    <>
      <Link href="/admin/content/pages" className="mb-4 inline-block text-xs uppercase tracking-[0.12em] text-gold">← Pages</Link>
      <PageHead title={isNew ? "New Page" : "Edit Page"} subtitle="Compose page content and SEO metadata." />
      <PageEditor
        page={
          page
            ? {
                id: page.id,
                slug: page.slug,
                title: page.title,
                body: page.body,
                status: page.status,
                seoTitle: page.seoTitle,
                seoDesc: page.seoDesc,
              }
            : {}
        }
      />
    </>
  );
}
