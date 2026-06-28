import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth-helpers";
import { GrowthSidebar } from "@/components/marketing/GrowthSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireRole(Role.MARKETING_MANAGER, Role.SUPER_ADMIN);

  return (
    <div className="min-h-screen">
      <GrowthSidebar />
      <div className="ml-[248px] min-w-0 max-lg:ml-[64px]">
        <AdminTopbar name={staff.name ?? "Marketing"} />
        <div className="p-[30px]">{children}</div>
      </div>
    </div>
  );
}
