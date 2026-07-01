import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Flips due scheduled blog posts to PUBLISHED. Call on a schedule (e.g. a VPS cron
 * hitting /api/cron/publish?secret=…). Secured by CRON_SECRET when it is set.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = req.headers.get("x-cron-secret") || new URL(req.url).searchParams.get("secret");
    if (provided !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await db.blogPost.updateMany({
    where: { status: "SCHEDULED", publishedAt: { lte: new Date() } },
    data: { status: "PUBLISHED" },
  });

  if (result.count > 0) {
    revalidatePath("/blog");
    revalidatePath("/admin/content/blog");
  }
  return NextResponse.json({ published: result.count });
}
