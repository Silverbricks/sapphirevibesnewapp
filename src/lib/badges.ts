/**
 * Promotional product badges. Keys mirror the Prisma `ProductBadge` enum exactly
 * (added in Phase 1) so the storefront stack and the admin badge-picker stay in sync.
 */
export type ProductBadgeKey =
  | "LATEST"
  | "HOT_SELLING"
  | "BEST_SELLER"
  | "PREMIUM"
  | "LUXURY"
  | "STAFF_PICK"
  | "LIMITED"
  | "GIFT_IDEA"
  | "NEW_COLLECTION"
  | "ECO"
  | "AUSTRALIAN_MADE"
  | "ON_SALE"
  | "FESTIVAL"
  | "CHRISTMAS"
  | "VALENTINES"
  | "MOTHERS_DAY"
  | "FATHERS_DAY"
  | "HALLOWEEN"
  | "NEW_YEAR"
  | "EASTER";

export type BadgeVariant = "default" | "gold" | "sale" | "eco" | "oos";

export const BADGE_META: Record<
  ProductBadgeKey,
  { label: string; variant: BadgeVariant }
> = {
  LATEST: { label: "New", variant: "default" },
  HOT_SELLING: { label: "Hot Selling", variant: "default" },
  BEST_SELLER: { label: "Best Seller", variant: "gold" },
  PREMIUM: { label: "Premium", variant: "gold" },
  LUXURY: { label: "Luxury", variant: "gold" },
  STAFF_PICK: { label: "Staff Pick", variant: "default" },
  LIMITED: { label: "Limited", variant: "default" },
  GIFT_IDEA: { label: "Gift Idea", variant: "default" },
  NEW_COLLECTION: { label: "New Collection", variant: "default" },
  ECO: { label: "Eco Friendly", variant: "eco" },
  AUSTRALIAN_MADE: { label: "Australian Made", variant: "default" },
  ON_SALE: { label: "On Sale", variant: "sale" },
  FESTIVAL: { label: "Festival Special", variant: "default" },
  CHRISTMAS: { label: "Christmas", variant: "default" },
  VALENTINES: { label: "Valentine's", variant: "default" },
  MOTHERS_DAY: { label: "Mother's Day", variant: "default" },
  FATHERS_DAY: { label: "Father's Day", variant: "default" },
  HALLOWEEN: { label: "Halloween", variant: "default" },
  NEW_YEAR: { label: "New Year", variant: "default" },
  EASTER: { label: "Easter", variant: "default" },
};

export const ALL_BADGES = Object.keys(BADGE_META) as ProductBadgeKey[];
