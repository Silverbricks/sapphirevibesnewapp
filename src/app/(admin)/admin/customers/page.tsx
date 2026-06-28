import { getAdminCustomers } from "@/lib/data/admin";
import { Panel, Pill, Avatar, StatCard, type PillColor } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { formatMoney, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customers · Admin" };

const TYPE_COLOR: Record<string, PillColor> = {
  RETAIL: "gold",
  VIP: "gold",
  TRADE: "blue",
  CORPORATE: "green",
};

export default async function AdminCustomersPage() {
  const { stats, customers } = await getAdminCustomers();
  return (
    <>
      <PageHead title="Customers" subtitle="Retail, trade and corporate accounts." />

      <div className="mb-[26px] grid grid-cols-1 gap-[18px] sm:grid-cols-3">
        <StatCard label="Total Customers" value={formatNumber(stats.total)} delta="growing" />
        <StatCard label="Trade Accounts" value={formatNumber(stats.trade)} delta="designers & architects" />
        <StatCard label="VIP / Corporate" value={formatNumber(stats.vipCorp)} delta="high value" />
      </div>

      <Panel className="overflow-x-auto p-0">
        <table className="atable">
          <thead>
            <tr><th>Customer</th><th>Type</th><th>Orders</th><th>Lifetime Value</th><th>Status</th></tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name ?? "?"} size={38} />
                    <div>
                      <div className="text-cream">{c.name}</div>
                      <div className="text-[11px] text-muted">{c.email}</div>
                    </div>
                  </div>
                </td>
                <td><Pill color={TYPE_COLOR[c.type] ?? "grey"}>{c.type}</Pill></td>
                <td>{c.orders}</td>
                <td className="font-serif text-base text-gold">{formatMoney(c.ltvCents)}</td>
                <td><Pill color="green">Active</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
