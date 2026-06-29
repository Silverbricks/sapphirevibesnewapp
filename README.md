# Sapphire Vibes

Luxury home décor, lighting & gifts — a full-stack e-commerce platform with three coordinated
surfaces sharing one database: a **storefront**, a **customer dashboard**, an **admin console**,
and a **marketing & growth console**.

> Built with Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma · PostgreSQL · Auth.js v5.

---

## What's inside

**Storefront** — home (hero, shop-by-room, new arrivals, sculptural lighting, best sellers,
complete-the-look, loyalty/referral, reviews, recently viewed, newsletter), product listings &
filters, product detail (gallery, specs, reviews, Q&A, related), search, quick-view, product
compare, wishlist, cart, **checkout**, blog, CMS pages, and guest order tracking.

**Customer dashboard** (`/account`) — orders & order detail, order tracking, wishlist, rewards,
refer & earn, gift centre, my reviews, addresses, and account settings.

**Admin console** (`/admin`) — dashboard, inventory, products + a full product editor, categories,
collections, pricing, orders (with status updates), customers, review moderation, homepage CMS,
pages & blog, SEO, reports, settings, and team & access with an audit log.

**Marketing & growth console** (`/growth`) — growth hub, promotions, coupons, email, loyalty,
Sapphire Elite VIP tiers, referrals, gift centre, CRM segments, BI analytics, and integrations.

Authentication is **email/password + Google + guest checkout** with role-based access control
(customers vs. nine staff roles).

---

## Demo logins

After seeding, every account uses the password **`password123`**:

| Role | Email |
|---|---|
| Customer (VIP / Gold) | `amelia@email.com` |
| Super Admin | `admin@sapphirevibes.au` |
| Marketing Manager | `marketing@sapphirevibes.au` |
| Catalogue Manager | `priya@sapphirevibes.au` |

---

## Local development

Requires Node 20+ and a PostgreSQL database.

```bash
npm install
cp .env.example .env          # set DATABASE_URL + AUTH_SECRET
npx prisma migrate deploy     # create tables
npx prisma db seed            # load demo catalogue, orders, customers, etc.
npm run dev                   # http://localhost:3000
```

No local Postgres? Use the bundled Docker setup: `docker compose up -d` (then run the migrate/seed
commands above). The connection string for it is the default in `.env.example`.

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Auth.js secret (`npx auth secret`) |
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Optional — Google OAuth |

---

## Deployment

This repo deploys to a **Hostinger VPS** (Node + PostgreSQL + nginx). See:

- **[DEPLOY.md](DEPLOY.md)** — full step-by-step VPS guide + linking the GitHub repo.
- **[deploy-vps.sh](deploy-vps.sh)** — one-command fresh deploy:
  `curl -fsSL https://raw.githubusercontent.com/Silverbricks/sapphirevibesnewapp/main/deploy-vps.sh | bash`
- **[link-domain.sh](link-domain.sh)** — attach a domain + free HTTPS once DNS points at the VPS.
- **[.github/workflows/deploy.yml](.github/workflows/deploy.yml)** — optional auto-deploy on push.

---

## Project structure

```
src/app/(storefront)   storefront pages
src/app/(account)      customer dashboard
src/app/(admin)        admin console
src/app/(marketing)    marketing & growth console
src/app/(auth)         login / register
src/actions            server actions (cart, checkout, auth, account, admin, marketing)
src/lib/data           read layer (server-only Prisma queries)
src/components          ui primitives + per-surface components
prisma                 schema, migration, seed
```

Money is stored as integer cents throughout; formatting happens only at the display boundary
(`src/lib/format.ts`).
