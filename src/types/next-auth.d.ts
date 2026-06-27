import type { Role, CustomerType } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      customerType: CustomerType;
    } & DefaultSession["user"];
  }
  interface User {
    role?: Role;
    customerType?: CustomerType;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: Role;
    customerType?: CustomerType;
  }
}
