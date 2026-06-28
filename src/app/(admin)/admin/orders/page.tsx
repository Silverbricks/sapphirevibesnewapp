import Link from "next/link";
import { Eye } from "lucide-react";
import { getAdminOrders } from "@/lib/data/admin";
import { Panel, buttonClasses } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { formatMoney, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders · Admin" };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "PROCESSING", label: "Processing" },
  { key: "PACKED", label: "Packed" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "RETURNED", label: "Returns" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "all" } = await searchParams;
  const orders = await getAdminOrders(status);

  return (
    <>
      <PageHead
        title="Orders"
        subtitle="Process, fulfil and track customer orders."
        actions={<span className={buttonClasses("outline", "md")}>Export Orders</span>}
      />

      <div className="mb-[18px] flex flex-wrap gap-2.5">
        {FILTERS.map((f) => (
          <Link key={f.key} href={`/admin/orders?status=${f.key}`} className={`fchip ${status === f.key ? "fchip-on" : ""}`}>
            {f.label}
          </Link>
        ))}
      </div>

      <Panel className="overflow-x-auto p-0">
        <table className="atable">
          <thead>
            <tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th></th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="text-gold">{o.number}</td>
                <td>{o.customerName}</td>
                <td>{o._count.items}</td>
                <td>{formatMoney(o.totalCents)}</td>
                <td>{o.paymentMethod.replace(/_/g, " ")}</td>
                <td><OrderStatusSelect orderId={o.id} current={o.status} /></td>
                <td className="text-muted">{formatDate(o.placedAt)}</td>
                <td><Link href={`/admin/orders/${o.number}`} className="text-muted hover:text-gold"><Eye className="h-4 w-4" /></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
