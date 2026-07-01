import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSystemSettings } from "@/lib/data/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** System config consumed (and cached) by the edge middleware: redirects + maintenance. */
export async function GET() {
  try {
    const [redirects, system] = await Promise.all([
      db.redirect.findMany({ select: { from: true, to: true, permanent: true } }),
      getSystemSettings(),
    ]);
    return NextResponse.json({ redirects, maintenance: system.maintenance });
  } catch {
    return NextResponse.json({ redirects: [], maintenance: false });
  }
}
