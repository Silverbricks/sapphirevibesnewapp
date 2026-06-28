import { getContentData } from "@/lib/data/admin";
import { Panel, PanelHead, Pill, buttonClasses, type PillColor } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pages & Blog · Admin" };

const STATUS_COLOR: Record<string, PillColor> = {
  PUBLISHED: "green",
  DRAFT: "amber",
  SCHEDULED: "gold",
};

export default async function ContentPage() {
  const { pages, posts } = await getContentData();
  return (
    <>
      <PageHead
        title="Pages & Blog"
        subtitle="Static pages, blog posts, FAQs and policies."
        actions={<span className={buttonClasses("gold", "md")}>+ New Page</span>}
      />
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <Panel>
          <PanelHead title="Static Pages" />
          {pages.map((p) => (
            <div key={p.id} className="flex items-center justify-between border-b border-line py-3.5 last:border-0">
              <b className="text-sm font-normal">{p.title}</b>
              <Pill color={STATUS_COLOR[p.status] ?? "grey"}>{p.status.charAt(0) + p.status.slice(1).toLowerCase()}</Pill>
            </div>
          ))}
        </Panel>
        <Panel>
          <PanelHead title="Blog Posts" />
          {posts.map((p) => (
            <div key={p.id} className="flex items-center justify-between border-b border-line py-3.5 last:border-0">
              <div>
                <b className="text-sm font-normal">{p.title}</b>
                <small className="block text-xs text-muted">{p.category} · {formatNumber(p.views)} views</small>
              </div>
              <Pill color={STATUS_COLOR[p.status] ?? "grey"}>{p.status === "PUBLISHED" ? "Live" : p.status.charAt(0) + p.status.slice(1).toLowerCase()}</Pill>
            </div>
          ))}
        </Panel>
      </div>
    </>
  );
}
