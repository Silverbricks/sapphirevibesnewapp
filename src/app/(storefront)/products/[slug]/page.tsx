import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/products";
import { RatingStars, Price, ProductBadgeChip } from "@/components/ui";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { PdpBuyBox } from "@/components/storefront/PdpBuyBox";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { SectionHead } from "@/components/storefront/sections";
import { VideoEmbed } from "@/components/storefront/VideoEmbed";
import { formatDate } from "@/lib/format";
import type { ProductBadgeKey } from "@/lib/badges";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.description ?? undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.id, product.categoryId);
  const featured = product.images.find((i) => i.isFeatured) ?? product.images[0];

  const specs: [string, string | null | undefined][] = [
    ["SKU", product.sku],
    ["Material", product.material],
    ["Colour", product.colour],
    ["Style", product.style],
    ["Room", product.room],
    ["Dimensions", product.dimensions],
    ["Weight", product.weightGrams ? `${(product.weightGrams / 1000).toFixed(1)} kg` : null],
    ["Warranty", product.warranty],
    ["Care", product.careInstructions],
  ];

  return (
    <div className="py-12">
      <div className="wrap">
        {/* breadcrumb */}
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-xs text-muted">
          <Link href="/" className="hover:text-gold">Home</Link>
          <span>/</span>
          <Link href={`/collections`} className="hover:text-gold">{product.category.name}</Link>
          <span>/</span>
          <span className="text-cream">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <ProductGallery images={product.images} name={product.name} />

          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted">
              {product.brand?.name}
            </div>
            <h1 className="my-2 font-serif text-[40px] font-medium leading-tight">
              {product.name}
            </h1>
            <RatingStars rating={product.ratingAvg} count={product.ratingCount} size="md" />
            <div className="my-5">
              <Price cents={product.priceCents} compareCents={product.compareCents} size="lg" />
            </div>
            <div className="mb-5 flex flex-wrap gap-2">
              {(product.badges as ProductBadgeKey[]).map((b) => (
                <ProductBadgeChip key={b} badge={b} />
              ))}
            </div>
            <p className="mb-7 leading-relaxed text-grey">{product.description}</p>

            <PdpBuyBox
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                brand: product.brand?.name ?? "",
                priceCents: product.priceCents,
                stock: product.stock,
                image: featured?.url ?? "",
              }}
            />

            {/* specifications */}
            <dl className="mt-8 divide-y divide-line border-t border-line">
              {specs
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-3 text-sm">
                    <dt className="text-muted">{k}</dt>
                    <dd className="text-right text-cream">{v}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>

        {/* video */}
        {product.videoUrl && (
          <section className="mt-16">
            <h2 className="mb-5 font-serif text-3xl">Product Video</h2>
            <VideoEmbed url={product.videoUrl} />
          </section>
        )}

        {/* reviews */}
        <section className="mt-20 border-t border-line pt-12">
          <h2 className="mb-6 font-serif text-3xl">
            Reviews{" "}
            <span className="text-muted">
              ({product.ratingCount} · {product.ratingAvg.toFixed(1)}★)
            </span>
          </h2>
          {product.reviews.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {product.reviews.map((r) => (
                <div key={r.id} className="rounded-card border border-line bg-card p-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm">{r.authorName}</span>
                    <RatingStars rating={r.rating} />
                  </div>
                  {r.title && <div className="mb-1 font-serif text-lg">{r.title}</div>}
                  <p className="text-sm leading-relaxed text-grey">{r.body}</p>
                  {r.photos.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {r.photos.map((ph) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={ph.id} src={ph.url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                      ))}
                    </div>
                  )}
                  <div className="mt-3 text-xs text-muted">{formatDate(r.createdAt)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No reviews yet — be the first to review this piece.</p>
          )}
        </section>

        {/* Q&A */}
        {product.questions.length > 0 && (
          <section className="mt-16 border-t border-line pt-12">
            <h2 className="mb-6 font-serif text-3xl">Questions & Answers</h2>
            <div className="space-y-5">
              {product.questions.map((q) => (
                <div key={q.id} className="rounded-card border border-line bg-card p-6">
                  <div className="mb-1 text-sm text-cream">Q: {q.body}</div>
                  {q.answer && <div className="text-sm text-muted">A: {q.answer}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* related */}
        {related.length > 0 && (
          <section className="mt-20">
            <SectionHead eyebrow="You May Also Like" title="Complete the Collection" />
            <ProductGrid products={related} />
          </section>
        )}
      </div>
    </div>
  );
}
