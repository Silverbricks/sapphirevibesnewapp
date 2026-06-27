import { AnnouncementBar, Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { QuickViewModal } from "@/components/storefront/QuickViewModal";
import { CompareTray } from "@/components/storefront/CompareTray";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main>{children}</main>
      <Footer />
      <QuickViewModal />
      <CompareTray />
    </>
  );
}
