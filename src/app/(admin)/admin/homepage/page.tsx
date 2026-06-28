import Link from "next/link";
import { getAllHomepageBlocks } from "@/lib/data/content";
import { buttonClasses } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { HomepageBlockList } from "@/components/admin/HomepageBlockList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Homepage CMS · Admin" };

export default async function HomepageCmsPage() {
  const blocks = await getAllHomepageBlocks();
  return (
    <>
      <PageHead
        title="Homepage CMS"
        subtitle="Reorder sections and toggle visibility — changes appear on the live storefront."
        actions={<Link href="/" className={buttonClasses("outline", "md")}>Preview Live →</Link>}
      />
      <HomepageBlockList blocks={blocks} />
    </>
  );
}
