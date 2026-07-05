import { CheckoutClient } from "@/components/storefront/CheckoutClient";
import { getFulfilmentSettings, getPaymentSettings } from "@/lib/data/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout · Sapphire Vibes" };

export default async function CheckoutPage() {
  const [fulfilment, payments] = await Promise.all([getFulfilmentSettings(), getPaymentSettings()]);
  return <CheckoutClient fulfilment={fulfilment} payments={payments} />;
}
