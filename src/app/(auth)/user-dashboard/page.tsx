import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Account" };

// Friendly entry URL for the customer dashboard.
export default async function UserDashboardEntry() {
  const session = await getSession();
  if (!session?.user) redirect("/login?callbackUrl=/account");
  redirect("/account");
}
