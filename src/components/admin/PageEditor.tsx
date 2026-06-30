"use client";

import Link from "next/link";
import { Panel, Input, Textarea, Select, FormField, buttonClasses } from "@/components/ui";
import { RichTextEditor } from "./RichTextEditor";
import { SubmitButton } from "./SubmitButton";
import { savePage } from "@/actions/content";

interface PageInit {
  id?: string;
  slug?: string;
  title?: string;
  body?: string;
  status?: string;
  seoTitle?: string | null;
  seoDesc?: string | null;
}

export function PageEditor({ page }: { page: PageInit }) {
  return (
    <form action={savePage} className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_320px]">
      {page.id && <input type="hidden" name="id" value={page.id} />}

      <div className="space-y-[18px]">
        <Panel>
          <FormField label="Title"><Input name="title" defaultValue={page.title ?? ""} placeholder="About Us" required /></FormField>
          {!page.id && (
            <FormField label="URL slug (optional)">
              <Input name="slug" defaultValue="" placeholder="about-us — leave blank to auto-generate" />
            </FormField>
          )}
          <FormField label="Body">
            <RichTextEditor name="body" defaultValue={page.body ?? ""} />
          </FormField>
        </Panel>
      </div>

      <div className="space-y-[18px]">
        <Panel>
          <h3 className="mb-4 font-serif text-lg">Publish</h3>
          <FormField label="Status">
            <Select name="status" defaultValue={page.status ?? "PUBLISHED"}>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </Select>
          </FormField>
          {page.slug && (
            <p className="mb-4 text-xs text-muted">
              Live at <Link href={`/pages/${page.slug}`} className="text-gold">/pages/{page.slug}</Link>
            </p>
          )}
          <div className="flex items-center gap-3">
            <SubmitButton>Save Page</SubmitButton>
            <Link href="/admin/content/pages" className={buttonClasses("ghost", "md")}>Cancel</Link>
          </div>
        </Panel>

        <Panel>
          <h3 className="mb-4 font-serif text-lg">SEO</h3>
          <FormField label="Meta Title"><Input name="seoTitle" defaultValue={page.seoTitle ?? ""} placeholder="About Sapphire Vibes" /></FormField>
          <FormField label="Meta Description"><Textarea name="seoDesc" defaultValue={page.seoDesc ?? ""} rows={3} placeholder="Up to ~160 characters for search results." /></FormField>
        </Panel>
      </div>
    </form>
  );
}
