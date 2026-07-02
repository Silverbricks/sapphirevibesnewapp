import { AnnouncementBar, Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { QuickViewModal } from "@/components/storefront/QuickViewModal";
import { CompareTray } from "@/components/storefront/CompareTray";
import { getAnnouncement } from "@/lib/data/content";
import { getCategoryMenu } from "@/lib/data/catalog";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [announcement, categories] = await Promise.all([getAnnouncement(), getCategoryMenu()]);
  const showBar = announcement?.enabled ?? true;

  return (
    <>
      {showBar && <AnnouncementBar text={announcement?.text} ctaHref={announcement?.ctaHref} />}
      <Header categories={categories} />
      <main>{children}</main>
      <Footer />
      <QuickViewModal />
      <CompareTray />
    </>
  );
}
