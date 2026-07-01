import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { authConfig } from "./auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Google({ allowDangerousEmailAccountLinking: true }),
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds, request) => {
        const parsed = credentialsSchema.safeParse(creds);
        if (!parsed.success) return null;
        const email = parsed.data.email;
        const ip = request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
        const userAgent = request?.headers?.get("user-agent") || null;
        const user = await db.user.findUnique({ where: { email } });

        const log = (success: boolean) =>
          db.loginLog
            .create({ data: { email, ip, userAgent, success, userId: user?.id ?? null } })
            .catch(() => {});

        if (!user?.passwordHash || user.suspended) {
          await log(false);
          return null;
        }
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) {
          await log(false);
          return null;
        }
        await log(true);
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Block suspended accounts across all providers (incl. Google OAuth).
    async signIn({ user }) {
      if (!user?.email) return true;
      const dbUser = await db.user.findUnique({
        where: { email: user.email },
        select: { suspended: true },
      });
      return !dbUser?.suspended;
    },
    async jwt({ token, user }) {
      // On sign-in, enrich the token with role/customerType from the database.
      if (user?.id) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true, customerType: true },
        });
        token.uid = user.id;
        token.role = dbUser?.role;
        token.customerType = dbUser?.customerType;
      }
      return token;
    },
  },
});
