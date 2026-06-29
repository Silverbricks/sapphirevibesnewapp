/**
 * Create or promote an admin account.
 * Usage (on the server, in the project dir):
 *   ADMIN_EMAIL=you@email.com ADMIN_PASSWORD='your-pass' ADMIN_NAME='Your Name' npm run db:create-admin
 *
 * ADMIN_ROLE defaults to SUPER_ADMIN (full admin + marketing access).
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Store Owner";
  const role = (process.env.ADMIN_ROLE?.trim() || "SUPER_ADMIN") as Role;

  if (!email || !password) {
    console.error("✗ Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.");
    process.exit(1);
  }
  if (password.length < 6) {
    console.error("✗ Password must be at least 6 characters.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.upsert({
    where: { email },
    update: { passwordHash, role, name },
    create: {
      email,
      name,
      passwordHash,
      role,
      referralCode: `OWNER${Math.floor(1000 + Math.random() * 9000)}`,
    },
  });

  console.log(`✅ ${user.email} is now ${user.role}.`);
  console.log("   Sign in at /login, then open /admin (and /growth).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
