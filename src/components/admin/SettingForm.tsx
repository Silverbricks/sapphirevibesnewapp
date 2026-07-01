"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Panel, Button } from "@/components/ui";

/** Wraps a settings section in a Panel + form that calls a server action returning { ok }. */
export function SettingForm({
  action,
  title,
  children,
  button = "Save Changes",
}: {
  action: (fd: FormData) => Promise<{ ok: boolean }>;
  title: string;
  children: React.ReactNode;
  button?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Panel>
      <h3 className="mb-4 font-serif text-[21px]">{title}</h3>
      <form
        action={(fd) =>
          start(async () => {
            await action(fd);
            toast.success(`${title} saved`);
            router.refresh();
          })
        }
      >
        {children}
        <Button type="submit" variant="gold" loading={pending}>{button}</Button>
      </form>
    </Panel>
  );
}
