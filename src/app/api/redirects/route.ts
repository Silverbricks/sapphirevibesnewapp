import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Full redirect list, consumed (and cached) by the edge middleware. */
export async function GET() {
  try {
    const rows = await db.redirect.findMany({ select: { from: true, to: true, permanent: true } });
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}
