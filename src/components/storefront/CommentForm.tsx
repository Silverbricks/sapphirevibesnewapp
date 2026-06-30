"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input, Textarea, FormField, Button } from "@/components/ui";
import { submitComment } from "@/actions/content";

export function CommentForm({ postId }: { postId: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);

  if (submitted) {
    return (
      <p className="rounded-card border border-line-gold bg-card p-5 text-sm text-grey">
        Thank you — your comment has been submitted and will appear once approved.
      </p>
    );
  }

  return (
    <form
      action={async (fd) => {
        setPending(true);
        const res = await submitComment(postId, fd);
        setPending(false);
        if (res && "error" in res && res.error) {
          toast.error(res.error);
          return;
        }
        setSubmitted(true);
        toast.success("Comment submitted for review");
      }}
    >
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <FormField label="Name"><Input name="author" required /></FormField>
        <FormField label="Email (optional, not published)"><Input name="email" type="email" /></FormField>
      </div>
      <FormField label="Comment"><Textarea name="body" rows={4} required /></FormField>
      <Button type="submit" variant="gold" loading={pending}>Post Comment</Button>
    </form>
  );
}
