/** Site-wide configuration and storefront navigation data. */

export const SITE = {
  name: "Sapphire Vibes",
  tagline: "Luxury Living. Timeless Style.",
  description:
    "Curated luxury home décor, sculptural lighting, furniture and gifts for spaces that deserve to be remembered.",
  announcement:
    "Complimentary Express Shipping on Orders Over $250 · New Autumn Collection Now Live",
  abn: "00 000 000 000",
  country: "Australia",
} as const;

export const STOREFRONT_NAV = [
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Lighting", href: "/lighting" },
  { label: "Shop by Room", href: "/rooms" },
  { label: "Collections", href: "/collections" },
  { label: "Gifts", href: "/gifts" },
  { label: "Sale", href: "/sale" },
] as const;

export const STYLE_WORDS = [
  "Hamptons",
  "Coastal",
  "Scandinavian",
  "Minimalist",
  "Contemporary",
  "Industrial",
  "Boho",
  "Classic",
] as const;

export const FOOTER_COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "New Arrivals", href: "/new-arrivals" },
      { label: "Lighting", href: "/lighting" },
      { label: "Furniture", href: "/shop/furniture" },
      { label: "Home Décor", href: "/shop/home-decor" },
      { label: "Gifts", href: "/gifts" },
      { label: "Sale", href: "/sale" },
    ],
  },
  {
    title: "Customer Care",
    links: [
      { label: "Track Order", href: "/track" },
      { label: "Shipping Policy", href: "/pages/shipping-policy" },
      { label: "Returns & Refunds", href: "/pages/returns-refunds" },
      { label: "FAQ", href: "/pages/faq" },
      { label: "Contact Us", href: "/pages/contact" },
      { label: "Gift Cards", href: "/account/gift-centre" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/pages/about-us" },
      { label: "Trade Program", href: "/pages/trade-program" },
      { label: "Corporate Gifting", href: "/pages/corporate-gifting" },
      { label: "Blog", href: "/blog" },
      { label: "Privacy Policy", href: "/pages/privacy-policy" },
      { label: "Terms", href: "/pages/terms" },
    ],
  },
] as const;

export const PAYMENT_METHODS_DISPLAY = [
  "VISA",
  "MASTERCARD",
  "AMEX",
  "PAYPAL",
  "AFTERPAY",
  "ZIP",
] as const;

/** Flat shipping options (no live carrier rates in v1). Prices in cents. */
export const SHIPPING_METHODS = [
  { id: "standard", label: "Standard Shipping", desc: "3–7 business days", cents: 995 },
  { id: "express", label: "Express Shipping", desc: "1–3 business days · Australia Post", cents: 1495 },
  { id: "free", label: "Free Express Shipping", desc: "On orders over $250", cents: 0 },
  { id: "click_collect", label: "Click & Collect", desc: "Melbourne showroom", cents: 0 },
] as const;

export const FREE_SHIPPING_THRESHOLD_CENTS = 25000; // $250
export const GST_RATE = 0.1; // 10% GST (Australia)
export const POINTS_PER_DOLLAR = 1;
export const POINTS_REDEEM_VALUE_CENTS = 1; // 100 pts = $1
