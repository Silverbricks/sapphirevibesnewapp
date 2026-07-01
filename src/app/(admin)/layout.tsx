import { requireStaff } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { formatCompact } from "@/lib/format";
import { allowedModules } from "@/lib/permissions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireStaff();
  const [productCount, pendingOrders, pendingReviews, dbUser] = await Promise.all([
    db.product.count(),
    db.order.count({ where: { status: { in: ["PENDING", "PROCESSING", "PACKED"] } } }),
    db.review.count({ where: { status: { in: ["PENDING", "FLAGGED"] } } }),
    db.user.findUnique({ where: { id: staff.id }, select: { permissions: true } }),
  ]);
  const allowed = allowedModules(staff.role, dbUser?.permissions);

  return (
    <div className="min-h-screen">
      <AdminSidebar
        counts={{ inventory: formatCompact(productCount), orders: pendingOrders, reviews: pendingReviews }}
        allowed={allowed}
      />
      <div className="ml-[248px] min-w-0 max-lg:ml-[64px]">
        <AdminTopbar name={staff.name ?? "Admin"} />
        <div className="p-[30px]">{children}</div>
      </div>
    </div>
  );
}
