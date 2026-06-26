import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/format";

interface LookProduct {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  images: { url: string }[];
}

export function CompleteTheLook({
  look,
}: {
  look: { title: string; heroImage: string; products: LookProduct[] };
}) {
  return (
    <div className="relative flex min-h-[480px] items-end overflow-hidden rounded-panel">
      <Image src={look.heroImage} alt={look.title} fill sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/95 to-transparent to-55%" />
      <div className="relative z-[2] w-full p-10">
        <span className="eyebrow">Shop the Look</span>
        <h2 className="my-2.5 text-[42px]">{look.title}</h2>
        <div className="flex flex-wrap gap-3.5">
          {look.products.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              className="flex items-center gap-3 rounded-xl border border-line bg-ink/70 p-2.5 pr-4 backdrop-blur-md transition-colors hover:border-gold"
            >
              {p.images[0]?.url && (
                <Image
                  src={p.images[0].url}
                  alt={p.name}
                  width={46}
                  height={46}
                  className="h-[46px] w-[46px] rounded-lg object-cover"
                />
              )}
              <div>
                <div className="text-[13px]">{p.name}</div>
                <div className="font-serif text-base text-gold">{formatMoney(p.priceCents)}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
