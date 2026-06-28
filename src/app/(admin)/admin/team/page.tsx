import { getTeamData } from "@/lib/data/admin";
import { Panel, PanelHead, Pill, Avatar, buttonClasses } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team & Access · Admin" };

function roleLabel(role: string) {
  return role.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}

export default async function TeamPage() {
  const { staff, logs } = await getTeamData();
  return (
    <>
      <PageHead
        title="Team & Access"
        subtitle="Admin accounts, roles, activity logs and security."
        actions={<span className={buttonClasses("gold", "md")}>+ Invite Member</span>}
      />

      <Panel className="mb-[18px] overflow-x-auto p-0">
        <table className="atable">
          <thead><tr><th>Member</th><th>Role</th><th>2FA</th><th>Last Active</th><th>Status</th></tr></thead>
          <tbody>
            {staff.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name ?? "?"} size={38} />
                    <div>
                      <div className="text-cream">{m.name}</div>
                      <div className="text-[11px] text-muted">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td><Pill color={m.role === "SUPER_ADMIN" ? "gold" : "blue"}>{roleLabel(m.role)}</Pill></td>
                <td>{m.twoFactorEnabled ? <Pill color="green">Enabled</Pill> : <Pill color="amber">Off</Pill>}</td>
                <td className="text-muted">{m.lastActiveAt ? timeAgo(m.lastActiveAt) : "—"}</td>
                <td><Pill color="green">Active</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel>
        <PanelHead title="Recent Activity Log" />
        {logs.map((l) => (
          <div key={l.id} className="flex items-center justify-between border-b border-line py-3.5 last:border-0">
            <div>
              <b className="text-sm font-normal">{l.actorName ?? "System"} — {l.action}</b>
              {l.targetType && <small className="block text-xs text-muted">{l.targetType}{l.targetId ? ` · ${l.targetId}` : ""}</small>}
            </div>
            <small className="text-xs text-muted">{timeAgo(l.createdAt)}</small>
          </div>
        ))}
      </Panel>
    </>
  );
}
