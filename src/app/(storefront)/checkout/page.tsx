import { CheckoutClient } from "@/components/storefront/CheckoutClient";
import { getFulfilmentSettings, getPaymentSettings, getTaxRate } from "@/lib/data/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout · Sapphire Vibes" };

export default async function CheckoutPage() {
  const [fulfilment, payments, gstRate] = await Promise.all([
    getFulfilmentSettings(),
    getPaymentSettings(),
    getTaxRate(),
  ]);
  return <CheckoutClient fulfilment={fulfilment} payments={payments} gstRate={gstRate} />;
}
