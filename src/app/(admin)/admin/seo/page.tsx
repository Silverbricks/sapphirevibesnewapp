import Link from "next/link";
import { db } from "@/lib/db";
import { getSiteSettings, getBaseUrl } from "@/lib/data/settings";
import { StatCard, Panel, PanelHead, Pill, Input, Textarea, FormField, buttonClasses } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { SettingForm } from "@/components/admin/SettingForm";
import { RedirectsManager } from "@/components/admin/RedirectsManager";
import { saveSeoSettings } from "@/actions/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "SEO · Admin" };

const fileInput =
  "block w-full text-sm text-muted file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gold file:px-4 file:py-2 file:font-medium file:text-ink hover:file:bg-gold-soft";

export default async function SeoPage() {
  const base = getBaseUrl();
  const [{ store }, seoRows, redirects, productCount, pageCount, postCount, missingProducts, missingPages] =
    await Promise.all([
      getSiteSettings(),
      db.setting.findUnique({ where: { key: "seo" } }),
      db.redirect.findMany({ orderBy: { createdAt: "desc" } }),
      db.product.count({ where: { status: "ACTIVE" } }),
      db.page.count({ where: { status: "PUBLISHED" } }),
      db.blogPost.count({ where: { status: "PUBLISHED" } }),
      db.product.findMany({ where: { status: "ACTIVE", seoTitle: null }, take: 8, select: { id: true, name: true, slug: true } }),
      db.page.findMany({ where: { status: "PUBLISHED", seoTitle: null }, take: 8, select: { id: true, title: true, slug: true } }),
    ]);

  const seo = (seoRows?.value ?? {}) as {
    defaultTitle?: string;
    titleTemplate?: string;
    defaultDescription?: string;
    keywords?: string;
    ogImage?: string | null;
  };
  const indexable = productCount + pageCount + postCount;
  const missing = missingProducts.length + missingPages.length;

  return (
    <>
      <PageHead
        title="SEO"
        subtitle="Global meta defaults, per-page metadata, redirects, sitemap and robots."
        actions={<Link href={`${base}/sitemap.xml`} target="_blank" className={buttonClasses("outline", "md")}>View Sitemap →</Link>}
      />

      <div className="mb-[26px] grid grid-cols-1 gap-[18px] sm:grid-cols-3">
        <StatCard label="Indexable URLs" value={String(indexable)} delta={`${productCount} products · ${pageCount} pages · ${postCount} posts`} />
        <StatCard label="Redirects" value={String(redirects.length)} delta="301 / 302 rules" />
        <StatCard label="Missing Meta" value={String(missing)} delta="items need a meta title" deltaDir={missing ? "down" : "up"} />
      </div>

      <div className="mb-[18px]">
        <SettingForm action={saveSeoSettings} title="Global SEO Defaults">
          <FormField label="Default Title"><Input name="defaultTitle" defaultValue={seo.defaultTitle ?? `${store.name} — ${store.tagline}`} /></FormField>
          <FormField label="Title Template (%s = page title)"><Input name="titleTemplate" defaultValue={seo.titleTemplate ?? "%s · Sapphire Vibes"} /></FormField>
          <FormField label="Default Meta Description"><Textarea name="defaultDescription" defaultValue={seo.defaultDescription ?? store.description} rows={2} /></FormField>
          <FormField label="Keywords (comma separated)"><Input name="keywords" defaultValue={seo.keywords ?? ""} /></FormField>
          <FormField label="Default OG / Social Share Image (upload)"><input type="file" name="ogFile" accept="image/*" className={fileInput} /></FormField>
          <FormField label="…or OG image URL"><Input name="ogImage" defaultValue={seo.ogImage ?? ""} placeholder="https://…" /></FormField>
        </SettingForm>
      </div>

      <div className="mb-[18px]">
        <RedirectsManager redirects={redirects} />
      </div>

      <Panel>
        <PanelHead title="Items Missing a Meta Title" />
        {missing === 0 ? (
          <p className="py-4 text-sm text-muted">Every published product and page has a meta title. 🎉</p>
        ) : (
          <table className="atable">
            <thead><tr><th>Item</th><th>Type</th><th>URL</th><th></th></tr></thead>
            <tbody>
              {missingProducts.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td><Pill color="grey">Product</Pill></td>
                  <td className="text-muted">/products/{p.slug}</td>
                  <td className="text-right"><Link href={`/admin/products/${p.id}`} className="text-gold hover:underline">Edit →</Link></td>
                </tr>
              ))}
              {missingPages.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td><Pill color="grey">Page</Pill></td>
                  <td className="text-muted">/pages/{p.slug}</td>
                  <td className="text-right"><Link href={`/admin/content/pages/${p.id}`} className="text-gold hover:underline">Edit →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </>
  );
}
