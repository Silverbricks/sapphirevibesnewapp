import Image from "next/image";
import Link from "next/link";
import { getAllCollections } from "@/lib/data/catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const collections = await getAllCollections();
  return (
    <section className="py-16">
      <div className="wrap">
        <div className="mb-10">
          <span className="eyebrow">Curated Edits</span>
          <h1 className="text-[clamp(34px,4.6vw,52px)]">Collections</h1>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <Link
              key={c.id}
              href={`/collections/${c.slug}`}
              className="group relative h-64 overflow-hidden rounded-card border border-line"
            >
              {c.heroImage && (
                <Image
                  src={c.heroImage}
                  alt={c.name}
                  fill
                  sizes="(max-width:1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 to-transparent to-60%" />
              <div className="absolute bottom-5 left-5 z-[2]">
                <h3 className="font-serif text-2xl">{c.name}</h3>
                <span className="text-xs text-muted">{c._count.products} pieces</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
