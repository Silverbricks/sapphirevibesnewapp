import Image from "next/image";
import Link from "next/link";

interface Cat {
  name: string;
  slug: string;
  imageUrl: string | null;
}

/** DB-driven category tiles for the homepage (replaces the old hardcoded "Shop by Room"). */
export function CategoryTiles({ categories, limit = 8 }: { categories: Cat[]; limit?: number }) {
  const items = categories.slice(0, limit);
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((c) => (
        <Link
          key={c.slug}
          href={`/shop/${c.slug}`}
          className="group relative h-[300px] overflow-hidden rounded-card bg-ink"
        >
          {c.imageUrl && (
            <Image
              src={c.imageUrl}
              alt={c.name}
              fill
              sizes="(max-width:1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.08]"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 to-transparent to-60%" />
          <span className="absolute bottom-5 left-5 z-[2] font-serif text-2xl">{c.name}</span>
        </Link>
      ))}
    </div>
  );
}
