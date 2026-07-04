import Link from "next/link";
import { Input, Select, buttonClasses } from "@/components/ui";

const PAYMENT_METHODS = ["VISA", "MASTERCARD", "AMEX", "PAYPAL", "APPLE_PAY", "GOOGLE_PAY", "AFTERPAY", "ZIP", "BANK_TRANSFER", "GIFT_CARD"];
const SHIPPING_METHODS = ["Standard Shipping", "Express Shipping", "Free Express Shipping", "Click & Collect"];
const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
const label = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");

export interface OrderFilterValues {
  q?: string;
  status?: string;
  paymentMethod?: string;
  shippingMethod?: string;
  state?: string;
  country?: string;
  customer?: string;
  dateFrom?: string;
  dateTo?: string;
}

const CUSTOMER_FILTERS = [
  { v: "has_email", l: "Has email" }, { v: "missing_email", l: "Missing email" },
  { v: "has_mobile", l: "Has mobile" }, { v: "missing_mobile", l: "Missing mobile" },
  { v: "business", l: "Business" }, { v: "individual", l: "Individual" },
  { v: "repeat", l: "Repeat" }, { v: "vip", l: "VIP" },
];

/** GET form — carries the active status tab so filtering preserves it. */
export function OrderFilters({ values }: { values: OrderFilterValues }) {
  return (
    <form action="/admin/orders" method="get" className="mb-5 rounded-card border border-line bg-card p-4">
      {values.status && <input type="hidden" name="status" value={values.status} />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input name="q" defaultValue={values.q ?? ""} placeholder="Order #, customer, email, phone, SKU, tracking…" className="sm:col-span-2 lg:col-span-2" />
        <Select name="paymentMethod" defaultValue={values.paymentMethod ?? ""}>
          <option value="">Any payment</option>
          {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{label(m)}</option>)}
        </Select>
        <Select name="shippingMethod" defaultValue={values.shippingMethod ?? ""}>
          <option value="">Any delivery</option>
          {SHIPPING_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
        <Select name="state" defaultValue={values.state ?? ""}>
          <option value="">Any state</option>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select name="country" defaultValue={values.country ?? ""}>
          <option value="">Any country</option>
          <option value="Australia">Australia</option>
          <option value="New Zealand">New Zealand</option>
        </Select>
        <Select name="customer" defaultValue={values.customer ?? ""}>
          <option value="">Any customer</option>
          {CUSTOMER_FILTERS.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
        </Select>
        <label className="flex items-center gap-2 text-xs text-muted">From <Input type="date" name="dateFrom" defaultValue={values.dateFrom ?? ""} /></label>
        <label className="flex items-center gap-2 text-xs text-muted">To <Input type="date" name="dateTo" defaultValue={values.dateTo ?? ""} /></label>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button type="submit" className={buttonClasses("gold", "sm")}>Apply Filters</button>
        <Link href={values.status ? `/admin/orders?status=${values.status}` : "/admin/orders"} className={buttonClasses("ghost", "sm")}>Clear</Link>
      </div>
    </form>
  );
}
