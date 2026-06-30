import Link from "next/link";
import { getHeroSlides } from "@/lib/data/content";
import { PageHead } from "@/components/admin/PageHead";
import { HeroSlideManager } from "@/components/admin/HeroSlideManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hero Slider · Admin" };

export default async function HeroSliderPage() {
  const slides = await getHeroSlides();
  return (
    <>
      <Link href="/admin/homepage" className="mb-4 inline-block text-xs uppercase tracking-[0.12em] text-gold">
        ← Homepage CMS
      </Link>
      <PageHead
        title="Hero Slider"
        subtitle="Add slides with an image and content — they appear on the storefront homepage."
      />
      <HeroSlideManager slides={slides} />
    </>
  );
}
