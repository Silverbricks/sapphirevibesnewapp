/**
 * Stripe wiring. Everything here degrades gracefully: with no STRIPE_SECRET_KEY the
 * store behaves exactly as it did before Stripe existed (same as the Resend/Twilio
 * pattern), so this can ship to production before the account is ready.
 */
import Stripe from "stripe";

let client: Stripe | null = null;

/** Is Stripe configured on this deployment? */
export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/** Lazily-built Stripe client. Throws if called without a key — guard with stripeConfigured(). */
export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!client) client = new Stripe(key);
  return client;
}

/**
 * Payment methods settled through Stripe Checkout, mapped to the Stripe method type
 * that renders them. Card covers Visa/Mastercard/Amex and carries Apple Pay and
 * Google Pay as wallets on top. Passed as `allowed_payment_method_types`, which
 * filters Stripe's dynamically-eligible set rather than overriding it — so a method
 * still has to be enabled in the Stripe Dashboard to appear.
 */
export const STRIPE_METHOD_TYPES: Record<string, Stripe.Checkout.SessionCreateParams.AllowedPaymentMethodType> = {
  VISA: "card",
  MASTERCARD: "card",
  AMEX: "card",
  APPLE_PAY: "card",
  GOOGLE_PAY: "card",
  AFTERPAY: "afterpay_clearpay",
  ZIP: "zip",
};

/**
 * Methods collected by staff after the order is placed — never hit a gateway.
 *
 * PayPal sits here because Stripe doesn't offer it to Australian accounts (it's
 * EU/UK/CH/NO/LI only), so it has to be settled outside Stripe: the order is placed
 * UNPAID, the customer is sent a PayPal request, and staff settle it with Record
 * Payment. Replace this with a real PayPal Checkout integration if the volume
 * justifies one.
 */
export const MANUAL_METHODS = ["BANK_TRANSFER", "CASH_ON_DELIVERY", "PAYPAL"] as const;

export function isStripeMethod(method: string): boolean {
  return method in STRIPE_METHOD_TYPES;
}

export function isManualMethod(method: string): boolean {
  return (MANUAL_METHODS as readonly string[]).includes(method);
}

/** Minor-unit currency code Stripe should charge in. */
export function stripeCurrency(storeCurrency: string): string {
  return (storeCurrency || "AUD").toLowerCase();
}
