import Link from "next/link";
import { getAllTestimonials } from "@/lib/data/content";
import { PageHead } from "@/components/admin/PageHead";
import { TestimonialManager } from "@/components/admin/TestimonialManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Testimonials · Admin" };

export default async function TestimonialsAdminPage() {
  const items = await getAllTestimonials();
  return (
    <>
      <Link href="/admin/content" className="mb-4 inline-block text-xs uppercase tracking-[0.12em] text-gold">← Content CMS</Link>
      <PageHead title="Testimonials" subtitle="Customer quotes; featured ones appear on the homepage." />
      <TestimonialManager items={items} />
    </>
  );
}
