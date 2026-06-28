import Image from "next/image";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { getInventory } from "@/lib/data/admin";
import { Panel, Pill, StockBar, buttonClasses, type PillColor } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inventory · Admin" };

const FILTERS = [
  { key: "all", label: "All Items" },
  { key: "in", label: "In Stock" },
  { key: "low", label: "Low Stock" },
  { key: "out", label: "Out of Stock" },
];

function stockStatus(stock: number, min: number): [string, PillColor, "green" | "amber" | "red"] {
  if (stock === 0) return ["Out of Stock", "red", "red"];
  if (stock <= min) return ["Low Stock", "amber", "amber"];
  return ["In Stock", "green", "green"];
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "all" } = await searchParams;
  const all = await getInventory();
  const items = all.filter((p) => {
    if (filter === "in") return p.stock > p.minStockLevel;
    if (filter === "low") return p.stock > 0 && p.stock <= p.minStockLevel;
    if (filter === "out") return p.stock === 0;
    return true;
  });
  const low = all.filter((p) => p.stock > 0 && p.stock <= p.minStockLevel).length;

  return (
    <>
      <PageHead
        title="Inventory"
        subtitle={`${all.length} SKUs across the catalogue · ${low} items low on stock.`}
        actions={
          <>
            <span className={buttonClasses("outline", "md")}>Import CSV</span>
            <Link href="/admin/products" className={buttonClasses("gold", "md")}><Plus className="h-4 w-4" /> Add Item</Link>
          </>
        }
      />

      <div className="mb-[18px] flex flex-wrap gap-2.5">
        {FILTERS.map((f) => (
          <Link key={f.key} href={`/admin/inventory?filter=${f.key}`} className={`fchip ${filter === f.key ? "fchip-on" : ""}`}>
            {f.label}
          </Link>
        ))}
      </div>

      <Panel className="overflow-x-auto p-0">
        <table className="atable">
          <thead>
            <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock Level</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {items.map((p) => {
              const [txt, pillColor, barTone] = stockStatus(p.stock, p.minStockLevel);
              return (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {p.images?.[0] && <Image src={p.images[0].url} alt={p.name} width={42} height={42} className="h-[42px] w-[42px] rounded-lg object-cover" />}
                      <div>
                        <div className="text-cream">{p.name}</div>
                        <div className="text-[11px] text-muted">{p.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td>{p.category.name}</td>
                  <td>{formatMoney(p.priceCents)}</td>
                  <td>
                    {p.stock} units
                    <StockBar value={p.stock} max={p.maxStock} tone={barTone} />
                  </td>
                  <td><Pill color={pillColor}>{txt}</Pill></td>
                  <td>
                    <Link href={`/admin/products/${p.id}`} className="text-muted hover:text-gold"><Pencil className="h-4 w-4" /></Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
