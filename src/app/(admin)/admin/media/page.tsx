import Link from "next/link";
import { getMediaAssets, getMediaFolders, getMediaStats } from "@/lib/data/media";
import { StatCard, Panel, Input } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { MediaGrid } from "@/components/admin/MediaGrid";

export const dynamic = "force-dynamic";
export const metadata = { title: "Media Library · Admin" };

function fmtBytes(b: number) {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string; q?: string }>;
}) {
  const { folder, q } = await searchParams;
  const active = folder ?? "all";
  const [assets, folders, stats] = await Promise.all([
    getMediaAssets({ folder: active, q }),
    getMediaFolders(),
    getMediaStats(),
  ]);

  const chips = ["all", ...folders];

  return (
    <>
      <PageHead title="Media Library" subtitle="Upload, organise and reuse images across the store." />

      <div className="mb-[18px] grid grid-cols-1 gap-[18px] sm:grid-cols-2">
        <StatCard label="Total Assets" value={String(stats.count)} delta="images stored" />
        <StatCard label="Storage Used" value={fmtBytes(stats.bytes)} delta="in /public/uploads" />
      </div>

      <MediaUpload folders={folders} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {chips.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/admin/media" : `/admin/media?folder=${f}`}
            className={`fchip capitalize ${active === f ? "fchip-on" : ""}`}
          >
            {f}
          </Link>
        ))}
        <form className="ml-auto" action="/admin/media">
          {active !== "all" && <input type="hidden" name="folder" value={active} />}
          <Input name="q" defaultValue={q ?? ""} placeholder="Search alt / tags…" className="w-56" />
        </form>
      </div>

      <Panel>
        <MediaGrid assets={assets} />
      </Panel>
    </>
  );
}
