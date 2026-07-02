"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, ChevronUp, ChevronDown, Plus, X } from "lucide-react";
import { Panel, Button, Input, Textarea, Select, FormField } from "@/components/ui";
import { createCategory, updateCategory, deleteCategory, reorderCategory } from "@/actions/admin";

interface Cat {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
  seoTitle: string | null;
  seoDesc: string | null;
  parentId: string | null;
  _count: { products: number };
}
interface TopCat extends Cat {
  children: Cat[];
}

type ModalState =
  | { mode: "create"; parentId: string | null; cat?: undefined }
  | { mode: "edit"; cat: Cat; parentId?: undefined }
  | null;

const fileInput =
  "block w-full text-sm text-muted file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gold file:px-4 file:py-2 file:font-medium file:text-ink hover:file:bg-gold-soft";

export function CategoryManager({ categories }: { categories: TopCat[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [modal, setModal] = useState<ModalState>(null);

  const topOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  function remove(id: string) {
    if (!window.confirm("Delete this category?")) return;
    start(async () => {
      const res = await deleteCategory(id);
      if (res?.error) toast.error(res.error);
      else toast.success("Category deleted");
      router.refresh();
    });
  }
  function move(id: string, dir: "up" | "down") {
    start(async () => {
      await reorderCategory(id, dir);
      router.refresh();
    });
  }

  const Row = ({ cat, child }: { cat: Cat; child?: boolean }) => (
    <div className={`flex items-center gap-3 rounded-card border border-line bg-card p-3 ${child ? "ml-8" : ""}`}>
      <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-[#0d1015]">
        {cat.imageUrl && <Image src={cat.imageUrl} alt={cat.name} fill sizes="44px" className="object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px]">{cat.name}</div>
        <div className="text-[11px] text-muted">/{cat.slug} · {cat._count.products} product{cat._count.products === 1 ? "" : "s"}</div>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => move(cat.id, "up")} disabled={pending} className="text-muted hover:text-gold disabled:opacity-30" aria-label="Move up"><ChevronUp className="h-4 w-4" /></button>
        <button onClick={() => move(cat.id, "down")} disabled={pending} className="text-muted hover:text-gold disabled:opacity-30" aria-label="Move down"><ChevronDown className="h-4 w-4" /></button>
      </div>
      {!child && (
        <button onClick={() => setModal({ mode: "create", parentId: cat.id })} className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] text-grey hover:border-line-gold" title="Add subcategory">
          <Plus className="h-3.5 w-3.5" /> Sub
        </button>
      )}
      <button onClick={() => setModal({ mode: "edit", cat })} className="text-muted hover:text-gold" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
      <button onClick={() => remove(cat.id)} disabled={pending} className="text-muted hover:text-red disabled:opacity-40" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="gold" onClick={() => setModal({ mode: "create", parentId: null })}>
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="space-y-3">
        {categories.length === 0 && <p className="rounded-card border border-line bg-card p-8 text-center text-sm text-muted">No categories yet — add your first one.</p>}
        {categories.map((cat) => (
          <div key={cat.id} className="space-y-2">
            <Row cat={cat} />
            {cat.children.map((child) => <Row key={child.id} cat={child} child />)}
          </div>
        ))}
      </div>

      {modal && (
        <CategoryModal
          modal={modal}
          topOptions={topOptions}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); router.refresh(); }}
        />
      )}
    </div>
  );
}

function CategoryModal({
  modal,
  topOptions,
  onClose,
  onDone,
}: {
  modal: Exclude<ModalState, null>;
  topOptions: { id: string; name: string }[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [pending, start] = useTransition();
  const editing = modal.mode === "edit" ? modal.cat : null;
  const initialParent = modal.mode === "create" ? modal.parentId : (editing?.parentId ?? null);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 p-4" onClick={onClose}>
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-panel border border-line-gold bg-bg p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted hover:text-cream"><X className="h-5 w-5" /></button>
        <h3 className="mb-4 font-serif text-xl">{editing ? "Edit Category" : modal.mode === "create" && modal.parentId ? "Add Subcategory" : "Add Category"}</h3>
        <form
          action={(fd) =>
            start(async () => {
              const res = editing ? await updateCategory(fd) : await createCategory(fd);
              if (res && "error" in res && res.error) { toast.error(res.error); return; }
              toast.success("Category saved");
              onDone();
            })
          }
        >
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <FormField label="Name"><Input name="name" defaultValue={editing?.name ?? ""} required placeholder="Furniture" /></FormField>

          <FormField label="Parent Category">
            <Select name="parentId" defaultValue={initialParent ?? ""}>
              <option value="">— None (top level) —</option>
              {topOptions.filter((o) => o.id !== editing?.id).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </Select>
          </FormField>

          {editing?.imageUrl && (
            <div className="relative mb-3 h-24 w-full overflow-hidden rounded-card border border-line">
              <Image src={editing.imageUrl} alt={editing.name} fill sizes="480px" className="object-cover" />
            </div>
          )}
          <FormField label="Image (upload)"><input type="file" name="imageFile" accept="image/*" className={fileInput} /></FormField>
          <FormField label="…or image URL"><Input name="imageUrl" defaultValue={editing?.imageUrl ?? ""} placeholder="https://…" /></FormField>

          <FormField label="Description"><Textarea name="description" defaultValue={editing?.description ?? ""} rows={2} /></FormField>
          <FormField label="Display Order"><Input type="number" name="displayOrder" defaultValue={String(editing?.displayOrder ?? 0)} /></FormField>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <FormField label="SEO Title"><Input name="seoTitle" defaultValue={editing?.seoTitle ?? ""} /></FormField>
            <FormField label="SEO Description"><Input name="seoDesc" defaultValue={editing?.seoDesc ?? ""} /></FormField>
          </div>

          <Button type="submit" variant="gold" loading={pending} className="w-full justify-center">Save Category</Button>
        </form>
      </div>
    </div>
  );
}
