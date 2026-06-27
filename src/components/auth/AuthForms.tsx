"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Input, FormField } from "@/components/ui";
import {
  loginAction,
  registerUser,
  googleSignIn,
  type AuthState,
} from "@/actions/auth";

function GoogleButton() {
  return (
    <form action={googleSignIn}>
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-line py-3 text-sm text-cream transition-colors hover:border-line-gold"
      >
        <span className="font-medium text-gold">G</span> Continue with Google
      </button>
    </form>
  );
}

function Divider() {
  return (
    <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-muted">
      <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, undefined);
  return (
    <div className="rounded-panel border border-line bg-card p-8">
      <h1 className="mb-1 font-serif text-3xl">Welcome back</h1>
      <p className="mb-6 text-sm text-muted">Sign in to your Sapphire Vibes account.</p>
      <form action={action}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <FormField label="Email">
          <Input name="email" type="email" required autoComplete="email" placeholder="you@email.com" />
        </FormField>
        <FormField label="Password">
          <Input name="password" type="password" required autoComplete="current-password" placeholder="••••••••" />
        </FormField>
        {state?.error && <p className="mb-3 text-sm text-red">{state.error}</p>}
        <Button type="submit" variant="gold" size="lg" loading={pending} className="w-full justify-center">
          Sign In
        </Button>
      </form>
      <Divider />
      <GoogleButton />
      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-gold">Create one</Link>
      </p>
      <p className="mt-3 text-center text-[11px] text-muted">
        Demo: amelia@email.com / password123 · admin@sapphirevibes.au / password123
      </p>
    </div>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(registerUser, undefined);
  return (
    <div className="rounded-panel border border-line bg-card p-8">
      <h1 className="mb-1 font-serif text-3xl">Create your account</h1>
      <p className="mb-6 text-sm text-muted">Join free — earn 100 points to start.</p>
      <form action={action}>
        <FormField label="Full Name">
          <Input name="name" required autoComplete="name" placeholder="Amelia Roberts" />
        </FormField>
        <FormField label="Email">
          <Input name="email" type="email" required autoComplete="email" placeholder="you@email.com" />
        </FormField>
        <FormField label="Password">
          <Input name="password" type="password" required autoComplete="new-password" placeholder="At least 6 characters" />
        </FormField>
        {state?.error && <p className="mb-3 text-sm text-red">{state.error}</p>}
        <Button type="submit" variant="gold" size="lg" loading={pending} className="w-full justify-center">
          Create Account
        </Button>
      </form>
      <Divider />
      <GoogleButton />
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-gold">Sign in</Link>
      </p>
    </div>
  );
}
