import { getNewArrivals, getBestSellers } from "@/lib/data/products";
import { getShopTheLook } from "@/lib/data/catalog";
import { getFeaturedTestimonials, getHeroSlides, getVisibleBlockKeys } from "@/lib/data/content";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { CompleteTheLook } from "@/components/storefront/CompleteTheLook";
import { Newsletter } from "@/components/storefront/Newsletter";
import { RecentlyViewed } from "@/components/storefront/RecentlyViewed";
import { HeroSlider } from "@/components/storefront/HeroSlider";
import {
  Hero,
  Marquee,
  ShopByRoom,
  CollectionBand,
  Features,
  LoyaltyReferralBand,
  Reviews,
  SectionHead,
} from "@/components/storefront/sections";

const img = (id: string, w = 1100) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80`;

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [newArrivals, bestSellers, testimonials, look, heroSlides, visibleKeys] = await Promise.all([
    getNewArrivals(4),
    getBestSellers(4),
    getFeaturedTestimonials(3),
    getShopTheLook(),
    getHeroSlides(),
    getVisibleBlockKeys(),
  ]);
  // homepage sections toggle on/off from the CMS (default shown if no block exists)
  const show = (key: string) => visibleKeys.size === 0 || visibleKeys.has(key);

  return (
    <>
      {show("hero") && (heroSlides.length > 0 ? <HeroSlider slides={heroSlides} /> : <Hero />)}
      <Marquee />

      {show("rooms") && (
        <section className="py-24">
          <div className="wrap">
            <SectionHead eyebrow="Curated Spaces" title="Shop by Room" href="/rooms" cta="View all rooms" />
            <ShopByRoom />
          </div>
        </section>
      )}

      {show("new") && (
        <section className="pb-24">
          <div className="wrap">
            <SectionHead eyebrow="Fresh In" title="New Arrivals" href="/new-arrivals" cta="Shop all new" />
            <ProductGrid products={newArrivals} />
          </div>
        </section>
      )}

      {show("collections") && (
        <section className="pb-24">
          <div className="wrap">
            <CollectionBand
              eyebrow="Signature Series"
              title="Sculptural Lighting"
              desc="Hand-finished chandeliers and pendants designed to be the centrepiece of any room. Brass, alabaster, and hand-blown glass."
              image={img("1513506003901-1e6a229e2d15")}
              href="/collections/sculptural-lighting"
              cta="Discover Lighting"
            />
          </div>
        </section>
      )}

      {show("best") && (
        <section className="pb-24">
          <div className="wrap">
            <SectionHead eyebrow="Most Loved" title="Best Sellers" href="/sale" cta="Shop best sellers" />
            <ProductGrid products={bestSellers} />
          </div>
        </section>
      )}

      {look && (
        <section className="pb-24">
          <div className="wrap">
            <CompleteTheLook look={look} />
          </div>
        </section>
      )}

      <section className="pb-24">
        <div className="wrap">
          <LoyaltyReferralBand />
        </div>
      </section>

      <section className="pb-24">
        <div className="wrap">
          <Features />
        </div>
      </section>

      <section className="pb-24">
        <div className="wrap">
          <CollectionBand
            eyebrow="The Gift Edit"
            title="Gifts Under $100"
            desc="Thoughtfully curated pieces for housewarmings, weddings, and every reason to celebrate."
            image={img("1549465220-1a8b9238cd48")}
            href="/gifts"
            cta="Find a Gift"
            minHeight={360}
          />
        </div>
      </section>

      {show("reviews") && (
        <section className="pb-24">
          <div className="wrap">
            <SectionHead eyebrow="In Their Words" title="Loved by Thousands" />
            <Reviews testimonials={testimonials} />
          </div>
        </section>
      )}

      <RecentlyViewed />

      {show("newsletter") && (
        <section className="pb-24">
          <div className="wrap">
            <Newsletter />
          </div>
        </section>
      )}
    </>
  );
}
