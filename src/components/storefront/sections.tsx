import Image from "next/image";
import Link from "next/link";
import { Truck, Home, BadgeCheck, CreditCard } from "lucide-react";
import { buttonClasses } from "@/components/ui";
import { slugify } from "@/lib/utils";
import { STYLE_WORDS } from "@/lib/constants";

const img = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80`;

export function SectionHead({
  eyebrow,
  title,
  href,
  cta,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="text-[clamp(34px,4.6vw,52px)]">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="border-b border-line-gold pb-1 text-xs uppercase tracking-[0.18em] text-gold"
        >
          {cta ?? "View all"} →
        </Link>
      )}
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative flex min-h-[88vh] items-center overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 72% 38%,rgba(200,164,92,.16),transparent 52%),radial-gradient(ellipse at 20% 80%,rgba(46,90,172,.14),transparent 50%),linear-gradient(160deg,#0c0f14,#11161d 60%,#0a0d11)",
        }}
      />
      <div className="absolute right-0 top-0 hidden h-full w-[46%] [mask-image:linear-gradient(90deg,transparent,#000_28%)] md:block">
        <Image
          src={img("1616486338812-3dadae4b4ace", 900)}
          alt="Luxury interior"
          fill
          priority
          sizes="46vw"
          className="object-cover opacity-90"
        />
      </div>
      <div className="wrap relative z-[2]">
        <div className="max-w-[620px] animate-rise">
          <span className="eyebrow">The Autumn Collection · 2026</span>
          <h1 className="my-3 text-[clamp(48px,7.5vw,92px)] tracking-tight">
            Luxury Living.
            <br />
            <i className="italic text-gold">Timeless</i> Style.
          </h1>
          <p className="mb-8 max-w-[440px] text-lg text-muted">
            Curated home décor, sculptural lighting, and designer pieces for spaces that
            deserve to be remembered.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/new-arrivals" className={buttonClasses("gold", "lg")}>
              Shop the Collection
            </Link>
            <Link href="/rooms" className={buttonClasses("outline", "lg")}>
              Explore Rooms
            </Link>
          </div>
          <div className="mt-14 flex flex-wrap gap-12">
            {[
              ["2,400+", "Curated Pieces"],
              ["180+", "Designer Brands"],
              ["4.9★", "Customer Rating"],
            ].map(([n, l]) => (
              <div key={l}>
                <span className="block font-serif text-[34px] text-cream">{n}</span>
                <small className="text-[11px] uppercase tracking-[0.2em] text-muted">{l}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Marquee() {
  const run = (
    <span className="flex items-center gap-16">
      {STYLE_WORDS.map((w) => (
        <span key={w} className="flex items-center gap-16">
          {w}
          <b className="font-sans text-[11px] font-medium uppercase not-italic tracking-[0.2em] text-gold">·</b>
        </span>
      ))}
    </span>
  );
  return (
    <div className="overflow-hidden border-y border-line-gold bg-panel py-[18px]">
      <div className="flex w-max animate-marquee gap-16 whitespace-nowrap font-serif text-xl italic text-muted">
        {run}
        {run}
      </div>
    </div>
  );
}

const ROOMS = [
  { name: "Living Room", tag: "The Sanctuary", img: "1586023492125-27b2c045efd7", tall: true },
  { name: "Bedroom", tag: "Rest & Restore", img: "1505693416388-ac5ce068fe85" },
  { name: "Dining", tag: "Gather", img: "1556911220-bff31c812dba" },
  { name: "Kitchen", tag: "The Heart", img: "1600121848594-d8644e57abab" },
  { name: "Bathroom", tag: "Retreat", img: "1620626011761-996317b8d101" },
];

export function ShopByRoom() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {ROOMS.map((r) => (
        <Link
          key={r.name}
          href={`/rooms/${slugify(r.name)}`}
          className={`group relative overflow-hidden rounded-card ${r.tall ? "row-span-2 h-auto" : "h-[340px]"}`}
        >
          <Image
            src={img(r.img, 600)}
            alt={r.name}
            fill
            sizes="(max-width:1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.08]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 to-transparent to-60%" />
          <small className="absolute bottom-[54px] left-5 z-[2] text-[10px] uppercase tracking-[0.2em] text-gold">
            {r.tag}
          </small>
          <span className="absolute bottom-5 left-5 z-[2] font-serif text-2xl">{r.name}</span>
        </Link>
      ))}
    </div>
  );
}

export function CollectionBand({
  eyebrow,
  title,
  desc,
  image,
  href,
  cta,
  minHeight = 420,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  image: string;
  href: string;
  cta: string;
  minHeight?: number;
}) {
  return (
    <div className="relative flex items-center overflow-hidden rounded-panel" style={{ minHeight }}>
      <Image src={image} alt={title} fill sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/95 to-ink/40" />
      <div className="relative z-[2] max-w-[520px] p-10 md:p-16">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="my-4 text-[46px]">{title}</h2>
        <p className="mb-7 text-grey">{desc}</p>
        <Link href={href} className={buttonClasses("gold", "lg")}>
          {cta}
        </Link>
      </div>
    </div>
  );
}

export function Features() {
  const items = [
    { icon: Truck, h: "Free Express Shipping", p: "On all orders over $250" },
    { icon: Home, h: "Trade Program", p: "Exclusive pricing for designers" },
    { icon: BadgeCheck, h: "30-Day Returns", p: "Shop with confidence" },
    { icon: CreditCard, h: "Secure Checkout", p: "Afterpay & Zip available" },
  ];
  return (
    <div className="grid grid-cols-2 gap-8 border-y border-line-gold py-14 text-center lg:grid-cols-4">
      {items.map(({ icon: Icon, h, p }) => (
        <div key={h}>
          <Icon className="mx-auto mb-3.5 h-[30px] w-[30px] text-gold" strokeWidth={1.4} />
          <h4 className="mb-1 font-serif text-[21px]">{h}</h4>
          <p className="text-[13px] text-muted">{p}</p>
        </div>
      ))}
    </div>
  );
}

export function LoyaltyReferralBand() {
  return (
    <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
      <div className="glow-gold relative overflow-hidden rounded-panel border border-line-gold bg-card p-10">
        <span className="eyebrow">Sapphire Elite</span>
        <h3 className="my-2.5 text-[32px]">Earn points<br />on every order</h3>
        <p className="mb-6 max-w-[340px] text-muted">
          Join free and earn 1 point per $1. Unlock free express shipping, early access and
          complimentary gift wrapping.
        </p>
        <Link href="/register" className={buttonClasses("gold", "lg")}>
          Join the Club
        </Link>
      </div>
      <div
        className="relative overflow-hidden rounded-panel border border-line-gold bg-card p-10"
        style={{ backgroundImage: "radial-gradient(ellipse at top right,rgba(46,90,172,.18),transparent 60%)" }}
      >
        <span className="eyebrow">Refer a Friend</span>
        <h3 className="my-2.5 text-[32px]">Give $20,<br />get $20</h3>
        <p className="mb-6 max-w-[340px] text-muted">
          Share Sapphire Vibes with friends. When they spend $100+, you both receive $20 credit.
        </p>
        <Link href="/account/referrals" className={buttonClasses("outline", "lg")}>
          Get Your Link
        </Link>
      </div>
    </div>
  );
}

export function Reviews({
  testimonials,
}: {
  testimonials: { id: string; quote: string; author: string; location: string | null }[];
}) {
  return (
    <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-3">
      {testimonials.map((t) => (
        <div key={t.id} className="rounded-card border border-line-gold bg-card p-[30px]">
          <div className="text-sm tracking-[2px] text-gold">★★★★★</div>
          <p className="my-2.5 font-serif text-xl italic leading-snug text-cream">“{t.quote}”</p>
          <div className="text-xs uppercase tracking-[0.1em] text-muted">
            {t.author} · {t.location}
          </div>
        </div>
      ))}
    </div>
  );
}
