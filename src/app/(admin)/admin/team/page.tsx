import { getTeamData } from "@/lib/data/admin";
import { getCurrentUser, requireModule } from "@/lib/auth-helpers";
import { Panel, PanelHead, Pill } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { StaffTable } from "@/components/admin/StaffTable";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team & Access · Admin" };

export default async function TeamPage() {
  await requireModule("team");
  const [{ staff, logs, logins }, me] = await Promise.all([getTeamData(), getCurrentUser()]);
  const canManage = me?.role === "SUPER_ADMIN";

  return (
    <>
      <PageHead title="Team & Access" subtitle="Admin accounts, roles, permissions, login history and audit trail." />

      <div className="mb-[18px]">
        <StaffTable staff={staff} canManage={canManage} />
      </div>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <Panel>
          <PanelHead title="Login History" />
          {logins.length === 0 && <p className="py-3 text-sm text-muted">No sign-in attempts recorded yet.</p>}
          {logins.map((l) => (
            <div key={l.id} className="flex items-center justify-between border-b border-line py-3 last:border-0">
              <div>
                <b className="text-sm font-normal">{l.email}</b>
                <small className="block text-xs text-muted">{l.ip ?? "unknown IP"}</small>
              </div>
              <div className="flex items-center gap-3">
                <Pill color={l.success ? "green" : "red"}>{l.success ? "Success" : "Failed"}</Pill>
                <small className="text-xs text-muted">{timeAgo(l.createdAt)}</small>
              </div>
            </div>
          ))}
        </Panel>

        <Panel>
          <PanelHead title="Recent Activity Log" />
          {logs.map((l) => (
            <div key={l.id} className="flex items-center justify-between border-b border-line py-3 last:border-0">
              <div>
                <b className="text-sm font-normal">{l.actorName ?? "System"} — {l.action}</b>
                {l.targetType && <small className="block text-xs text-muted">{l.targetType}{l.targetId ? ` · ${l.targetId}` : ""}</small>}
              </div>
              <small className="text-xs text-muted">{timeAgo(l.createdAt)}</small>
            </div>
          ))}
        </Panel>
      </div>
    </>
  );
}
