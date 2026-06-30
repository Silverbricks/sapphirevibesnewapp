"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button, Input, Textarea, Select, FormField } from "@/components/ui";

export interface CreateField {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "checkbox";
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}

export function CreateButton({
  label,
  title,
  action,
  fields,
}: {
  label: string;
  title: string;
  action: (fd: FormData) => Promise<unknown>;
  fields: CreateField[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <>
      <Button variant="gold" onClick={() => setOpen(true)}>{label}</Button>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/70 p-6 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-md rounded-panel border border-line-gold bg-bg p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-2xl">{title}</h3>
              <button onClick={() => setOpen(false)} aria-label="Close"><X className="h-5 w-5 text-muted" /></button>
            </div>
            <form
              action={(fd) =>
                start(async () => {
                  await action(fd);
                  setOpen(false);
                  toast.success("Saved");
                  router.refresh();
                })
              }
            >
              {fields.map((f) => (
                <FormField key={f.name} label={f.label}>
                  {f.type === "textarea" ? (
                    <Textarea name={f.name} placeholder={f.placeholder} required={f.required} defaultValue={f.defaultValue} />
                  ) : f.type === "select" ? (
                    <Select name={f.name} defaultValue={f.defaultValue}>
                      {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  ) : f.type === "checkbox" ? (
                    <label className="flex items-center gap-2 text-sm text-grey">
                      <input type="checkbox" name={f.name} className="h-4 w-4 accent-gold" /> Yes
                    </label>
                  ) : (
                    <Input name={f.name} type={f.type === "number" ? "number" : "text"} placeholder={f.placeholder} required={f.required} defaultValue={f.defaultValue} />
                  )}
                </FormField>
              ))}
              <Button type="submit" variant="gold" loading={pending} className="w-full justify-center">Save</Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
