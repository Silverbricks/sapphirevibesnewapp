"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signIn, signOut } from "../../auth";

export type AuthState = { error?: string } | undefined;

const registerSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function makeReferralCode(name: string) {
  const base = name.split(" ")[0].toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `${base || "FRIEND"}${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function registerUser(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, email, password } = parsed.data;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      referralCode: makeReferralCode(name),
      pointsBalance: 100,
      rewardTxns: { create: { points: 100, reason: "SIGNUP", note: "Welcome bonus" } },
    },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/account" });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Account created — please sign in." };
    throw error; // re-throw redirect
  }
  return undefined;
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const callbackUrl = (formData.get("callbackUrl") as string) || "/account";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Invalid email or password." };
    throw error; // re-throw redirect
  }
  return undefined;
}

export async function googleSignIn() {
  await signIn("google", { redirectTo: "/account" });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
