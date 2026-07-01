/** Admin modules for granular role/permission access control. Edge-safe (no DB imports). */

export const MODULES = [
  "dashboard",
  "inventory",
  "products",
  "categories",
  "collections",
  "pricing",
  "orders",
  "customers",
  "reviews",
  "homepage",
  "content",
  "media",
  "seo",
  "marketing",
  "reports",
  "settings",
  "team",
] as const;

export type Module = (typeof MODULES)[number];

export const MODULE_LABELS: Record<Module, string> = {
  dashboard: "Dashboard",
  inventory: "Inventory",
  products: "Products",
  categories: "Categories",
  collections: "Collections",
  pricing: "Pricing",
  orders: "Orders",
  customers: "Customers",
  reviews: "Reviews",
  homepage: "Homepage CMS",
  content: "Content CMS",
  media: "Media Library",
  seo: "SEO",
  marketing: "Marketing",
  reports: "Reports",
  settings: "Settings",
  team: "Team & Access",
};

const ALL: Module[] = [...MODULES];

/** Default module access per staff role (used when a user has no explicit permissions). */
export const ROLE_MODULES: Record<string, Module[]> = {
  SUPER_ADMIN: ALL,
  ADMIN: ALL,
  INVENTORY_MANAGER: ["dashboard", "inventory", "products"],
  CATALOGUE_MANAGER: ["dashboard", "products", "categories", "collections", "pricing", "media"],
  CONTENT_EDITOR: ["dashboard", "homepage", "content", "media", "seo"],
  ORDER_FULFILMENT: ["dashboard", "orders"],
  MARKETING_MANAGER: ["dashboard", "marketing", "reports", "homepage", "content"],
  FINANCE_MANAGER: ["dashboard", "reports", "orders"],
  CUSTOMER_SUPPORT: ["dashboard", "orders", "customers", "reviews"],
  CUSTOMER: [],
};

/** Resolve the effective module list for a user (explicit permissions override role defaults). */
export function allowedModules(role: string | null | undefined, permissions?: unknown): Module[] {
  if (role === "SUPER_ADMIN" || role === "ADMIN") return ALL;
  if (Array.isArray(permissions) && permissions.length > 0) {
    return permissions.filter((m): m is Module => (MODULES as readonly string[]).includes(m));
  }
  return ROLE_MODULES[role ?? ""] ?? [];
}

export function canAccess(role: string | null | undefined, permissions: unknown, module: Module): boolean {
  return allowedModules(role, permissions).includes(module);
}
