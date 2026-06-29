import { redirect } from "next/navigation";
import { getSession, isStaffRole } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

// Role-aware landing: staff → admin console, customers → account dashboard.
export default async function PostLogin() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (session.user.role === "MARKETING_MANAGER") redirect("/growth");
  redirect(isStaffRole(session.user.role) ? "/admin" : "/account");
}
