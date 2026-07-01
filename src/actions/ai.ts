"use server";

import { requireStaff } from "@/lib/auth-helpers";

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
