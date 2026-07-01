import Link from "next/link";
import { ShoppingBag, Boxes, Star, MessageSquare, UserPlus } from "lucide-react";
import { getAdminNotifications } from "@/lib/data/admin";
import { Panel } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications · Admin" };

const ICONS = { order: ShoppingBag, stock: Boxes, review: Star, comment: MessageSquare, customer: UserPlus } as const;

export default async function NotificationsPage() {
  const items = await getAdminNotifications();
  return (
    <>
      <PageHead title="Notifications" subtitle="Orders, low stock, reviews, comments and new customers that need attention." />
      <Panel>
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">You’re all caught up. 🎉</p>
        ) : (
          items.map((n) => {
            const Icon = ICONS[n.type];
            return (
              <Link key={n.id} href={n.href} className="flex items-center gap-4 border-b border-line py-4 last:border-0 hover:bg-white/[0.02]">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/10"><Icon className="h-4 w-4 text-gold" strokeWidth={1.5} /></span>
                <span className="flex-1 text-sm text-grey">{n.text}</span>
                <span className="text-xs text-muted">{timeAgo(n.at)}</span>
              </Link>
            );
          })
        )}
      </Panel>
    </>
  );
}
