import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

// Edge middleware uses only the edge-safe config (no Prisma/bcrypt).
export const { auth: middleware } = NextAuth(authConfig);

type RedirectRow = { from: string; to: string; permanent: boolean };
type SystemConfig = { map: Map<string, RedirectRow>; maintenance: boolean };

// Module-level cache of admin-managed system config (refreshed at most once per TTL).
let cache: { at: number; config: SystemConfig } | null = null;
const TTL = 60_000;

async function getSystemConfig(origin: string): Promise<SystemConfig> {
  if (cache && Date.now() - cache.at < TTL) return cache.config;
  try {
    const res = await fetch(`${origin}/api/redirects`, { headers: { "x-mw": "1" } });
    const data = (await res.json()) as { redirects: RedirectRow[]; maintenance: boolean };
    const config: SystemConfig = {
      map: new Map(data.redirects.map((r) => [r.from, r])),
      maintenance: !!data.maintenance,
    };
    cache = { at: Date.now(), config };
    return config;
  } catch {
    return cache?.config ?? { map: new Map(), maintenance: false };
  }
}

export default middleware(async (req) => {
  const { pathname, origin } = req.nextUrl;

  // Admin-managed system config applies to public paths only (never /api or assets).
  if (!pathname.startsWith("/api") && !pathname.startsWith("/_next")) {
    const { map, maintenance } = await getSystemConfig(origin);

    const hit = map.get(pathname);
    if (hit) {
      return NextResponse.redirect(new URL(hit.to, origin), hit.permanent ? 308 : 307);
    }

    // Maintenance mode: hide the storefront but keep staff consoles + auth reachable.
    if (
      maintenance &&
      pathname !== "/maintenance" &&
      !pathname.startsWith("/admin") &&
      !pathname.startsWith("/growth") &&
      !pathname.startsWith("/account") &&
      !pathname.startsWith("/login") &&
      !pathname.startsWith("/uploads")
    ) {
      return NextResponse.rewrite(new URL("/maintenance", origin));
    }
  }
  // Otherwise fall through — route protection is handled by authConfig.authorized.
});

export const config = {
  // Run on everything except static assets and the auth API.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
