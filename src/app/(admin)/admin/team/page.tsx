import { getTeamData } from "@/lib/data/admin";
import { getCurrentUser } from "@/lib/auth-helpers";
import { Panel, PanelHead } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { StaffTable } from "@/components/admin/StaffTable";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team & Access · Admin" };

export default async function TeamPage() {
  const [{ staff, logs }, me] = await Promise.all([getTeamData(), getCurrentUser()]);
  const canManage = me?.role === "SUPER_ADMIN";

  return (
    <>
      <PageHead title="Team & Access" subtitle="Admin accounts, roles, activity logs and security." />

      <div className="mb-[18px]">
        <StaffTable staff={staff} canManage={canManage} />
      </div>

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
