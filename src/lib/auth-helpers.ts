import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "../../auth";
import { STAFF_ROLES } from "../../auth.config";

export async function getSession() {
  return auth();
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");
  return session.user;
}

export function isStaffRole(role?: Role | string | null): boolean {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}

export async function requireStaff() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (!isStaffRole(session.user.role)) redirect("/");
  return session.user;
}

export async function requireRole(...roles: Role[]) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!roles.includes(session.user.role)) redirect("/");
  return session.user;
}
