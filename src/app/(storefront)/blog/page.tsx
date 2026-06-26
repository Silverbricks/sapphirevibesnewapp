import Image from "next/image";
import Link from "next/link";
import { getBlogPosts } from "@/lib/data/content";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Blog" };

export default async function BlogPage() {
  const posts = await getBlogPosts();
  return (
    <section className="py-16">
      <div className="wrap">
        <span className="eyebrow">Journal</span>
        <h1 className="mb-10 text-[clamp(34px,4.6vw,52px)]">Styling Notes & Stories</h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.id} href={`/blog/${p.slug}`} className="group overflow-hidden rounded-card border border-line bg-card">
              <div className="relative aspect-[3/2] overflow-hidden bg-[#0d1015]">
                {p.coverUrl && (
                  <Image src={p.coverUrl} alt={p.title} fill sizes="(max-width:1024px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                )}
              </div>
              <div className="p-5">
                <div className="text-[10px] uppercase tracking-[0.18em] text-gold">{p.category}</div>
                <h3 className="my-1.5 font-serif text-xl">{p.title}</h3>
                {p.excerpt && <p className="text-sm text-muted">{p.excerpt}</p>}
                <div className="mt-3 text-xs text-muted">{formatNumber(p.views)} views</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
