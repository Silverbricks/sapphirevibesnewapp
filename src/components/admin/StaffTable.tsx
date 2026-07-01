"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, X, Settings2 } from "lucide-react";
import { Avatar, Pill, Button, Input, Select, FormField, Toggle } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import {
  saveStaffMember,
  updateStaffRole,
  setStaffSuspended,
  resetStaffPassword,
  setTwoFactor,
  updateStaffPermissions,
  type StaffState,
} from "@/actions/admin";
import { MODULES, MODULE_LABELS, allowedModules, type Module } from "@/lib/permissions";

const ROLES = [
  "SUPER_ADMIN", "ADMIN", "INVENTORY_MANAGER", "CATALOGUE_MANAGER", "CONTENT_EDITOR",
  "ORDER_FULFILMENT", "MARKETING_MANAGER", "FINANCE_MANAGER", "CUSTOMER_SUPPORT",
];
const label = (r: string) => r.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");

interface Staff {
  id: string;
  name: string | null;
  email: string;
  role: string;
  twoFactorEnabled: boolean;
  suspended: boolean;
  permissions: unknown;
  lastActiveAt: Date | null;
}

export function StaffTable({ staff, canManage }: { staff: Staff[]; canManage: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [managing, setManaging] = useState<Staff | null>(null);
  const [state, formAction, pending] = useActionState<StaffState, FormData>(saveStaffMember, undefined);

  useEffect(() => {
    if (state?.ok) {
      setOpen(false);
      toast.success("Member saved");
      router.refresh();
    }
  }, [state, router]);

  return (
    <div>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <Button variant="gold" onClick={() => setOpen((v) => !v)}>
            <UserPlus className="h-4 w-4" /> Invite Member
          </Button>
        </div>
      )}

      {open && (
        <form action={formAction} className="mb-4 rounded-card border border-line bg-card p-5">
          <h3 className="mb-4 font-serif text-xl">Invite / Update Member</h3>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <FormField label="Full Name"><Input name="name" placeholder="Jordan Blake" /></FormField>
            <FormField label="Email"><Input name="email" type="email" required placeholder="staff@sapphirevibes.au" /></FormField>
            <FormField label="Role">
              <Select name="role" defaultValue="ADMIN">
                {ROLES.map((r) => <option key={r} value={r}>{label(r)}</option>)}
              </Select>
            </FormField>
            <FormField label="Password (min 6)"><Input name="password" type="password" placeholder="Set for new members" /></FormField>
          </div>
          {state?.error && <p className="mb-3 text-sm text-red">{state.error}</p>}
          <Button type="submit" variant="gold" loading={pending}>Save Member</Button>
        </form>
      )}

      <div className="overflow-x-auto rounded-card border border-line bg-card">
        <table className="atable">
          <thead><tr><th>Member</th><th>Role</th><th>2FA</th><th>Last Active</th><th>Status</th>{canManage && <th></th>}</tr></thead>
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
                <td><Pill color={m.role === "SUPER_ADMIN" ? "gold" : "blue"}>{label(m.role)}</Pill></td>
                <td>{m.twoFactorEnabled ? <Pill color="green">Enabled</Pill> : <Pill color="amber">Off</Pill>}</td>
                <td className="text-muted">{m.lastActiveAt ? timeAgo(m.lastActiveAt) : "—"}</td>
                <td>{m.suspended ? <Pill color="red">Suspended</Pill> : <Pill color="green">Active</Pill>}</td>
                {canManage && (
                  <td className="text-right">
                    <button onClick={() => setManaging(m)} className="inline-flex items-center gap-1 text-gold hover:underline">
                      <Settings2 className="h-3.5 w-3.5" /> Manage
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {managing && <ManageModal member={managing} onClose={() => setManaging(null)} />}
    </div>
  );
}

function ManageModal({ member, onClose }: { member: Staff; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [role, setRole] = useState(member.role);
  const [twoFA, setTwoFA] = useState(member.twoFactorEnabled);
  const [pwd, setPwd] = useState("");
  const effective = allowedModules(role, member.permissions);
  const [mods, setMods] = useState<Set<string>>(new Set(effective));

  const refresh = () => router.refresh();

  const run = (fn: () => Promise<unknown>, msg: string) =>
    start(async () => { await fn(); toast.success(msg); refresh(); });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 p-4" onClick={onClose}>
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-panel border border-line-gold bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted hover:text-cream"><X className="h-5 w-5" /></button>
        <h3 className="mb-1 font-serif text-xl">{member.name}</h3>
        <p className="mb-5 text-xs text-muted">{member.email}</p>

        <div className="space-y-5">
          <div>
            <FormField label="Role">
              <Select value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => <option key={r} value={r}>{label(r)}</option>)}
              </Select>
            </FormField>
            <Button variant="dark" size="sm" loading={pending} onClick={() => run(() => updateStaffRole(member.id, role), "Role updated")}>Save Role</Button>
          </div>

          <div className="flex items-center justify-between border-t border-line pt-4">
            <div><div className="text-sm">Two-Factor Authentication</div><div className="text-xs text-muted">Require 2FA at sign-in</div></div>
            <Toggle checked={twoFA} onChange={(v) => { setTwoFA(v); run(() => setTwoFactor(member.id, v), "2FA updated"); }} />
          </div>

          <div className="flex items-center justify-between border-t border-line pt-4">
            <div><div className="text-sm">Account {member.suspended ? "Suspended" : "Active"}</div><div className="text-xs text-muted">Suspended members cannot sign in</div></div>
            <Button
              variant={member.suspended ? "gold" : "dark"}
              size="sm"
              loading={pending}
              onClick={() => run(() => setStaffSuspended(member.id, !member.suspended), member.suspended ? "Reinstated" : "Suspended")}
            >
              {member.suspended ? "Reinstate" : "Suspend"}
            </Button>
          </div>

          <div className="border-t border-line pt-4">
            <FormField label="Reset Password (min 6)">
              <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="New password" />
            </FormField>
            <Button
              variant="dark"
              size="sm"
              loading={pending}
              onClick={() => {
                if (pwd.length < 6) { toast.error("Password must be at least 6 characters"); return; }
                run(async () => { await resetStaffPassword(member.id, pwd); setPwd(""); }, "Password reset");
              }}
            >Reset Password</Button>
          </div>

          <div className="border-t border-line pt-4">
            <div className="mb-2 text-[11px] uppercase tracking-[0.12em] text-muted">Module Permissions</div>
            {role === "SUPER_ADMIN" || role === "ADMIN" ? (
              <p className="text-xs text-muted">Admins and Super Admins have full access to every module.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-1.5">
                  {MODULES.map((mod: Module) => (
                    <label key={mod} className="flex items-center gap-2 text-sm text-grey">
                      <input
                        type="checkbox"
                        checked={mods.has(mod)}
                        onChange={(e) => setMods((s) => { const n = new Set(s); e.target.checked ? n.add(mod) : n.delete(mod); return n; })}
                        className="accent-gold"
                      />
                      {MODULE_LABELS[mod]}
                    </label>
                  ))}
                </div>
                <Button
                  variant="gold"
                  size="sm"
                  className="mt-4"
                  loading={pending}
                  onClick={() => run(() => updateStaffPermissions(member.id, [...mods]), "Permissions saved")}
                >Save Permissions</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
