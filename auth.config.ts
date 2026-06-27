import type { NextAuthConfig } from "next-auth";
import type { Role, CustomerType } from "@prisma/client";

export const STAFF_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "INVENTORY_MANAGER",
  "CATALOGUE_MANAGER",
  "CONTENT_EDITOR",
  "ORDER_FULFILMENT",
  "MARKETING_MANAGER",
  "FINANCE_MANAGER",
  "CUSTOMER_SUPPORT",
] as const;

/**
 * Edge-safe Auth.js config (imported by middleware). No database or bcrypt here —
 * the `jwt` callback (which queries Prisma) lives in auth.ts so it never enters the edge bundle.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    // shared session shape — also used by middleware to read role from the token
    session({ session, token }) {
      if (session.user) {
        if (token.uid) session.user.id = token.uid as string;
        if (token.role) session.user.role = token.role as Role;
        if (token.customerType)
          session.user.customerType = token.customerType as CustomerType;
      }
      return session;
    },
    // route protection (runs in middleware)
    authorized({ auth, request: { nextUrl } }) {
      const path = nextUrl.pathname;
      const user = auth?.user;
      const isLoggedIn = !!user;
      const role = user?.role;
      const isStaff = !!role && (STAFF_ROLES as readonly string[]).includes(role);

      if (path.startsWith("/account")) return isLoggedIn;
      if (path.startsWith("/admin")) return isStaff;
      if (path.startsWith("/growth"))
        return role === "MARKETING_MANAGER" || role === "SUPER_ADMIN";
      return true;
    },
  },
} satisfies NextAuthConfig;
