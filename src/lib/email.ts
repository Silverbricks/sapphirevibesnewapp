/** Transactional email via the Resend HTTP API (no SDK dependency). */

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    throw new Error("Email is not configured — set RESEND_API_KEY and EMAIL_FROM on the server.");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Email send failed (${res.status}). ${body.slice(0, 160)}`);
  }
}
