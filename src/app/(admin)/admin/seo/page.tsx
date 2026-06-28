import { db } from "@/lib/db";
import { StatCard, Panel, PanelHead, Pill, buttonClasses, type PillColor } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";

export const dynamic = "force-dynamic";
export const metadata = { title: "SEO · Admin" };

export default async function SeoPage() {
  const [pages, products, missingMeta] = await Promise.all([
    db.page.findMany({ orderBy: { title: "asc" } }),
    db.product.findMany({ where: { status: "ACTIVE" }, take: 6, select: { name: true, slug: true, seoTitle: true } }),
    db.product.count({ where: { seoTitle: null } }),
  ]);

  const rows: { page: string; meta: string | null; slug: string; score: number }[] = [
    { page: "Home", meta: "Sapphire Vibes — Luxury Living", slug: "/", score: 94 },
    { page: "Lighting Category", meta: "Luxury Lighting & Chandeliers", slug: "/lighting", score: 91 },
    ...pages.slice(0, 2).map((p) => ({ page: p.title, meta: p.seoTitle, slug: `/pages/${p.slug}`, score: p.seoTitle ? 88 : 64 })),
    ...products.slice(0, 3).map((p) => ({ page: p.name, meta: p.seoTitle, slug: `/products/${p.slug}`, score: p.seoTitle ? 86 : 62 })),
  ];

  const scoreColor = (s: number): PillColor => (s >= 85 ? "green" : s >= 70 ? "amber" : "red");

  return (
    <>
      <PageHead
        title="SEO"
        subtitle="Meta tags, URLs, sitemaps and social cards."
        actions={<span className={buttonClasses("outline", "md")}>Regenerate Sitemap</span>}
      />
      <div className="mb-[26px] grid grid-cols-1 gap-[18px] sm:grid-cols-3">
        <StatCard label="Indexed Pages" value="2,684" delta="120 this month" />
        <StatCard label="Avg. SEO Score" value="86" delta="4 pts" />
        <StatCard label="Missing Meta" value={String(missingMeta)} delta="products need attention" deltaDir="down" />
      </div>
      <Panel className="overflow-x-auto">
        <PanelHead title="Page SEO Health" />
        <table className="atable">
          <thead><tr><th>Page</th><th>Meta Title</th><th>URL Slug</th><th>Score</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.slug}>
                <td>{r.page}</td>
                <td className="text-muted">{r.meta ?? "—"}</td>
                <td className="text-muted">{r.slug}</td>
                <td><Pill color={scoreColor(r.score)}>{r.score}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
