"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Flag, X } from "lucide-react";
import { moderateReview } from "@/actions/admin";

export function ReviewModeration({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function act(status: string) {
    startTransition(async () => {
      await moderateReview(id, status);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <button onClick={() => act("PUBLISHED")} disabled={pending} title="Approve" className="text-muted hover:text-green disabled:opacity-50">
        <Check className="h-4 w-4" />
      </button>
      <button onClick={() => act("FLAGGED")} disabled={pending} title="Flag" className="text-muted hover:text-amber disabled:opacity-50">
        <Flag className="h-4 w-4" />
      </button>
      <button onClick={() => act("REJECTED")} disabled={pending} title="Reject" className="text-muted hover:text-red disabled:opacity-50">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
