import { getAdminCollections } from "@/lib/data/admin";
import { Pill, buttonClasses } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";

export const dynamic = "force-dynamic";
export const metadata = { title: "Collections · Admin" };

export default async function CollectionsPage() {
  const collections = await getAdminCollections();
  return (
    <>
      <PageHead
        title="Collections"
        subtitle="Curate themed edits — manual or rule-based automatic collections."
        actions={<span className={buttonClasses("gold", "md")}>+ New Collection</span>}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-card border border-line bg-card p-5">
            <div>
              <div className="font-serif text-[21px]">{c.name}</div>
              <div className="mt-1 flex items-center gap-2">
                <Pill color={c.type === "AUTO" ? "blue" : "gold"}>{c.type === "AUTO" ? "Auto" : "Manual"}</Pill>
                {c.isFeatured && <Pill color="green">Featured</Pill>}
              </div>
            </div>
            <div className="font-serif text-[30px] text-gold">{c._count.products}</div>
          </div>
        ))}
      </div>
    </>
  );
}
