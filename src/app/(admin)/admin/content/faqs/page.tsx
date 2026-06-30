import Link from "next/link";
import { getFaqs } from "@/lib/data/content";
import { PageHead } from "@/components/admin/PageHead";
import { FaqManager } from "@/components/admin/FaqManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "FAQs · Admin" };

export default async function FaqsAdminPage() {
  const faqs = await getFaqs();
  return (
    <>
      <Link href="/admin/content" className="mb-4 inline-block text-xs uppercase tracking-[0.12em] text-gold">← Content CMS</Link>
      <PageHead title="FAQs" subtitle="Questions and answers shown on the storefront help page." />
      <FaqManager faqs={faqs} />
    </>
  );
}
