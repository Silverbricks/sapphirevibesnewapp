"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Panel, Input, Textarea, FormField, Button } from "@/components/ui";
import { saveFaq, deleteFaq } from "@/actions/content";

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  position: number;
}

export function FaqManager({ faqs }: { faqs: Faq[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<Faq | null>(null);
  const [formKey, setFormKey] = useState(0);

  function reset() {
    setEditing(null);
    setFormKey((k) => k + 1);
  }

  return (
    <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_360px]">
      <Panel>
        <h3 className="mb-4 font-serif text-xl">FAQs ({faqs.length})</h3>
        {faqs.length === 0 && <p className="text-sm text-muted">No FAQs yet — add one on the right.</p>}
        <div className="space-y-2">
          {faqs.map((f) => (
            <div key={f.id} className="flex items-start gap-3 rounded-card border border-line p-3.5">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-[0.16em] text-gold">{f.category}</div>
                <div className="font-serif text-[15px]">{f.question}</div>
                <p className="mt-1 line-clamp-2 text-xs text-muted">{f.answer}</p>
              </div>
              <button onClick={() => setEditing(f)} className="text-muted hover:text-gold" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
              <button
                onClick={() => start(async () => { await deleteFaq(f.id); toast("FAQ deleted"); reset(); router.refresh(); })}
                disabled={pending}
                className="text-muted hover:text-red disabled:opacity-40"
                aria-label="Delete"
              ><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <h3 className="mb-4 font-serif text-lg">{editing ? "Edit FAQ" : "Add FAQ"}</h3>
        <form
          key={formKey}
          action={(fd) => start(async () => { await saveFaq(fd); toast.success("FAQ saved"); reset(); router.refresh(); })}
        >
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <FormField label="Category"><Input name="category" defaultValue={editing?.category ?? "General"} /></FormField>
          <FormField label="Position"><Input type="number" name="position" defaultValue={editing?.position ?? 0} /></FormField>
          <FormField label="Question"><Input name="question" defaultValue={editing?.question ?? ""} required /></FormField>
          <FormField label="Answer"><Textarea name="answer" defaultValue={editing?.answer ?? ""} rows={4} /></FormField>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="gold" loading={pending}>{editing ? "Update" : "Add FAQ"}</Button>
            {editing && <Button type="button" variant="ghost" onClick={reset}>Cancel</Button>}
          </div>
        </form>
      </Panel>
    </div>
  );
}
