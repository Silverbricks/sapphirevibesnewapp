import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

// Edge middleware uses only the edge-safe config (no Prisma/bcrypt).
export const { auth: middleware } = NextAuth(authConfig);

type RedirectRow = { from: string; to: string; permanent: boolean };

// Module-level cache of admin-managed redirects (refreshed at most once per TTL).
let cache: { at: number; map: Map<string, RedirectRow> } | null = null;
const TTL = 60_000;

async function getRedirectMap(origin: string): Promise<Map<string, RedirectRow>> {
  if (cache && Date.now() - cache.at < TTL) return cache.map;
  try {
    const res = await fetch(`${origin}/api/redirects`, { headers: { "x-mw": "1" } });
    const rows = (await res.json()) as RedirectRow[];
    const map = new Map(rows.map((r) => [r.from, r]));
    cache = { at: Date.now(), map };
    return map;
  } catch {
    return cache?.map ?? new Map();
  }
}

export default middleware(async (req) => {
  const { pathname, origin } = req.nextUrl;
  // Apply admin-managed redirects on public paths (never /api or internal assets).
  if (!pathname.startsWith("/api") && !pathname.startsWith("/_next")) {
    const map = await getRedirectMap(origin);
    const hit = map.get(pathname);
    if (hit) {
      return NextResponse.redirect(new URL(hit.to, origin), hit.permanent ? 308 : 307);
    }
  }
  // Otherwise fall through — route protection is handled by authConfig.authorized.
});

export const config = {
  // Run on everything except static assets and the auth API.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
