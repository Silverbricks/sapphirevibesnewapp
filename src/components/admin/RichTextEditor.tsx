"use client";

import { useRef, useState } from "react";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Image as ImageIcon,
  Eraser,
} from "lucide-react";

/**
 * Lightweight WYSIWYG editor. Stores HTML in a hidden input so it submits with
 * the surrounding <form>. Content is authored by trusted staff only; the body is
 * rendered with the shared `.prose-luxury` styles on the storefront.
 */
export function RichTextEditor({
  name,
  defaultValue = "",
}: {
  name: string;
  defaultValue?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(defaultValue);

  function sync() {
    if (ref.current) setHtml(ref.current.innerHTML);
  }

  function exec(cmd: string, value?: string) {
    ref.current?.focus();
    document.execCommand(cmd, false, value);
    sync();
  }

  function addLink() {
    const url = window.prompt("Link URL (https://… or /path)");
    if (url) exec("createLink", url);
  }

  function addImage() {
    const url = window.prompt("Image URL");
    if (url) exec("insertImage", url);
  }

  return (
    <div className="overflow-hidden rounded-[9px] border border-line bg-panel focus-within:border-gold">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-card px-2 py-1.5">
        <ToolBtn title="Bold" onClick={() => exec("bold")}><Bold className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Italic" onClick={() => exec("italic")}><Italic className="h-4 w-4" /></ToolBtn>
        <Divider />
        <ToolBtn title="Heading" onClick={() => exec("formatBlock", "<h2>")}><Heading2 className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Subheading" onClick={() => exec("formatBlock", "<h3>")}><Heading3 className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Quote" onClick={() => exec("formatBlock", "<blockquote>")}><Quote className="h-4 w-4" /></ToolBtn>
        <Divider />
        <ToolBtn title="Bullet list" onClick={() => exec("insertUnorderedList")}><List className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Numbered list" onClick={() => exec("insertOrderedList")}><ListOrdered className="h-4 w-4" /></ToolBtn>
        <Divider />
        <ToolBtn title="Insert link" onClick={addLink}><Link2 className="h-4 w-4" /></ToolBtn>
        <ToolBtn title="Insert image" onClick={addImage}><ImageIcon className="h-4 w-4" /></ToolBtn>
        <Divider />
        <ToolBtn title="Clear formatting" onClick={() => exec("removeFormat")}><Eraser className="h-4 w-4" /></ToolBtn>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        dangerouslySetInnerHTML={{ __html: defaultValue }}
        className="prose-luxury min-h-[300px] px-4 py-3 text-cream outline-none"
      />
      <input type="hidden" name={name} value={html} readOnly />
    </div>
  );
}

function ToolBtn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="rounded p-2 text-grey transition-colors hover:bg-white/5 hover:text-cream"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-line" />;
}
