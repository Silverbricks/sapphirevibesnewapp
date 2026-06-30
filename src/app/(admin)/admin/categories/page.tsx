import { getAdminCategories } from "@/lib/data/admin";
import { PageHead } from "@/components/admin/PageHead";
import { CreateButton } from "@/components/admin/CreateButton";
import { createCategory } from "@/actions/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories · Admin" };

export default async function CategoriesPage() {
  const categories = await getAdminCategories();
  const parentOptions = [
    { value: "", label: "None (top level)" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <>
      <PageHead
        title="Categories"
        subtitle="Organise products across rooms, collections and styles."
        actions={
          <CreateButton
            label="Add Category"
            title="New Category"
            action={createCategory}
            fields={[
              { name: "name", label: "Name", required: true, placeholder: "Outdoor Living" },
              { name: "parentId", label: "Parent Category", type: "select", options: parentOptions },
              { name: "description", label: "Description", type: "textarea", placeholder: "Short description" },
            ]}
          />
        }
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
