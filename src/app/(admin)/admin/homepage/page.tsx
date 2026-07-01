import Link from "next/link";
import { requireModule } from "@/lib/auth-helpers";
import { getAllHomepageBlocks, getAnnouncement } from "@/lib/data/content";
import { buttonClasses } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { HomepageBlockList } from "@/components/admin/HomepageBlockList";
import { AnnouncementEditor } from "@/components/admin/AnnouncementEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Homepage CMS · Admin" };

export default async function HomepageCmsPage() {
  await requireModule("homepage");
  const [blocks, announcement] = await Promise.all([getAllHomepageBlocks(), getAnnouncement()]);
  return (
    <>
      <PageHead
        title="Homepage CMS"
        subtitle="Reorder sections and toggle visibility — changes appear on the live storefront."
        actions={<Link href="/" className={buttonClasses("outline", "md")}>Preview Live →</Link>}
      />
      <AnnouncementEditor
        text={announcement?.text ?? ""}
        ctaHref={announcement?.ctaHref ?? ""}
        enabled={announcement?.enabled ?? true}
      />
      <h3 className="mb-3 mt-2 font-serif text-xl">Homepage Sections</h3>
      <HomepageBlockList blocks={blocks} />
    </>
  );
}
