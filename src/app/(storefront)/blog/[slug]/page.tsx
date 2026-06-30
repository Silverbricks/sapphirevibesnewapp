import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getBlogPostBySlug, getApprovedComments } from "@/lib/data/content";
import { readBlogMeta, isHtml } from "@/lib/cms";
import { formatDate } from "@/lib/format";
import { CommentForm } from "@/components/storefront/CommentForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  return { title: post?.title ?? "Article" };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const meta = readBlogMeta(post.meta);
  const comments = meta.allowComments ? await getApprovedComments(post.id) : [];

  return (
    <article className="py-16">
      <div className="wrap max-w-3xl">
        <Link href="/blog" className="text-xs uppercase tracking-[0.12em] text-gold">← All articles</Link>
        <div className="mt-6 text-[10px] uppercase tracking-[0.18em] text-gold">{post.category}</div>
        <h1 className="my-3 font-serif text-[clamp(34px,5vw,56px)] leading-tight">{post.title}</h1>
        <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          {meta.author && <span>By {meta.author}</span>}
          {post.publishedAt && <span>· {formatDate(post.publishedAt)}</span>}
          {meta.readingTime ? <span>· {meta.readingTime} min read</span> : null}
        </div>
        {post.coverUrl && (
          <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-panel border border-line">
            <Image src={post.coverUrl} alt={post.title} fill sizes="768px" className="object-cover" />
          </div>
        )}

        {isHtml(post.body) ? (
          <div className="prose-luxury" dangerouslySetInnerHTML={{ __html: post.body }} />
        ) : (
          <div className="whitespace-pre-line text-[15px] leading-relaxed text-grey">{post.body}</div>
        )}

        {meta.tags && meta.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {meta.tags.map((t) => (
              <span key={t} className="rounded-lg border border-line px-3 py-1 text-xs text-muted">#{t}</span>
            ))}
          </div>
        )}

        {meta.allowComments && (
          <section className="mt-14 border-t border-line pt-10">
            <h2 className="mb-6 font-serif text-2xl">Comments {comments.length > 0 && <span className="text-muted">({comments.length})</span>}</h2>
            <div className="mb-8 space-y-4">
              {comments.length === 0 && <p className="text-sm text-muted">Be the first to comment.</p>}
              {comments.map((c) => (
                <div key={c.id} className="rounded-card border border-line bg-card p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <b className="text-sm font-normal text-cream">{c.author}</b>
                    <span className="text-xs text-muted">{formatDate(c.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-line text-sm text-grey">{c.body}</p>
                </div>
              ))}
            </div>
            <h3 className="mb-4 font-serif text-xl">Leave a comment</h3>
            <CommentForm postId={post.id} />
          </section>
        )}
      </div>
    </article>
  );
}
