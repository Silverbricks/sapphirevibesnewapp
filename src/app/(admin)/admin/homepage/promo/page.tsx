import Link from "next/link";
import { getPromoBanner } from "@/lib/data/content";
import { PageHead } from "@/components/admin/PageHead";
import { PromoBannerEditor } from "@/components/admin/PromoBannerEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promo Banner · Admin" };

export default async function PromoBannerPage() {
  const banner = await getPromoBanner();
  return (
    <>
      <Link href="/admin/homepage" className="mb-4 inline-block text-xs uppercase tracking-[0.12em] text-gold">
        ← Homepage CMS
      </Link>
      <PageHead
        title="Promotional Banner"
        subtitle="Edit the homepage promo banner — add an image, heading, and a call-to-action button."
      />
      <PromoBannerEditor banner={banner ?? {}} />
    </>
  );
}
