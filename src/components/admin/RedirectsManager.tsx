"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, ArrowRight } from "lucide-react";
import { Panel, Input, Select, FormField, Button, Pill } from "@/components/ui";
import { createRedirect, deleteRedirect } from "@/actions/seo";

interface Redirect {
  id: string;
  from: string;
  to: string;
  permanent: boolean;
  hits: number;
}

export function RedirectsManager({ redirects }: { redirects: Redirect[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [formKey, setFormKey] = useState(0);

  return (
    <Panel>
      <h3 className="mb-1 font-serif text-[21px]">URL Redirects</h3>
      <p className="mb-4 text-sm text-muted">Send old or moved URLs to a new location (301 permanent or 302 temporary).</p>

      <form
        key={formKey}
        action={(fd) =>
          start(async () => {
            const res = await createRedirect(fd);
            if (res?.error) { toast.error(res.error); return; }
            toast.success("Redirect saved");
            setFormKey((k) => k + 1);
            router.refresh();
          })
        }
        className="mb-5 grid grid-cols-1 gap-x-4 sm:grid-cols-[1fr_1fr_130px_auto] sm:items-end"
      >
        <FormField label="From (old path)"><Input name="from" placeholder="/old-url" required /></FormField>
        <FormField label="To (destination)"><Input name="to" placeholder="/new-url" required /></FormField>
        <FormField label="Type">
          <Select name="permanent" defaultValue="true">
            <option value="true">301</option>
            <option value="false">302</option>
          </Select>
        </FormField>
        <div className="mb-4"><Button type="submit" variant="gold" loading={pending}>Add</Button></div>
      </form>

      {redirects.length === 0 ? (
        <p className="text-sm text-muted">No redirects configured.</p>
      ) : (
        <div className="space-y-2">
          {redirects.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-card border border-line p-3 text-sm">
              <code className="text-grey">{r.from}</code>
              <ArrowRight className="h-3.5 w-3.5 text-muted" />
              <code className="text-cream">{r.to}</code>
              <Pill color={r.permanent ? "green" : "amber"}>{r.permanent ? "301" : "302"}</Pill>
              <span className="ml-auto text-xs text-muted">{r.hits} hits</span>
              <button
                onClick={() => start(async () => { await deleteRedirect(r.id); toast("Redirect removed"); router.refresh(); })}
                disabled={pending}
                className="text-muted hover:text-red disabled:opacity-40"
                aria-label="Delete"
              ><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
