"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Avatar, Pill, Button, Input, Select, FormField } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import { saveStaffMember, updateStaffRole, type StaffState } from "@/actions/admin";

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
  lastActiveAt: Date | null;
}

export function StaffTable({ staff, canManage }: { staff: Staff[]; canManage: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<StaffState, FormData>(saveStaffMember, undefined);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (state?.ok) {
      setOpen(false);
      toast.success("Member saved");
      router.refresh();
    }
  }, [state, router]);

  function changeRole(id: string, role: string) {
    startTransition(async () => {
      await updateStaffRole(id, role);
      toast.success("Role updated");
      router.refresh();
    });
  }

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
                <td>
                  {canManage ? (
                    <Select value={m.role} onChange={(e) => changeRole(m.id, e.target.value)} className="w-auto py-1.5 text-xs">
                      {ROLES.map((r) => <option key={r} value={r}>{label(r)}</option>)}
                    </Select>
                  ) : (
                    <Pill color={m.role === "SUPER_ADMIN" ? "gold" : "blue"}>{label(m.role)}</Pill>
                  )}
                </td>
                <td>{m.twoFactorEnabled ? <Pill color="green">Enabled</Pill> : <Pill color="amber">Off</Pill>}</td>
                <td className="text-muted">{m.lastActiveAt ? timeAgo(m.lastActiveAt) : "—"}</td>
                <td><Pill color="green">Active</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
