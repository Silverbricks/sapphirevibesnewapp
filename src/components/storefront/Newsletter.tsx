"use client";

import { useState } from "react";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/actions/storefront";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await subscribeNewsletter(email);
    setLoading(false);
    toast[res.ok ? "success" : "error"](res.message);
    if (res.ok) setEmail("");
  }

  return (
    <div
      className="rounded-panel border border-line-gold px-8 py-20 text-center"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at center,rgba(200,164,92,.1),transparent 60%),linear-gradient(#151a21,#151a21)",
      }}
    >
      <span className="eyebrow">Join the List</span>
      <h2 className="my-3.5 text-[46px]">
        Inspired Interiors,
        <br />
        Delivered
      </h2>
      <p className="mx-auto mb-8 max-w-[440px] text-muted">
        Be first to shop new collections and receive 10% off your first order, plus styling notes
        from our designers.
      </p>
      <form onSubmit={onSubmit} className="mx-auto flex max-w-[460px]">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className="flex-1 border border-r-0 border-line bg-white/[0.04] px-[18px] py-[15px] text-sm text-cream outline-none placeholder:text-muted focus:border-gold"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-gold px-[30px] text-xs font-medium uppercase tracking-[0.14em] text-ink disabled:opacity-60"
        >
          {loading ? "…" : "Subscribe"}
        </button>
      </form>
    </div>
  );
}
