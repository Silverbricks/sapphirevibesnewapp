import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, isStaffRole } from "@/lib/auth-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers.join(","), ...rows.map((r) => r.map(csvCell).join(","))].join("\n");
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!isStaffRole(session?.user?.role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const type = new URL(req.url).searchParams.get("type") ?? "orders";

  let csv = "";
  let filename = "export.csv";

  if (type === "products") {
    const products = await db.product.findMany({
      orderBy: { name: "asc" },
      select: { sku: true, name: true, priceCents: true, stock: true, status: true, category: { select: { name: true } } },
    });
    csv = toCsv(
      ["SKU", "Name", "Price", "Stock", "Status", "Category"],
      products.map((p) => [p.sku, p.name, (p.priceCents / 100).toFixed(2), p.stock, p.status, p.category?.name ?? ""]),
    );
    filename = "products.csv";
  } else {
    const orders = await db.order.findMany({
      orderBy: { placedAt: "desc" },
      select: { number: true, status: true, totalCents: true, guestEmail: true, user: { select: { email: true } }, placedAt: true, _count: { select: { items: true } } },
    });
    csv = toCsv(
      ["Order", "Status", "Total", "Customer Email", "Items", "Date"],
      orders.map((o) => [o.number, o.status, (o.totalCents / 100).toFixed(2), o.user?.email ?? o.guestEmail ?? "", o._count.items, o.placedAt.toISOString()]),
    );
    filename = "orders.csv";
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
