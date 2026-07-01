"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Panel, Input, Textarea, Select, FormField, Toggle, Button, buttonClasses } from "@/components/ui";
import { RichTextEditor } from "./RichTextEditor";
import { SubmitButton } from "./SubmitButton";
import { saveBlogPost } from "@/actions/content";
import { generateBlogDraft } from "@/actions/ai";
import type { BlogMeta } from "@/lib/cms";

interface PostInit {
  id?: string;
  title?: string;
  category?: string;
  excerpt?: string | null;
  body?: string;
  coverUrl?: string | null;
  status?: string;
  meta?: BlogMeta;
}

export function BlogEditor({ post }: { post: PostInit }) {
  const meta = post.meta ?? {};
  const [status, setStatus] = useState(post.status ?? "DRAFT");
  const [featured, setFeatured] = useState(!!meta.featured);
  const [pinned, setPinned] = useState(!!meta.pinned);
  const [allowComments, setAllowComments] = useState(meta.allowComments !== false);

  const [title, setTitle] = useState(post.title ?? "");
  const [excerpt, setExcerpt] = useState(post.excerpt ?? "");
  const [body, setBody] = useState(post.body ?? "");
  const [bodyKey, setBodyKey] = useState(0);
  const [aiPending, startAi] = useTransition();

  function runAi() {
    if (!title.trim()) { toast.error("Enter a title first"); return; }
    startAi(async () => {
      const res = await generateBlogDraft(title);
      if ("error" in res && res.error) { toast.error(res.error); return; }
      if (res.ok) {
        setExcerpt(res.excerpt || excerpt);
        setBody(res.html);
        setBodyKey((k) => k + 1); // remount editor with the new content
        toast.success("Draft generated");
      }
    });
  }

  return (
    <form action={saveBlogPost} className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_320px]">
      {post.id && <input type="hidden" name="id" value={post.id} />}

      {/* main column */}
      <div className="space-y-[18px]">
        <Panel>
          <FormField label="Title"><Input name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The Art of Layering Light" required /></FormField>
          <FormField label="Excerpt (shown in listings)"><Textarea name="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} placeholder="A short summary of the article…" /></FormField>
          <FormField label="Body">
            <RichTextEditor key={bodyKey} name="body" defaultValue={body} />
          </FormField>
        </Panel>
      </div>

      {/* sidebar */}
      <div className="space-y-[18px]">
        <Panel>
          <h3 className="mb-2 flex items-center gap-2 font-serif text-lg"><Sparkles className="h-4 w-4 text-gold" /> AI Assistant</h3>
          <p className="mb-3 text-xs text-muted">Generate a full first draft and excerpt from your title. Review and edit before publishing.</p>
          <Button type="button" variant="dark" loading={aiPending} onClick={runAi}>Generate Draft</Button>
        </Panel>

        <Panel>
          <h3 className="mb-4 font-serif text-lg">Publish</h3>
          <FormField label="Status">
            <Select name="status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="SCHEDULED">Scheduled</option>
            </Select>
          </FormField>
          {status === "SCHEDULED" && (
            <FormField label="Publish at">
              <Input type="datetime-local" name="scheduledAt" defaultValue={meta.scheduledAt ?? ""} />
            </FormField>
          )}
          <div className="mt-2 flex flex-col gap-3">
            <ToggleRow label="Featured" checked={featured} onChange={setFeatured} name="featured" />
            <ToggleRow label="Pinned to top" checked={pinned} onChange={setPinned} name="pinned" />
            <ToggleRow label="Allow comments" checked={allowComments} onChange={setAllowComments} name="allowComments" />
          </div>
          <div className="mt-5 flex items-center gap-3">
            <SubmitButton>Save Post</SubmitButton>
            <Link href="/admin/content/blog" className={buttonClasses("ghost", "md")}>Cancel</Link>
          </div>
        </Panel>

        <Panel>
          <h3 className="mb-4 font-serif text-lg">Details</h3>
          <FormField label="Category"><Input name="category" defaultValue={post.category ?? ""} placeholder="Styling Tips" /></FormField>
          <FormField label="Author"><Input name="author" defaultValue={meta.author ?? ""} placeholder="Editorial Team" /></FormField>
          <FormField label="Tags (comma separated)"><Input name="tags" defaultValue={(meta.tags ?? []).join(", ")} placeholder="lighting, interiors" /></FormField>
        </Panel>

        <Panel>
          <h3 className="mb-4 font-serif text-lg">Cover Image</h3>
          {post.coverUrl && (
            <div className="relative mb-3 h-32 w-full overflow-hidden rounded-card border border-line">
              <Image src={post.coverUrl} alt="Cover" fill sizes="320px" className="object-cover" />
            </div>
          )}
          <FormField label="Upload">
            <input type="file" name="coverFile" accept="image/*" className="block w-full text-sm text-muted file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gold file:px-4 file:py-2 file:font-medium file:text-ink hover:file:bg-gold-soft" />
          </FormField>
          <FormField label="…or image URL"><Input name="coverUrl" defaultValue={post.coverUrl ?? ""} placeholder="https://…" /></FormField>
        </Panel>
      </div>
    </form>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  name,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  name: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-grey">{label}</span>
      <Toggle checked={checked} onChange={onChange} />
      <input type="hidden" name={name} value={checked ? "on" : ""} />
    </div>
  );
}
