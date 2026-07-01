import { redirect } from "next/navigation";
import { getSession, isStaffRole } from "@/lib/auth-helpers";
import { LoginForm } from "@/components/auth/AuthForms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Super Admin · Sign In" };

// Dedicated staff entry point. Signed-in staff go straight to the console.
export default async function SuperAdminPortal() {
  const session = await getSession();
  if (session?.user) {
    if (isStaffRole(session.user.role)) redirect("/admin");
    redirect("/account"); // signed in as a customer — send to their dashboard
  }
  return (
    <LoginForm
      callbackUrl="/admin"
      title="Super Admin"
      subtitle="Sign in to the Sapphire Vibes control center."
      staff
    />
  );
}
