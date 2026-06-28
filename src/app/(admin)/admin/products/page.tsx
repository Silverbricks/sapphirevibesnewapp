import Image from "next/image";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { getAdminProducts } from "@/lib/data/admin";
import { Panel, Pill, ProductBadgeChip, buttonClasses } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { formatMoney, formatNumber } from "@/lib/format";
import type { ProductBadgeKey } from "@/lib/badges";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products · Admin" };

export default async function ProductsPage() {
  const products = await getAdminProducts();

  return (
    <>
      <PageHead
        title="Products"
        subtitle="Full CRUD, variants, badges and catalogue management."
        actions={
          <Link href="/admin/products/new" className={buttonClasses("gold", "md")}>
            <Plus className="h-4 w-4" /> New Product
          </Link>
        }
      />

      <Panel className="overflow-x-auto p-0">
        <table className="atable">
          <thead>
            <tr><th>Product</th><th>Brand</th><th>Price</th><th>Badges</th><th>Sales</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="flex items-center gap-3">
                    {p.images[0] && <Image src={p.images[0].url} alt={p.name} width={42} height={42} className="h-[42px] w-[42px] rounded-lg object-cover" />}
                    <div>
                      <div className="text-cream">{p.name}</div>
                      <div className="text-[11px] text-muted">{p.sku}</div>
                    </div>
                  </div>
                </td>
                <td>{p.brand?.name ?? "—"}</td>
                <td>{formatMoney(p.priceCents)}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {(p.badges as ProductBadgeKey[]).slice(0, 2).map((b) => (
                      <ProductBadgeChip key={b} badge={b} />
                    ))}
                  </div>
                </td>
                <td>{formatNumber(p.salesCount)}</td>
                <td>
                  <Pill color={p.status === "ACTIVE" ? "green" : p.status === "DRAFT" ? "amber" : "grey"}>
                    {p.status === "ACTIVE" ? "Published" : p.status === "DRAFT" ? "Draft" : "Archived"}
                  </Pill>
                </td>
                <td>
                  <Link href={`/admin/products/${p.id}`} className="text-muted hover:text-gold"><Pencil className="h-4 w-4" /></Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
