import Link from "next/link";
import { Search, Bell } from "lucide-react";
import { Avatar } from "@/components/ui";

export function AdminTopbar({ name }: { name: string }) {
  return (
    <div className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-line bg-bg/70 px-[30px] backdrop-blur-md">
      <form action="/admin/products" className="flex w-[340px] max-w-[40vw] items-center gap-2.5 rounded-[9px] border border-line bg-panel px-3.5 py-2.5">
        <Search className="h-4 w-4 text-muted" strokeWidth={1.5} />
        <input name="q" placeholder="Search products, orders, customers…" className="w-full bg-transparent text-[13px] text-cream outline-none placeholder:text-muted" />
      </form>
      <div className="flex items-center gap-5">
        <Link href="/growth" className="text-xs tracking-[0.06em] text-muted hover:text-gold max-sm:hidden">
          Marketing &amp; Growth →
        </Link>
        <Bell className="h-5 w-5 text-grey" strokeWidth={1.5} />
        <Avatar name={name} size={36} />
      </div>
    </div>
  );
}
