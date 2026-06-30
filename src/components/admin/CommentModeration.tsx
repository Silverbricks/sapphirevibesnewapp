"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Trash2 } from "lucide-react";
import { Pill, type PillColor } from "@/components/ui";
import { moderateComment, deleteComment } from "@/actions/content";

interface Comment {
  id: string;
  author: string;
  email: string | null;
  body: string;
  status: string;
  createdAt: Date | string;
  post: { title: string; slug: string };
}

const STATUS_COLOR: Record<string, PillColor> = {
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "grey",
};

export function CommentModeration({ comments }: { comments: Comment[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const act = (fn: () => Promise<unknown>, msg: string) =>
    start(async () => {
      await fn();
      toast(msg);
      router.refresh();
    });

  if (comments.length === 0) {
    return <p className="rounded-card border border-line bg-card p-8 text-center text-sm text-muted">No comments to moderate.</p>;
  }

  return (
    <div className="space-y-3">
      {comments.map((c) => (
        <div key={c.id} className="rounded-card border border-line bg-card p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <b className="text-sm font-normal">{c.author}</b>
              {c.email && <span className="text-xs text-muted">{c.email}</span>}
              <Pill color={STATUS_COLOR[c.status] ?? "grey"}>{c.status.charAt(0) + c.status.slice(1).toLowerCase()}</Pill>
            </div>
            <span className="text-xs text-muted">on “{c.post.title}”</span>
          </div>
          <p className="mb-3 whitespace-pre-line text-sm text-grey">{c.body}</p>
          <div className="flex items-center gap-2">
            {c.status !== "APPROVED" && (
              <button
                onClick={() => act(() => moderateComment(c.id, "APPROVED"), "Comment approved")}
                disabled={pending}
                className="inline-flex items-center gap-1 rounded-lg border border-green/40 px-3 py-1.5 text-xs text-green hover:bg-green/10 disabled:opacity-40"
              ><Check className="h-3.5 w-3.5" /> Approve</button>
            )}
            {c.status !== "REJECTED" && (
              <button
                onClick={() => act(() => moderateComment(c.id, "REJECTED"), "Comment rejected")}
                disabled={pending}
                className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs text-grey hover:border-line-gold disabled:opacity-40"
              ><X className="h-3.5 w-3.5" /> Reject</button>
            )}
            <button
              onClick={() => { if (window.confirm("Delete this comment?")) act(() => deleteComment(c.id), "Comment deleted"); }}
              disabled={pending}
              className="ml-auto text-muted hover:text-red disabled:opacity-40"
              aria-label="Delete"
            ><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}
