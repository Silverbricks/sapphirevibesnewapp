import Link from "next/link";
import { LogOut } from "lucide-react";
import { Avatar } from "@/components/ui";
import { AdminSearch } from "./AdminSearch";
import { NotificationsBell } from "./NotificationsBell";
import { getAdminNotifications } from "@/lib/data/admin";
import { logoutStaffAction } from "@/actions/auth";

export async function AdminTopbar({ name }: { name: string }) {
  const notifications = await getAdminNotifications();
  return (
    <div className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-line bg-bg/70 px-[30px] backdrop-blur-md">
      <AdminSearch />
      <div className="flex items-center gap-5">
        <Link href="/growth" className="text-xs tracking-[0.06em] text-muted hover:text-gold max-sm:hidden">
          Marketing &amp; Growth →
        </Link>
        <NotificationsBell items={notifications} />
        <Avatar name={name} size={36} />
        <form action={logoutStaffAction}>
          <button className="flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-gold" title="Sign out">
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            <span className="max-sm:hidden">Sign Out</span>
          </button>
        </form>
      </div>
    </div>
  );
}
