import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, isStaffRole } from "@/lib/auth-helpers";
import { getOrders } from "@/lib/data/orders";

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
  const sp = new URL(req.url).searchParams;
  const type = sp.get("type") ?? "orders";

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
    // honor the same filters as the orders list
    const { orders } = await getOrders({
      status: sp.get("status") ?? "all",
      q: sp.get("q") ?? undefined,
      paymentMethod: sp.get("paymentMethod") ?? undefined,
      shippingMethod: sp.get("shippingMethod") ?? undefined,
      state: sp.get("state") ?? undefined,
      country: sp.get("country") ?? undefined,
      customer: sp.get("customer") ?? undefined,
      dateFrom: sp.get("dateFrom") ?? undefined,
      dateTo: sp.get("dateTo") ?? undefined,
      perPage: 10000,
    });
    csv = toCsv(
      ["Order", "Status", "Payment", "Total", "Customer", "Email", "Items", "Date"],
      orders.map((o) => [o.number, o.status, o.paymentStatus, (o.totalCents / 100).toFixed(2), o.customerName, o.user?.email ?? o.guestEmail ?? "", o._count.items, o.placedAt.toISOString()]),
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
