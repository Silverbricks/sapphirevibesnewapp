"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

/** Small inline delete control for table rows; calls a server action by id. */
export function RowDeleteButton({
  id,
  action,
  confirmLabel = "Delete this item?",
}: {
  id: string;
  action: (id: string) => Promise<unknown>;
  confirmLabel?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(confirmLabel)) return;
        start(async () => {
          await action(id);
          toast("Deleted");
          router.refresh();
        });
      }}
      className="text-muted hover:text-red disabled:opacity-40"
      aria-label="Delete"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
