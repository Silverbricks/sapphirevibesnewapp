import { notFound } from "next/navigation";
import { getPageBySlug, getFaqs } from "@/lib/data/content";
import { isHtml } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  return { title: page?.seoTitle ?? page?.title ?? "Page" };
}

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) notFound();

  const faqs = slug === "faq" ? await getFaqs() : [];
  // strip a leading markdown "## Heading" line — we render the title separately
  const body = page.body.replace(/^##?\s.*\n+/, "");

  return (
    <article className="py-16">
      <div className="wrap max-w-3xl">
        <span className="eyebrow">{slug === "faq" ? "Help Centre" : "Information"}</span>
        <h1 className="mb-8 font-serif text-[clamp(34px,5vw,56px)] leading-tight">{page.title}</h1>

        {slug === "faq" ? (
          <div className="space-y-4">
            {faqs.map((f) => (
              <details key={f.id} className="rounded-card border border-line bg-card p-5">
                <summary className="cursor-pointer font-serif text-lg text-cream">{f.question}</summary>
                <p className="mt-2 text-sm leading-relaxed text-grey">{f.answer}</p>
              </details>
            ))}
          </div>
        ) : isHtml(page.body) ? (
          <div className="prose-luxury" dangerouslySetInnerHTML={{ __html: page.body }} />
        ) : (
          <div className="whitespace-pre-line text-[15px] leading-relaxed text-grey">{body}</div>
        )}
      </div>
    </article>
  );
}
