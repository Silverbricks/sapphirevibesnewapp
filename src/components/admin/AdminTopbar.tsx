import Link from "next/link";
import { Avatar } from "@/components/ui";
import { AdminSearch } from "./AdminSearch";
import { NotificationsBell } from "./NotificationsBell";
import { getAdminNotifications } from "@/lib/data/admin";

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
      </div>
    </div>
  );
}
