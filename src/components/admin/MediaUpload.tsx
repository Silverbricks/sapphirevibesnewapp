"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { Panel, Input, FormField, Button } from "@/components/ui";
import { uploadMedia } from "@/actions/media";

export function MediaUpload({ folders }: { folders: string[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [formKey, setFormKey] = useState(0);

  return (
    <Panel className="mb-5">
      <h3 className="mb-4 flex items-center gap-2 font-serif text-lg"><UploadCloud className="h-5 w-5 text-gold" /> Upload Media</h3>
      <form
        key={formKey}
        action={(fd) =>
          start(async () => {
            const res = await uploadMedia(fd);
            toast.success(`${res.saved} file${res.saved === 1 ? "" : "s"} uploaded`);
            setFormKey((k) => k + 1);
            router.refresh();
          })
        }
        className="grid grid-cols-1 gap-x-4 sm:grid-cols-[1fr_200px_160px_auto] sm:items-end"
      >
        <FormField label="Images (multiple allowed)">
          <input type="file" name="files" accept="image/*" multiple required className="block w-full text-sm text-muted file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gold file:px-4 file:py-2 file:font-medium file:text-ink hover:file:bg-gold-soft" />
        </FormField>
        <FormField label="Folder">
          <Input name="folder" defaultValue="general" list="media-folders" />
          <datalist id="media-folders">{folders.map((f) => <option key={f} value={f} />)}</datalist>
        </FormField>
        <FormField label="Alt text (optional)"><Input name="alt" placeholder="Describe the image" /></FormField>
        <div className="mb-4"><Button type="submit" variant="gold" loading={pending}>Upload</Button></div>
      </form>
    </Panel>
  );
}
