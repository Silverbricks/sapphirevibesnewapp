"use server";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireStaff } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

// Latest, most capable Claude model.
const MODEL = "claude-opus-4-8";

async function callClaude(system: string, user: string, maxTokens = 2048): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("AI is not configured — set ANTHROPIC_API_KEY on the server.");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI request failed (${res.status}). ${body.slice(0, 160)}`);
  }
  const data = (await res.json()) as { content?: { text?: string }[] };
  return data.content?.[0]?.text ?? "";
}

function extractJson<T>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("AI returned an unexpected response.");
  return JSON.parse(text.slice(start, end + 1)) as T;
}

/** Send an image (base64) + prompt to Claude vision, return the text reply. */
async function callClaudeVision(system: string, prompt: string, base64: string, mediaType: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("AI is not configured — set ANTHROPIC_API_KEY on the server.");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 500,
      system,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: prompt },
        ],
      }],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI request failed (${res.status}). ${body.slice(0, 160)}`);
  }
  const data = (await res.json()) as { content?: { text?: string }[] };
  return data.content?.[0]?.text ?? "";
}

const MEDIA: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp" };

/** Read an image (local /uploads/* or a remote URL) into base64 + media type. */
async function imageToBase64(url: string): Promise<{ base64: string; mediaType: string }> {
  const ext = (url.split(".").pop() || "webp").toLowerCase().split("?")[0];
  const mediaType = MEDIA[ext] || "image/webp";
  if (url.startsWith("/")) {
    const buf = await readFile(path.join(process.cwd(), "public", url.replace(/^\//, "")));
    return { base64: buf.toString("base64"), mediaType };
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not fetch the image.");
  const buf = Buffer.from(await res.arrayBuffer());
  return { base64: buf.toString("base64"), mediaType };
}

/** AI-generate alt text, a title and product tags from a product image. */
export async function generateImageMeta(imageId: string) {
  await requireStaff();
  try {
    const img = await db.productImage.findUnique({ where: { id: imageId }, select: { url: true } });
    if (!img) return { error: "Image not found." };
    const { base64, mediaType } = await imageToBase64(img.url);
    const text = await callClaudeVision(
      "You write accessibility + SEO metadata for a luxury home décor store. Respond ONLY as minified JSON: {\"altText\": string (<=125 chars, descriptive), \"title\": string (<=70 chars), \"tags\": string[] (3-6 lowercase keywords)}.",
      "Describe this product image for alt text, a title and tags.",
      base64,
      mediaType,
    );
    const json = extractJson<{ altText: string; title: string; tags: string[] }>(text);
    return { ok: true as const, altText: json.altText, title: json.title, tags: json.tags };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Generate a full blog article (semantic HTML body + excerpt) from a title. */
export async function generateBlogDraft(title: string) {
  await requireStaff();
  if (!title.trim()) return { error: "Enter a title first." };
  try {
    const text = await callClaude(
      "You are the senior editorial copywriter for 'Sapphire Vibes', a luxury home décor, lighting and gifts brand. Write elegant, evocative, on-brand content. Respond ONLY as minified JSON with keys \"excerpt\" (1 sentence, <=160 chars) and \"html\" (the article body in clean semantic HTML using <h2>, <h3>, <p>, <ul>, <li>, <blockquote> — no <html>/<head>/<body>, no markdown).",
      `Write an approximately 600-word blog article for the title: "${title}".`,
      3000,
    );
    const json = extractJson<{ excerpt: string; html: string }>(text);
    return { ok: true as const, html: json.html, excerpt: json.excerpt };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Generate SEO meta title + description from a page/product title and optional context. */
export async function generateSeoMeta(title: string, context?: string) {
  await requireStaff();
  if (!title.trim()) return { error: "Enter a title first." };
  try {
    const text = await callClaude(
      "You write concise, compelling SEO metadata for a luxury home décor brand. Respond ONLY as minified JSON: {\"metaTitle\": string (<=60 chars), \"metaDescription\": string (<=155 chars)}.",
      `Title: "${title}". ${context ? `Context: ${context}` : ""}`,
      400,
    );
    const json = extractJson<{ metaTitle: string; metaDescription: string }>(text);
    return { ok: true as const, metaTitle: json.metaTitle, metaDescription: json.metaDescription };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
