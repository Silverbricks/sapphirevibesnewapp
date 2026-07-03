import { getDispatchList } from "@/lib/data/orders";
import { getSiteSettings } from "@/lib/data/settings";
import { formatDate } from "@/lib/format";
import { PrintButton } from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";

function asObj(v: unknown): Record<string, string> {
  return v && typeof v === "object" ? (v as Record<string, string>) : {};
}

export default async function DispatchListPage() {
  const [orders, { store }] = await Promise.all([getDispatchList(), getSiteSettings()]);

  return (
    <>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <PrintButton />
        <span className="text-sm text-gray-500">{orders.length} orders to dispatch</span>
      </div>

      <div className="mb-6 border-b border-gray-300 pb-4">
        <div className="font-serif text-2xl font-semibold">{store.name} — Dispatch List</div>
        <div className="text-sm text-gray-600">Generated {formatDate(new Date())}</div>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-gray-500">No orders are packed or ready for dispatch.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const ship = asObj(o.shippingSnapshot);
            return (
              <div key={o.id} className="rounded border border-gray-300 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-semibold">{o.number}</div>
                    <div className="text-sm text-gray-600">{o.customerName} · {[ship.city, ship.region, ship.postalCode].filter(Boolean).join(" ")}</div>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <div>{o.status.replace(/_/g, " ")}</div>
                    <div>{o.carrier ?? "—"}</div>
                  </div>
                </div>
                <table className="mt-3 w-full border-collapse text-sm">
                  <tbody>
                    {o.items.map((it) => (
                      <tr key={it.id} className="border-b border-gray-100">
                        <td className="py-1.5">☐ {it.nameSnapshot}{it.colour ? ` · ${it.colour}` : ""}</td>
                        <td className="py-1.5 text-gray-600">{it.skuSnapshot}</td>
                        <td className="py-1.5 text-right font-medium">×{it.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
