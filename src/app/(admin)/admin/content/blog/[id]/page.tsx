import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostById } from "@/lib/data/content";
import { readBlogMeta } from "@/lib/cms";
import { PageHead } from "@/components/admin/PageHead";
import { BlogEditor } from "@/components/admin/BlogEditor";

export const dynamic = "force-dynamic";

export default async function BlogEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const post = isNew ? null : await getBlogPostById(id);
  if (!isNew && !post) notFound();

  return (
    <>
      <Link href="/admin/content/blog" className="mb-4 inline-block text-xs uppercase tracking-[0.12em] text-gold">← Blog Posts</Link>
      <PageHead title={isNew ? "New Post" : "Edit Post"} subtitle="Compose your article, set the cover image and publish." />
      <BlogEditor
        post={
          post
            ? {
                id: post.id,
                title: post.title,
                category: post.category,
                excerpt: post.excerpt,
                body: post.body,
                coverUrl: post.coverUrl,
                status: post.status,
                meta: readBlogMeta(post.meta),
              }
            : {}
        }
      />
    </>
  );
}
