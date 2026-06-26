import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getBlogPostBySlug } from "@/lib/data/content";
import { formatDate } from "@/lib/format";

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

  return (
    <article className="py-16">
      <div className="wrap max-w-3xl">
        <Link href="/blog" className="text-xs uppercase tracking-[0.12em] text-gold">← All articles</Link>
        <div className="mt-6 text-[10px] uppercase tracking-[0.18em] text-gold">{post.category}</div>
        <h1 className="my-3 font-serif text-[clamp(34px,5vw,56px)] leading-tight">{post.title}</h1>
        {post.publishedAt && <div className="mb-8 text-sm text-muted">{formatDate(post.publishedAt)}</div>}
        {post.coverUrl && (
          <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-panel border border-line">
            <Image src={post.coverUrl} alt={post.title} fill sizes="768px" className="object-cover" />
          </div>
        )}
        <div className="whitespace-pre-line text-[15px] leading-relaxed text-grey">{post.body}</div>
      </div>
    </article>
  );
}
