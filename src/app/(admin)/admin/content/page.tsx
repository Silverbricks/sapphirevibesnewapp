import Link from "next/link";
import { FileText, Newspaper, HelpCircle, Quote, MessageSquare, ArrowRight } from "lucide-react";
import { getContentCounts } from "@/lib/data/content";
import { requireModule } from "@/lib/auth-helpers";
import { Panel } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";

export const dynamic = "force-dynamic";
export const metadata = { title: "Content CMS · Admin" };

export default async function ContentHubPage() {
  await requireModule("content");
  const c = await getContentCounts();

  const cards = [
    { href: "/admin/content/blog", icon: Newspaper, title: "Blog Posts", desc: "Write, schedule and publish articles.", count: `${c.posts} posts` },
    { href: "/admin/content/pages", icon: FileText, title: "Pages", desc: "About, policies and custom pages.", count: `${c.pages} pages` },
    { href: "/admin/content/faqs", icon: HelpCircle, title: "FAQs", desc: "Questions shown on the help page.", count: `${c.faqs} FAQs` },
    { href: "/admin/content/testimonials", icon: Quote, title: "Testimonials", desc: "Customer quotes on the homepage.", count: `${c.testimonials} quotes` },
    { href: "/admin/content/comments", icon: MessageSquare, title: "Comments", desc: "Moderate reader comments.", count: c.pendingComments ? `${c.pendingComments} pending` : "All clear" },
  ];

  return (
    <>
      <PageHead title="Content CMS" subtitle="Manage blog posts, pages, FAQs, testimonials and reader comments." />
      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="group">
            <Panel className="h-full transition-colors group-hover:border-line-gold">
              <div className="mb-3 flex items-center justify-between">
                <card.icon className="h-6 w-6 text-gold" strokeWidth={1.5} />
                <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-1 group-hover:text-gold" />
              </div>
              <h3 className="font-serif text-xl">{card.title}</h3>
              <p className="mt-1 text-sm text-muted">{card.desc}</p>
              <div className="mt-4 text-[11px] uppercase tracking-[0.14em] text-gold">{card.count}</div>
            </Panel>
          </Link>
        ))}
      </div>
    </>
  );
}
