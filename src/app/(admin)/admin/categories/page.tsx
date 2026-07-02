import { getAdminCategories } from "@/lib/data/admin";
import { requireModule } from "@/lib/auth-helpers";
import { PageHead } from "@/components/admin/PageHead";
import { CategoryManager } from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories · Admin" };

export default async function CategoriesPage() {
  await requireModule("categories");
  const categories = await getAdminCategories();

  return (
    <>
      <PageHead
        title="Categories"
        subtitle="Add, edit, reorder and image your product categories and subcategories."
      />
      <CategoryManager categories={categories} />
    </>
  );
}
