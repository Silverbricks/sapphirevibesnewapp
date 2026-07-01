import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, isStaffRole } from "@/lib/auth-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSession();
  if (!isStaffRole(session?.user?.role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ products: [], orders: [], customers: [], posts: [] });

  const like = { contains: q, mode: "insensitive" as const };
  const [products, orders, customers, posts] = await Promise.all([
    db.product.findMany({ where: { OR: [{ name: like }, { sku: like }] }, take: 5, select: { id: true, name: true, sku: true } }),
    db.order.findMany({ where: { number: like }, take: 5, select: { id: true, number: true, status: true } }),
    db.user.findMany({ where: { role: "CUSTOMER", OR: [{ name: like }, { email: like }] }, take: 5, select: { id: true, name: true, email: true } }),
    db.blogPost.findMany({ where: { title: like }, take: 5, select: { id: true, title: true } }),
  ]);

  return NextResponse.json({ products, orders, customers, posts });
}
