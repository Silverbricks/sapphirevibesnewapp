/**
 * Create or promote an admin account.
 * Usage (on the server, in the project dir):
 *   ADMIN_EMAIL=you@email.com ADMIN_PASSWORD='your-pass' ADMIN_NAME='Your Name' npm run db:create-admin
 *
 * ADMIN_ROLE defaults to SUPER_ADMIN (full admin + marketing access).
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

// Load .env (DATABASE_URL etc.) before the Prisma client connects — no extra dependency.
function loadEnv() {
  try {
    const env = fs.readFileSync(path.resolve(process.cwd(), ".env"), "utf8");
    for (const line of env.split("\n")) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m || process.env[m[1]] !== undefined) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  } catch {
    /* .env optional */
  }
}

loadEnv();
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
