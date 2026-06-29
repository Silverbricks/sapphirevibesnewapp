import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { requireUser, isStaffRole } from "@/lib/auth-helpers";
import { getUserProfile, getAccountSummary } from "@/lib/data/account";
import { db } from "@/lib/db";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await requireUser();
  const [profile, summary, wishlistCount] = await Promise.all([
    getUserProfile(sessionUser.id),
    getAccountSummary(sessionUser.id),
    db.wishlistItem.count({ where: { userId: sessionUser.id } }),
  ]);

  return (
    <>
      <Header />
      <div className="wrap-narrow grid grid-cols-1 gap-8 py-9 lg:grid-cols-[260px_1fr]">
        <AccountSidebar
          name={profile?.name ?? "Member"}
          email={profile?.email ?? ""}
          tier={profile?.vipTier?.name ?? "Silver"}
          counts={{ orders: summary.inProgress, wishlist: wishlistCount }}
          isStaff={isStaffRole(sessionUser.role)}
        />
        <main className="min-w-0">{children}</main>
      </div>
      <Footer />
    </>
  );
}
