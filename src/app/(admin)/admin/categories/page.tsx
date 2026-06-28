import { getAdminCategories } from "@/lib/data/admin";
import { buttonClasses } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories · Admin" };

export default async function CategoriesPage() {
  const categories = await getAdminCategories();
  return (
    <>
      <PageHead
        title="Categories"
        subtitle="Organise products across rooms, collections and styles."
        actions={<span className={buttonClasses("gold", "md")}>Add Category</span>}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-card border border-line bg-card p-5">
            <div>
              <div className="font-serif text-[21px]">{c.name}</div>
              <div className="mt-0.5 text-xs text-muted">
                {c.children.length > 0 ? c.children.map((ch) => ch.name).join(", ") : "Top-level category"}
              </div>
            </div>
            <div className="font-serif text-[30px] text-gold">{c._count.products}</div>
          </div>
        ))}
      </div>
    </>
  );
}
