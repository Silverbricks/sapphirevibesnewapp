import Link from "next/link";
import { requireModule } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { PageHead } from "@/components/admin/PageHead";
import { CreateManualOrderForm } from "@/components/admin/orders/CreateManualOrderForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "New Order · Admin" };

export default async function NewOrderPage() {
  await requireModule("orders");
  const products = await db.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, sku: true, priceCents: true },
  });

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-block text-xs uppercase tracking-[0.12em] text-gold">← All orders</Link>
      <PageHead title="New Manual Order" subtitle="Create an order on behalf of a customer (phone, trade, or in-store)." />
      <CreateManualOrderForm products={products} />
    </>
  );
}
