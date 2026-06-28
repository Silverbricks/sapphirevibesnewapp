import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getProductForEdit } from "@/lib/data/admin";
import { saveProduct } from "@/actions/admin";
import { Button, Input, Textarea, Select, FormField, Panel, buttonClasses } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { ALL_BADGES, BADGE_META } from "@/lib/badges";

export const dynamic = "force-dynamic";

export default async function ProductEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const [product, categories, brands] = await Promise.all([
    isNew ? null : getProductForEdit(id),
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.brand.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!isNew && !product) notFound();

  const dollars = (c?: number | null) => (c != null ? (c / 100).toFixed(2) : "");
  const badges = (product?.badges ?? []) as string[];

  return (
    <>
      <PageHead title={isNew ? "New Product" : "Edit Product"} subtitle={isNew ? "Add a product to the catalogue." : product?.sku} />
      <Link href="/admin/products" className="mb-4 inline-block text-xs uppercase tracking-[0.12em] text-gold">← All products</Link>

      <form action={saveProduct} className="max-w-3xl space-y-[18px]">
        {!isNew && <input type="hidden" name="id" value={product!.id} />}

        <Panel>
          <h3 className="mb-4 font-serif text-xl">Basics</h3>
          <FormField label="Product Name"><Input name="name" required defaultValue={product?.name} placeholder="Aurelia Brass Pendant" /></FormField>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <FormField label="SKU"><Input name="sku" defaultValue={product?.sku} placeholder="LGT-AUR-001" /></FormField>
            <FormField label="Status">
              <Select name="status" defaultValue={product?.status ?? "ACTIVE"}>
                <option value="ACTIVE">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </FormField>
            <FormField label="Category">
              <Select name="categoryId" defaultValue={product?.categoryId ?? ""} required>
                <option value="" disabled>Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Brand">
              <Select name="brandId" defaultValue={product?.brandId ?? ""}>
                <option value="">No brand</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </FormField>
          </div>
        </Panel>

        <Panel>
          <h3 className="mb-4 font-serif text-xl">Pricing &amp; Stock</h3>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
            <FormField label="Selling Price ($)"><Input name="price" type="number" step="0.01" defaultValue={dollars(product?.priceCents)} /></FormField>
            <FormField label="Compare-at ($)"><Input name="compare" type="number" step="0.01" defaultValue={dollars(product?.compareCents)} /></FormField>
            <FormField label="Cost ($)"><Input name="cost" type="number" step="0.01" defaultValue={dollars(product?.costCents)} /></FormField>
            <FormField label="Stock Qty"><Input name="stock" type="number" defaultValue={product?.stock ?? 0} /></FormField>
            <FormField label="Min Stock"><Input name="minStock" type="number" defaultValue={product?.minStockLevel ?? 5} /></FormField>
            <FormField label="Max Stock"><Input name="maxStock" type="number" defaultValue={product?.maxStock ?? 100} /></FormField>
          </div>
        </Panel>

        <Panel>
          <h3 className="mb-4 font-serif text-xl">Specifications</h3>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <FormField label="Material"><Input name="material" defaultValue={product?.material ?? ""} /></FormField>
            <FormField label="Colour"><Input name="colour" defaultValue={product?.colour ?? ""} /></FormField>
            <FormField label="Style"><Input name="style" defaultValue={product?.style ?? ""} /></FormField>
            <FormField label="Room"><Input name="room" defaultValue={product?.room ?? ""} /></FormField>
            <FormField label="Dimensions"><Input name="dimensions" defaultValue={product?.dimensions ?? ""} /></FormField>
          </div>
        </Panel>

        <Panel>
          <h3 className="mb-4 font-serif text-xl">Description &amp; Media</h3>
          <FormField label="Description"><Textarea name="description" defaultValue={product?.description ?? ""} /></FormField>
          <FormField label="Care Instructions"><Input name="careInstructions" defaultValue={product?.careInstructions ?? ""} /></FormField>
          <FormField label="Featured Image URL"><Input name="imageUrl" placeholder="https://images.unsplash.com/..." /></FormField>
          {product?.images[0] && (
            <Image src={product.images[0].url} alt={product.name} width={80} height={80} className="h-20 w-20 rounded-lg object-cover" />
          )}
        </Panel>

        <Panel>
          <h3 className="mb-4 font-serif text-xl">Promotional Badges</h3>
          <div className="flex flex-wrap gap-2">
            {ALL_BADGES.map((b) => (
              <label key={b} className="cursor-pointer">
                <input type="checkbox" name="badges" value={b} defaultChecked={badges.includes(b)} className="peer sr-only" />
                <span className="inline-block rounded-lg border border-line bg-panel px-3 py-1.5 text-xs text-grey peer-checked:border-gold peer-checked:bg-gold/15 peer-checked:text-gold">
                  {BADGE_META[b].label}
                </span>
              </label>
            ))}
          </div>
        </Panel>

        <Panel>
          <h3 className="mb-4 font-serif text-xl">SEO</h3>
          <FormField label="SEO Title"><Input name="seoTitle" defaultValue={product?.seoTitle ?? ""} /></FormField>
          <FormField label="SEO Description"><Textarea name="seoDescription" defaultValue={product?.seoDescription ?? ""} /></FormField>
        </Panel>

        <div className="flex gap-3">
          <Button type="submit" variant="gold" size="lg">{isNew ? "Create Product" : "Save Changes"}</Button>
          <Link href="/admin/products" className={buttonClasses("dark", "lg")}>Cancel</Link>
        </div>
      </form>
    </>
  );
}
