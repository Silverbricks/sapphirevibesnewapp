import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const img = (id: string, w = 1000) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80`;

const ALL_TABLES = [
  "User", "Account", "Session", "VerificationToken",
  "Brand", "Category", "Collection", "Product", "ProductImage", "Supplier", "ShopTheLook",
  "Address", "CartItem", "WishlistItem", "StockNotification", "Order", "OrderItem",
  "Review", "ReviewPhoto", "ProductQuestion",
  "RewardTransaction", "LoyaltyEarnRule", "LoyaltyRedeemOption", "VipTier",
  "GiftCard", "GiftCardTxn", "Referral", "StoreCreditTxn",
  "Coupon", "Promotion", "PriceRule",
  "EmailCampaign", "EmailAutomation", "Subscriber", "Segment", "Integration",
  "HomepageBlock", "Page", "BlogPost", "Faq", "Testimonial",
  "AuditLog", "Setting",
];

const d = (s: string) => new Date(s);

async function main() {
  console.log("🌱 Resetting tables…");
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE ${ALL_TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`,
  );

  const password = await bcrypt.hash("password123", 10);

  // ── VIP tiers ───────────────────────────────────────────────────────────
  const silver = await db.vipTier.create({
    data: { name: "Silver", blurb: "Spend $0–$1,000 / yr", minSpendCents: 0, multiplier: 1, order: 0,
      benefits: ["Earn 1× points", "Birthday reward", "Members-only sales"] },
  });
  const gold = await db.vipTier.create({
    data: { name: "Gold", blurb: "Spend $1,000–$3,000 / yr", minSpendCents: 100000, multiplier: 1, order: 1,
      benefits: ["Everything in Silver", "Free express shipping", "Early access to collections", "Complimentary gift wrapping"] },
  });
  const elite = await db.vipTier.create({
    data: { name: "Elite", blurb: "Spend $3,000+ / yr", minSpendCents: 300000, multiplier: 2, order: 2,
      benefits: ["Everything in Gold", "2× loyalty points", "Exclusive product launches", "Priority customer support"] },
  });

  // ── Brands & suppliers ──────────────────────────────────────────────────
  const brandNames = ["Lumière Co.", "Maison Atelier", "Studio Noir", "Terra Living", "Aura"];
  const brands: Record<string, string> = {};
  for (const name of brandNames) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const b = await db.brand.create({ data: { name, slug } });
    brands[name] = b.id;
  }
  const supplier = await db.supplier.create({ data: { name: "Atelier Imports", contact: "supply@atelier.au", leadDays: 14 } });

  // ── Categories (real 13-category taxonomy: top level + subcategories) ────
  type Child = { name: string; slug: string };
  const catDefs: { name: string; slug: string; order: number; image: string; children: Child[] }[] = [
    { name: "Furniture", slug: "furniture", order: 1, image: "1567538096630-e0c55bd6374c", children: [
      { name: "Console Tables", slug: "console-tables" }, { name: "Side Tables", slug: "side-tables" },
      { name: "Coffee Tables", slug: "coffee-tables" }, { name: "Bar Carts", slug: "bar-carts" },
      { name: "Stools", slug: "stools" }, { name: "Cabinets & Storage", slug: "cabinets-storage" } ] },
    { name: "Mirrors", slug: "mirrors", order: 2, image: "1618220179428-22790b461013", children: [
      { name: "Wall Mirrors", slug: "wall-mirrors" }, { name: "Round Mirrors", slug: "round-mirrors" },
      { name: "Metal Frame Mirrors", slug: "metal-frame-mirrors" }, { name: "Statement Mirrors", slug: "statement-mirrors" },
      { name: "Cutwork Mirrors", slug: "cutwork-mirrors" } ] },
    { name: "Wall Art & Décor", slug: "wall-art-decor", order: 3, image: "1586023492125-27b2c045efd7", children: [
      { name: "Metal Wall Art", slug: "metal-wall-art" }, { name: "Flower Wall Décor", slug: "flower-wall-decor" },
      { name: "Leaf Wall Décor", slug: "leaf-wall-decor" }, { name: "Abstract Wall Art", slug: "abstract-wall-art" },
      { name: "Animal Wall Décor", slug: "animal-wall-decor" }, { name: "Geometric Wall Designs", slug: "geometric-wall-designs" } ] },
    { name: "Statues & Figurines", slug: "statues-figurines", order: 4, image: "1578500494198-246f612d3b3d", children: [
      { name: "Buddha Statues", slug: "buddha-statues" }, { name: "Ganesh Statues", slug: "ganesh-statues" },
      { name: "Animal Statues", slug: "animal-statues" }, { name: "Religious Figurines", slug: "religious-figurines" },
      { name: "Decorative Figurines", slug: "decorative-figurines" } ] },
    { name: "Artificial Plants & Planters", slug: "plants-planters", order: 5, image: "1586023492125-27b2c045efd7", children: [
      { name: "Ficus Plants", slug: "ficus-plants" }, { name: "Palm Trees", slug: "palm-trees" },
      { name: "Monstera Plants", slug: "monstera-plants" }, { name: "Magnolia Plants", slug: "magnolia-plants" },
      { name: "Planter Pots", slug: "planter-pots" } ] },
    { name: "Lamps & Lighting Décor", slug: "lamps-lighting", order: 6, image: "1507473885765-e6ed057f782c", children: [
      { name: "Decorative Lamps", slug: "decorative-lamps" }, { name: "Lanterns", slug: "lanterns" },
      { name: "Wall Lights", slug: "wall-lights" } ] },
    { name: "Vases & Ginger Jars", slug: "vases-ginger-jars", order: 7, image: "1578500494198-246f612d3b3d", children: [
      { name: "Ceramic Vases", slug: "ceramic-vases" }, { name: "Gold Vases", slug: "gold-vases" },
      { name: "Decorative Jars", slug: "decorative-jars" }, { name: "Glass & Metal Jars", slug: "glass-metal-jars" } ] },
    { name: "Candle Holders", slug: "candle-holders", order: 8, image: "1603006905003-be475563bc59", children: [
      { name: "Metal Candle Holders", slug: "metal-candle-holders" }, { name: "Glass Candle Holders", slug: "glass-candle-holders" },
      { name: "Candle Stands", slug: "candle-stands" } ] },
    { name: "Trays & Home Accessories", slug: "trays-accessories", order: 9, image: "1600166898405-da9535204843", children: [
      { name: "Decorative Trays", slug: "decorative-trays" }, { name: "Serving Trays", slug: "serving-trays" },
      { name: "Storage Boxes", slug: "storage-boxes" }, { name: "Tissue Boxes", slug: "tissue-boxes" },
      { name: "Metal Décor Boxes", slug: "metal-decor-boxes" } ] },
    { name: "Water Features", slug: "water-features", order: 10, image: "1578500494198-246f612d3b3d", children: [
      { name: "Buddha Fountains", slug: "buddha-fountains" }, { name: "Garden Fountains", slug: "garden-fountains" },
      { name: "LED Water Fountains", slug: "led-water-fountains" }, { name: "Cascading Waterfalls", slug: "cascading-waterfalls" } ] },
    { name: "Cushions & Soft Décor", slug: "cushions-soft-decor", order: 11, image: "1584100936595-c0654b55a2e2", children: [
      { name: "Decorative Cushions", slug: "decorative-cushions" }, { name: "Sofa Cushions", slug: "sofa-cushions" } ] },
    { name: "Gift & Décor Items", slug: "gifts-decor", order: 12, image: "1549465220-1a8b9238cd48", children: [
      { name: "Mini Figurines", slug: "mini-figurines" }, { name: "Desktop Décor", slug: "desktop-decor" },
      { name: "Small Sculptures", slug: "small-sculptures" }, { name: "Decorative Gifts", slug: "decorative-gifts" } ] },
  ];
  const cats: Record<string, string> = {};
  for (const c of catDefs) {
    const parent = await db.category.create({
      data: { name: c.name, slug: c.slug, displayOrder: c.order, imageUrl: img(c.image, 600) },
    });
    cats[c.name] = parent.id;
    for (const child of c.children) {
      await db.category.create({ data: { name: child.name, slug: child.slug, parentId: parent.id } });
    }
  }

  // ── Collections ─────────────────────────────────────────────────────────
  const collDefs: { name: string; slug: string; type: "MANUAL" | "AUTO"; hero: string; featured?: boolean; desc?: string }[] = [
    { name: "New Arrivals", slug: "new-arrivals", type: "AUTO", hero: img("1578500494198-246f612d3b3d"), featured: true, desc: "The latest pieces to land in store." },
    { name: "Best Sellers", slug: "best-sellers", type: "AUTO", hero: img("1567538096630-e0c55bd6374c"), featured: true, desc: "Most loved by our community." },
    { name: "Luxury Collection", slug: "luxury-collection", type: "MANUAL", hero: img("1513506003901-1e6a229e2d15"), featured: true, desc: "Curated statement pieces." },
    { name: "Sculptural Lighting", slug: "sculptural-lighting", type: "MANUAL", hero: img("1513506003901-1e6a229e2d15"), featured: true, desc: "Hand-finished chandeliers and pendants designed to be the centrepiece of any room." },
    { name: "Premium Lighting", slug: "premium-lighting", type: "MANUAL", hero: img("1507473885765-e6ed057f782c"), desc: "Brass, alabaster and hand-blown glass." },
    { name: "Hamptons Collection", slug: "hamptons-collection", type: "MANUAL", hero: img("1586023492125-27b2c045efd7"), desc: "Relaxed coastal elegance." },
    { name: "Gifts Under $100", slug: "gifts-under-100", type: "AUTO", hero: img("1549465220-1a8b9238cd48"), featured: true, desc: "Thoughtfully curated pieces to celebrate." },
    { name: "Autumn 2026", slug: "autumn-2026", type: "MANUAL", hero: img("1586023492125-27b2c045efd7"), desc: "The Autumn Collection · 2026." },
    { name: "Wedding Gifts", slug: "wedding-gifts", type: "MANUAL", hero: img("1549465220-1a8b9238cd48"), desc: "For the registry and beyond." },
    { name: "Christmas Collection", slug: "christmas-collection", type: "MANUAL", hero: img("1549465220-1a8b9238cd48"), desc: "Coming this December." },
  ];
  for (const [i, c] of collDefs.entries()) {
    await db.collection.create({ data: { name: c.name, slug: c.slug, type: c.type, heroImage: c.hero, isFeatured: c.featured ?? false, description: c.desc, displayOrder: i } });
  }

  // ── Products ────────────────────────────────────────────────────────────
  type P = {
    name: string; sku: string; brand: string; category: string; room: string;
    price: number; compare?: number; cost: number; stock: number; max: number;
    rating: number; reviews: number; sales: number; badges: string[]; image: string;
    material: string; colour: string; style: string; desc: string; collections: string[];
  };
  const products: P[] = [
    { name: "Aurelia Brass Pendant", sku: "LGT-AUR-001", brand: "Lumière Co.", category: "Lamps & Lighting Décor", room: "Living Room", price: 38900, cost: 18000, stock: 48, max: 60, rating: 5, reviews: 284, sales: 284, badges: ["LATEST", "LUXURY"], image: "1513506003901-1e6a229e2d15", material: "Brass, alabaster", colour: "Antique gold", style: "Modern", desc: "A hand-finished brass pendant with a warm antique glow — the sculptural centrepiece your entryway deserves.", collections: ["sculptural-lighting", "premium-lighting", "luxury-collection", "new-arrivals", "best-sellers"] },
    { name: "Velvet Accent Chair", sku: "FRN-VEL-014", brand: "Maison Atelier", category: "Furniture", room: "Living Room", price: 89900, compare: 119900, cost: 42000, stock: 6, max: 40, rating: 4, reviews: 156, sales: 156, badges: ["ON_SALE", "BEST_SELLER"], image: "1567538096630-e0c55bd6374c", material: "Velvet, hardwood", colour: "Emerald", style: "Contemporary", desc: "Deep emerald velvet over a solid hardwood frame. As comfortable as it is striking.", collections: ["best-sellers", "luxury-collection"] },
    { name: "Marble Sculpture Vase", sku: "DEC-MAR-007", brand: "Studio Noir", category: "Vases & Ginger Jars", room: "Living Room", price: 14900, cost: 6000, stock: 124, max: 150, rating: 5, reviews: 96, sales: 98, badges: ["LATEST", "AUSTRALIAN_MADE"], image: "1578500494198-246f612d3b3d", material: "Solid marble", colour: "Carrara white", style: "Minimalist", desc: "Carved from solid marble, each vase carries its own unique veining. A quiet statement on any console.", collections: ["new-arrivals", "hamptons-collection"] },
    { name: "Alabaster Table Lamp", sku: "LGT-ALA-022", brand: "Lumière Co.", category: "Lamps & Lighting Décor", room: "Bedroom", price: 25900, cost: 11000, stock: 0, max: 50, rating: 5, reviews: 312, sales: 312, badges: ["LATEST", "STAFF_PICK"], image: "1507473885765-e6ed057f782c", material: "Alabaster, brass", colour: "Ivory", style: "Modern", desc: "Translucent alabaster casts a soft, golden light — a warm glow for bedside or console.", collections: ["premium-lighting", "new-arrivals", "sculptural-lighting"] },
    { name: "Hand-Knotted Wool Rug", sku: "SFT-WOL-031", brand: "Terra Living", category: "Cushions & Soft Décor", room: "Living Room", price: 64900, cost: 30000, stock: 32, max: 45, rating: 5, reviews: 203, sales: 203, badges: ["PREMIUM"], image: "1600166898405-da9535204843", material: "New Zealand wool", colour: "Sand", style: "Hamptons", desc: "Hand-knotted from New Zealand wool. Dense, plush and built to last a generation.", collections: ["best-sellers", "luxury-collection"] },
    { name: "Ceramic Candle Trio", sku: "FRG-CAN-005", brand: "Aura", category: "Candle Holders", room: "Living Room", price: 7900, cost: 3000, stock: 210, max: 250, rating: 4, reviews: 74, sales: 420, badges: ["GIFT_IDEA", "ECO"], image: "1603006905003-be475563bc59", material: "Ceramic, soy wax", colour: "Cream", style: "Coastal", desc: "Three hand-poured soy candles in signature scents. Beautifully boxed — ready to gift.", collections: ["gifts-under-100", "best-sellers"] },
    { name: "Gilded Wall Mirror", sku: "DEC-MIR-019", brand: "Studio Noir", category: "Mirrors", room: "Entry", price: 42900, compare: 52000, cost: 19000, stock: 14, max: 60, rating: 5, reviews: 88, sales: 74, badges: ["ON_SALE"], image: "1618220179428-22790b461013", material: "Gilded metal, glass", colour: "Gold", style: "Classic", desc: "An elegant gilded frame that adds light and depth to any room. Arrives ready to hang.", collections: ["luxury-collection"] },
    { name: "Linen Throw Blanket", sku: "SFT-LIN-027", brand: "Terra Living", category: "Cushions & Soft Décor", room: "Bedroom", price: 11900, cost: 4500, stock: 9, max: 80, rating: 5, reviews: 140, sales: 140, badges: ["LIMITED"], image: "1584100936595-c0654b55a2e2", material: "Pure linen", colour: "Oatmeal", style: "Coastal", desc: "Stonewashed pure linen that softens with every wash. A quiet luxury for the bed or sofa.", collections: ["gifts-under-100"] },
    { name: "Étoile Chandelier", sku: "LGT-ETO-040", brand: "Lumière Co.", category: "Lamps & Lighting Décor", room: "Dining", price: 129000, cost: 60000, stock: 12, max: 30, rating: 5, reviews: 41, sales: 40, badges: ["PREMIUM", "LUXURY"], image: "1513506003901-1e6a229e2d15", material: "Brass, hand-blown glass", colour: "Champagne", style: "Contemporary", desc: "A constellation of hand-blown glass globes on a brushed brass frame.", collections: ["premium-lighting", "sculptural-lighting", "luxury-collection"] },
    { name: "Noir Diffuser Set", sku: "FRG-DIF-011", brand: "Aura", category: "Gift & Décor Items", room: "Bathroom", price: 8900, cost: 3400, stock: 64, max: 120, rating: 5, reviews: 52, sales: 60, badges: ["GIFT_IDEA"], image: "1603006905003-be475563bc59", material: "Glass, reeds", colour: "Smoke", style: "Minimalist", desc: "A slow-release reed diffuser in our signature noir scent. Up to 12 weeks of fragrance.", collections: ["gifts-under-100"] },
    { name: "Coastal Linen Cushion", sku: "SFT-CUS-018", brand: "Terra Living", category: "Cushions & Soft Décor", room: "Bedroom", price: 5900, cost: 2200, stock: 130, max: 200, rating: 5, reviews: 64, sales: 90, badges: ["LATEST"], image: "1584100936595-c0654b55a2e2", material: "Linen, feather", colour: "Sea mist", style: "Coastal", desc: "A plump feather-filled cushion in washed linen. Layer for relaxed coastal ease.", collections: ["hamptons-collection", "gifts-under-100", "new-arrivals"] },
    { name: "Sculpted Floor Lamp", sku: "LGT-FLR-028", brand: "Maison Atelier", category: "Lamps & Lighting Décor", room: "Living Room", price: 54900, cost: 25000, stock: 18, max: 40, rating: 4, reviews: 70, sales: 70, badges: ["STAFF_PICK"], image: "1507473885765-e6ed057f782c", material: "Marble, brass", colour: "Onyx", style: "Modern", desc: "A sculptural arc on a solid marble base — equal parts lighting and art.", collections: ["premium-lighting", "sculptural-lighting"] },

    // ── Sample products for the remaining categories ──────────────────────
    { name: "Oak Console Table", sku: "FRN-CON-101", brand: "Maison Atelier", category: "Furniture", room: "Living Room", price: 74900, cost: 32000, stock: 20, max: 40, rating: 5, reviews: 42, sales: 42, badges: ["LATEST"], image: "1567538096630-e0c55bd6374c", material: "Solid oak", colour: "Natural oak", style: "Contemporary", desc: "A slim solid-oak console with clean lines — perfect for entryways and hallways.", collections: ["new-arrivals"] },
    { name: "Round Antique Mirror", sku: "MIR-RND-102", brand: "Studio Noir", category: "Mirrors", room: "Entry", price: 21900, cost: 9000, stock: 35, max: 60, rating: 5, reviews: 58, sales: 58, badges: ["BEST_SELLER"], image: "1618220179428-22790b461013", material: "Antiqued glass, metal", colour: "Aged brass", style: "Classic", desc: "A round mirror with an aged-brass frame that adds warmth and light to any wall.", collections: ["best-sellers"] },
    { name: "Golden Leaf Metal Wall Art", sku: "WAL-LEF-103", brand: "Studio Noir", category: "Wall Art & Décor", room: "Living Room", price: 18900, cost: 7500, stock: 44, max: 80, rating: 5, reviews: 33, sales: 33, badges: ["LATEST"], image: "1586023492125-27b2c045efd7", material: "Powder-coated metal", colour: "Gold", style: "Modern", desc: "Hand-shaped golden leaves form a sculptural metal wall installation.", collections: ["new-arrivals"] },
    { name: "Abstract Brass Wall Panel", sku: "WAL-ABS-104", brand: "Maison Atelier", category: "Wall Art & Décor", room: "Dining", price: 26900, cost: 11000, stock: 22, max: 50, rating: 5, reviews: 19, sales: 19, badges: ["LUXURY"], image: "1586023492125-27b2c045efd7", material: "Brass", colour: "Brushed brass", style: "Contemporary", desc: "An abstract brushed-brass panel that catches the light beautifully.", collections: ["luxury-collection"] },
    { name: "Meditating Buddha Statue", sku: "STA-BUD-105", brand: "Terra Living", category: "Statues & Figurines", room: "Living Room", price: 15900, cost: 6000, stock: 60, max: 100, rating: 5, reviews: 120, sales: 120, badges: ["BEST_SELLER"], image: "1578500494198-246f612d3b3d", material: "Polyresin", colour: "Stone grey", style: "Zen", desc: "A serene meditating Buddha, hand-finished in a natural stone tone.", collections: ["best-sellers"] },
    { name: "Golden Ganesh Figurine", sku: "STA-GAN-106", brand: "Studio Noir", category: "Statues & Figurines", room: "Entry", price: 12900, cost: 5000, stock: 48, max: 90, rating: 5, reviews: 64, sales: 64, badges: ["GIFT_IDEA"], image: "1578500494198-246f612d3b3d", material: "Polyresin, gold leaf", colour: "Gold", style: "Traditional", desc: "An intricately detailed Ganesh figurine with a gilded finish.", collections: ["gifts-under-100"] },
    { name: "Artificial Ficus Tree 1.5m", sku: "PLN-FIC-107", brand: "Terra Living", category: "Artificial Plants & Planters", room: "Living Room", price: 19900, cost: 8000, stock: 30, max: 60, rating: 4, reviews: 41, sales: 41, badges: ["LATEST"], image: "1586023492125-27b2c045efd7", material: "Silk, polyester", colour: "Green", style: "Natural", desc: "A lifelike 1.5m ficus that brings greenery indoors with zero upkeep.", collections: ["new-arrivals"] },
    { name: "Monstera in Ceramic Planter", sku: "PLN-MON-108", brand: "Terra Living", category: "Artificial Plants & Planters", room: "Living Room", price: 13900, cost: 5200, stock: 52, max: 90, rating: 5, reviews: 28, sales: 28, badges: [], image: "1586023492125-27b2c045efd7", material: "Silk, ceramic", colour: "Green / white", style: "Natural", desc: "A full artificial monstera set in a matte ceramic planter.", collections: ["new-arrivals"] },
    { name: "Gold Ceramic Ginger Jar", sku: "VAS-GNG-109", brand: "Studio Noir", category: "Vases & Ginger Jars", room: "Dining", price: 9900, cost: 3800, stock: 70, max: 120, rating: 5, reviews: 47, sales: 47, badges: ["BEST_SELLER"], image: "1578500494198-246f612d3b3d", material: "Ceramic", colour: "Gold", style: "Classic", desc: "A lidded ginger jar with a lustrous gold glaze.", collections: ["best-sellers"] },
    { name: "Brass Taper Candle Holders (Set of 3)", sku: "CND-BRS-110", brand: "Aura", category: "Candle Holders", room: "Dining", price: 6900, cost: 2600, stock: 90, max: 160, rating: 5, reviews: 55, sales: 88, badges: ["GIFT_IDEA"], image: "1603006905003-be475563bc59", material: "Brass", colour: "Antique brass", style: "Modern", desc: "A trio of graduated brass taper holders for an elegant table.", collections: ["gifts-under-100"] },
    { name: "Round Gold Serving Tray", sku: "TRY-GLD-111", brand: "Studio Noir", category: "Trays & Home Accessories", room: "Living Room", price: 7900, cost: 3000, stock: 80, max: 140, rating: 5, reviews: 36, sales: 36, badges: ["LATEST"], image: "1600166898405-da9535204843", material: "Metal, glass", colour: "Gold", style: "Modern", desc: "A round mirrored-base tray to corral candles, glasses and décor.", collections: ["new-arrivals"] },
    { name: "Marble & Brass Storage Box", sku: "TRY-BOX-112", brand: "Maison Atelier", category: "Trays & Home Accessories", room: "Bedroom", price: 8900, cost: 3400, stock: 55, max: 100, rating: 5, reviews: 22, sales: 22, badges: [], image: "1600166898405-da9535204843", material: "Marble, brass", colour: "White / brass", style: "Minimalist", desc: "A lidded marble box with brass trim for jewellery or keepsakes.", collections: ["luxury-collection"] },
    { name: "Buddha Cascade Water Fountain", sku: "WTR-BUD-113", brand: "Terra Living", category: "Water Features", room: "Living Room", price: 24900, cost: 10000, stock: 18, max: 40, rating: 5, reviews: 31, sales: 31, badges: ["BEST_SELLER"], image: "1578500494198-246f612d3b3d", material: "Polyresin, LED", colour: "Stone", style: "Zen", desc: "A calming indoor Buddha fountain with a gentle cascading flow and soft LED glow.", collections: ["best-sellers"] },
    { name: "LED Cascading Bowl Fountain", sku: "WTR-LED-114", brand: "Terra Living", category: "Water Features", room: "Outdoor", price: 29900, cost: 12000, stock: 12, max: 30, rating: 4, reviews: 15, sales: 15, badges: ["LATEST"], image: "1586023492125-27b2c045efd7", material: "Polyresin, LED", colour: "Charcoal", style: "Contemporary", desc: "Tiered bowls with a soft LED-lit cascade — a centrepiece for patio or foyer.", collections: ["new-arrivals"] },
    { name: "Mini Brass Deer Figurine", sku: "GFT-DER-115", brand: "Aura", category: "Gift & Décor Items", room: "Living Room", price: 3900, cost: 1400, stock: 120, max: 200, rating: 5, reviews: 40, sales: 60, badges: ["GIFT_IDEA"], image: "1549465220-1a8b9238cd48", material: "Brass", colour: "Gold", style: "Modern", desc: "A pocket-sized brass deer — the perfect desk or shelf accent gift.", collections: ["gifts-under-100"] },
  ];

  const productIds: Record<string, string> = {};
  for (const p of products) {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const created = await db.product.create({
      data: {
        name: p.name, slug, sku: p.sku, barcode: `93${p.sku.replace(/\D/g, "").padEnd(11, "0").slice(0, 11)}`,
        description: p.desc, careInstructions: "Wipe with a soft, dry cloth.", warranty: "2-year warranty",
        priceCents: p.price, compareCents: p.compare ?? null, costCents: p.cost,
        status: "ACTIVE", badges: p.badges as never[], ratingAvg: p.rating, ratingCount: p.reviews,
        salesCount: p.sales, stock: p.stock, maxStock: p.max, minStockLevel: 10,
        material: p.material, colour: p.colour, style: p.style, room: p.room,
        dimensions: "40 × 40 × 55 cm", weightGrams: 3200,
        tags: [p.style.toLowerCase(), p.category.toLowerCase(), p.brand.toLowerCase()],
        seoTitle: `${p.name} | ${p.category} | Sapphire Vibes`,
        seoDescription: p.desc.slice(0, 150),
        brandId: brands[p.brand], categoryId: cats[p.category], supplierId: supplier.id,
        images: {
          create: [
            { url: img(p.image, 900), alt: p.name, position: 0, isFeatured: true },
            { url: img(p.image, 1100), alt: `${p.name} detail`, position: 1 },
          ],
        },
        collections: { connect: p.collections.map((slug) => ({ slug })) },
      },
    });
    productIds[p.sku] = created.id;
  }

  // ── Shop the Look ───────────────────────────────────────────────────────
  await db.shopTheLook.create({
    data: {
      title: "The Sanctuary Living Room", slug: "the-sanctuary-living-room",
      heroImage: img("1586023492125-27b2c045efd7", 1200),
      products: { connect: [{ sku: "LGT-AUR-001" }, { sku: "SFT-WOL-031" }, { sku: "FRN-VEL-014" }].map((s) => ({ sku: s.sku })) },
    },
  });

  // ── Users (customers) ───────────────────────────────────────────────────
  const amelia = await db.user.create({
    data: {
      name: "Amelia Roberts", email: "amelia@email.com", passwordHash: password,
      role: "CUSTOMER", customerType: "VIP", vipTierId: gold.id, pointsBalance: 1240,
      storeCreditCents: 28000, phone: "+61 412 345 678", referralCode: "AMELIA20",
      createdAt: d("2024-02-10"), notifySalesOffers: false,
      addresses: {
        create: [
          { type: "HOME", label: "Home", fullName: "Amelia Roberts", line1: "14 Marigold Lane", city: "Bondi Beach", region: "NSW", postalCode: "2026", phone: "+61 412 345 678", isDefault: true },
          { type: "WORK", label: "Work", fullName: "Amelia Roberts", line1: "Level 8, 200 George St", city: "Sydney", region: "NSW", postalCode: "2000", phone: "+61 412 345 678" },
        ],
      },
    },
    include: { addresses: true },
  });
  const danielK = await db.user.create({ data: { name: "Daniel Kane", email: "dkane@email.com", passwordHash: password, role: "CUSTOMER", customerType: "RETAIL", vipTierId: silver.id, pointsBalance: 320, referralCode: "DANIEL20", createdAt: d("2025-03-01") } });
  const priya = await db.user.create({ data: { name: "Priya Sharma", email: "priya.s@email.com", passwordHash: password, role: "CUSTOMER", customerType: "VIP", vipTierId: gold.id, pointsBalance: 880, referralCode: "PRIYA20", createdAt: d("2024-09-12") } });
  const studioLumen = await db.user.create({ data: { name: "Studio Lumen", email: "hello@studiolumen.au", passwordHash: password, role: "INTERIOR_DESIGNER", customerType: "TRADE", vipTierId: elite.id, pointsBalance: 4200, referralCode: "LUMEN20", createdAt: d("2023-11-01") } });
  const marcusC = await db.user.create({ data: { name: "Marcus Lee", email: "mlee@email.com", passwordHash: password, role: "CUSTOMER", customerType: "RETAIL", vipTierId: silver.id, pointsBalance: 210, referralCode: "MARCUS20", createdAt: d("2025-01-20") } });
  const hotelVista = await db.user.create({ data: { name: "Hotel Vista Group", email: "procurement@vista.com", passwordHash: password, role: "CORPORATE", customerType: "CORPORATE", vipTierId: elite.id, pointsBalance: 0, referralCode: "VISTA20", createdAt: d("2024-06-05") } });
  const sofiaC = await db.user.create({ data: { name: "Sofia Green", email: "sofia.g@email.com", passwordHash: password, role: "CUSTOMER", customerType: "RETAIL", vipTierId: silver.id, pointsBalance: 95, referralCode: "SOFIA20", createdAt: d("2025-05-02") } });

  // ── Staff (RBAC) ────────────────────────────────────────────────────────
  const staff: { name: string; email: string; role: string; twoFA: boolean; last: string }[] = [
    { name: "Amelia Roberts", email: "admin@sapphirevibes.au", role: "SUPER_ADMIN", twoFA: true, last: "2026-06-25T09:00:00" },
    { name: "Priya Sharma", email: "priya@sapphirevibes.au", role: "CATALOGUE_MANAGER", twoFA: true, last: "2026-06-25T08:58:00" },
    { name: "Marcus Lee", email: "marcus@sapphirevibes.au", role: "CONTENT_EDITOR", twoFA: false, last: "2026-06-25T06:00:00" },
    { name: "Sofia Green", email: "sofia@sapphirevibes.au", role: "ORDER_FULFILMENT", twoFA: true, last: "2026-06-24T09:00:00" },
    { name: "Jordan Blake", email: "marketing@sapphirevibes.au", role: "MARKETING_MANAGER", twoFA: true, last: "2026-06-25T07:30:00" },
    { name: "Noah Pike", email: "inventory@sapphirevibes.au", role: "INVENTORY_MANAGER", twoFA: false, last: "2026-06-24T15:00:00" },
    { name: "Ruth Vale", email: "finance@sapphirevibes.au", role: "FINANCE_MANAGER", twoFA: true, last: "2026-06-23T11:00:00" },
    { name: "Ivy Lane", email: "support@sapphirevibes.au", role: "CUSTOMER_SUPPORT", twoFA: false, last: "2026-06-25T08:00:00" },
  ];
  for (const s of staff) {
    await db.user.create({ data: { name: s.name, email: s.email, passwordHash: password, role: s.role as never, twoFactorEnabled: s.twoFA, lastActiveAt: d(s.last) } });
  }

  // ── Orders ──────────────────────────────────────────────────────────────
  const GST = 0.1;
  async function makeOrder(
    number: string, user: { id: string; name: string | null } | null,
    lines: { sku: string; qty: number }[],
    opts: { status: string; payment: string; method: string; placedAt: string; tracking?: string; carrier?: string; guestEmail?: string },
  ) {
    const items = lines.map((l) => {
      const p = products.find((x) => x.sku === l.sku)!;
      return { sku: l.sku, name: p.name, image: img(p.image, 200), unit: p.price, qty: l.qty, line: p.price * l.qty };
    });
    const subtotal = items.reduce((s, i) => s + i.line, 0);
    const shipping = subtotal >= 25000 ? 0 : 995;
    const tax = Math.round(subtotal * GST);
    const total = subtotal + shipping + tax;
    await db.order.create({
      data: {
        number, userId: user?.id ?? null, guestEmail: opts.guestEmail ?? null,
        customerName: user?.name ?? "Guest", status: opts.status as never, paymentStatus: "PAID",
        paymentMethod: opts.method as never, subtotalCents: subtotal, shippingCents: shipping, taxCents: tax, totalCents: total,
        trackingNumber: opts.tracking ?? null, carrier: opts.carrier ?? null, shippingMethod: shipping === 0 ? "Free Express Shipping" : "Standard Shipping",
        placedAt: d(opts.placedAt),
        items: { create: items.map((i) => ({ productId: productIds[i.sku], nameSnapshot: i.name, skuSnapshot: i.sku, imageSnapshot: i.image, unitCents: i.unit, quantity: i.qty, lineCents: i.line })) },
      },
    });
  }

  await makeOrder("SV-10482", amelia, [{ sku: "LGT-AUR-001", qty: 1 }, { sku: "FRG-CAN-005", qty: 2 }, { sku: "SFT-LIN-027", qty: 1 }], { status: "PROCESSING", payment: "VISA", method: "VISA", placedAt: "2026-06-25", tracking: "AP9384756120AU", carrier: "Australia Post Express" });
  await makeOrder("SV-10481", danielK, [{ sku: "LGT-AUR-001", qty: 1 }], { status: "PACKED", payment: "AFTERPAY", method: "AFTERPAY", placedAt: "2026-06-25" });
  await makeOrder("SV-10480", priya, [{ sku: "SFT-WOL-031", qty: 1 }, { sku: "DEC-MIR-019", qty: 1 }, { sku: "FRG-CAN-005", qty: 2 }, { sku: "SFT-CUS-018", qty: 1 }], { status: "SHIPPED", payment: "PAYPAL", method: "PAYPAL", placedAt: "2026-06-24", tracking: "AP7261540098AU", carrier: "Australia Post Express" });
  await makeOrder("SV-10479", studioLumen, [{ sku: "LGT-AUR-001", qty: 4 }, { sku: "LGT-ALA-022", qty: 4 }, { sku: "SFT-CUS-018", qty: 4 }], { status: "PROCESSING", payment: "BANK_TRANSFER", method: "BANK_TRANSFER", placedAt: "2026-06-24" });
  await makeOrder("SV-10478", marcusC, [{ sku: "FRG-CAN-005", qty: 1 }, { sku: "SFT-LIN-027", qty: 1 }], { status: "DELIVERED", payment: "ZIP", method: "ZIP", placedAt: "2026-06-23" });
  await makeOrder("SV-10477", hotelVista, [{ sku: "LGT-ETO-040", qty: 6 }, { sku: "LGT-FLR-028", qty: 6 }, { sku: "SFT-WOL-031", qty: 6 }, { sku: "DEC-MIR-019", qty: 6 }], { status: "SHIPPED", payment: "BANK_TRANSFER", method: "BANK_TRANSFER", placedAt: "2026-06-23", tracking: "ST5512098341", carrier: "StarTrack" });
  await makeOrder("SV-10476", sofiaC, [{ sku: "SFT-LIN-027", qty: 1 }], { status: "DELIVERED", payment: "APPLE_PAY", method: "APPLE_PAY", placedAt: "2026-06-22" });
  // Amelia's earlier orders (account history)
  await makeOrder("SV-10455", amelia, [{ sku: "FRN-VEL-014", qty: 1 }], { status: "SHIPPED", payment: "VISA", method: "VISA", placedAt: "2026-06-18", tracking: "AP1029384756AU", carrier: "Australia Post Express" });
  await makeOrder("SV-10398", amelia, [{ sku: "SFT-WOL-031", qty: 1 }, { sku: "DEC-MIR-019", qty: 1 }], { status: "DELIVERED", payment: "VISA", method: "VISA", placedAt: "2026-06-02" });

  // ── Reviews, photos, Q&A, testimonials ─────────────────────────────────
  const rugReview = await db.review.create({ data: { productId: productIds["SFT-WOL-031"], userId: amelia.id, authorName: "Amelia R.", rating: 5, title: "A generational piece", body: "Stunning centrepiece for our living room — the wool is thick and the colours are even richer in person. Worth every dollar.", status: "PUBLISHED", helpfulCount: 12, isFeatured: true, createdAt: d("2026-06-05") } });
  await db.reviewPhoto.createMany({ data: [{ reviewId: rugReview.id, url: img("1600166898405-da9535204843", 200) }, { reviewId: rugReview.id, url: img("1586023492125-27b2c045efd7", 200) }] });
  await db.review.create({ data: { productId: productIds["DEC-MIR-019"], userId: amelia.id, authorName: "Amelia R.", rating: 5, body: "Beautifully made and the gold finish is elegant without being gaudy. Arrived well-packaged and easy to hang.", status: "PUBLISHED", helpfulCount: 8, createdAt: d("2026-06-04") } });
  await db.review.create({ data: { productId: productIds["FRN-VEL-014"], userId: danielK.id, authorName: "Daniel K.", rating: 5, body: "Beautiful and comfortable. Fast trade shipping.", status: "PUBLISHED", createdAt: d("2026-06-10") } });
  await db.review.create({ data: { productId: productIds["SFT-LIN-027"], userId: sofiaC.id, authorName: "Sofia G.", rating: 4, body: "Lovely texture, slightly smaller than expected.", status: "PENDING", createdAt: d("2026-06-12") } });
  await db.review.create({ data: { productId: productIds["SFT-WOL-031"], userId: marcusC.id, authorName: "Marcus L.", rating: 5, body: "Stunning centrepiece for the living room.", status: "PUBLISHED", createdAt: d("2026-06-08") } });
  await db.review.create({ data: { productId: productIds["LGT-ALA-022"], authorName: "Anon", rating: 1, body: "(flagged for review — possible spam)", status: "FLAGGED", createdAt: d("2026-06-14") } });

  await db.productQuestion.create({ data: { productId: productIds["LGT-AUR-001"], authorName: "Hannah P.", body: "What length is the included cord?", answer: "The cord is 1.5m and can be shortened on installation.", status: "PUBLISHED" } });
  await db.productQuestion.create({ data: { productId: productIds["SFT-WOL-031"], authorName: "Tom B.", body: "Is this rug suitable for underfloor heating?", status: "PENDING" } });

  await db.testimonial.createMany({
    data: [
      { quote: "The brass pendant transformed our entryway. The quality is extraordinary — it feels like a piece you'd find in a boutique hotel.", author: "Amelia R.", location: "Sydney", rating: 5 },
      { quote: "As an interior designer, the trade program has been invaluable. Fast shipping and genuinely beautiful pieces my clients adore.", author: "Daniel K.", location: "Melbourne", rating: 5 },
      { quote: "Every detail considered, from the packaging to the finish. Sapphire Vibes has become my first stop for styling a home.", author: "Priya S.", location: "Brisbane", rating: 5 },
    ],
  });

  // ── Loyalty rules, rewards, gift card, referrals, store credit ──────────
  await db.loyaltyEarnRule.createMany({ data: [
    { action: "Registration", points: "100 pts", order: 0 }, { action: "First purchase", points: "250 pts", order: 1 },
    { action: "Every $1 spent", points: "1 pt", order: 2 }, { action: "Photo review", points: "75 pts", order: 3 },
    { action: "Refer a friend", points: "500 pts", order: 4 }, { action: "Birthday", points: "2× pts", order: 5 },
    { action: "Complete profile", points: "50 pts", order: 6 }, { action: "Social follow / share", points: "25 pts", order: 7 },
  ] });
  await db.loyaltyRedeemOption.createMany({ data: [
    { label: "$5 store credit", pointsCost: "500 pts", valueCents: 500, order: 0 },
    { label: "$15 discount", pointsCost: "1,200 pts", valueCents: 1500, order: 1 },
    { label: "Free standard shipping", pointsCost: "400 pts", order: 2 },
    { label: "$25 gift card", pointsCost: "2,200 pts", valueCents: 2500, order: 3 },
    { label: "Complimentary gift wrapping", pointsCost: "300 pts", order: 4 },
    { label: "Exclusive product access", pointsCost: "VIP", order: 5 },
  ] });
  await db.rewardTransaction.createMany({ data: [
    { userId: amelia.id, points: 899, reason: "ORDER_EARN", note: "Order SV-10455 — Velvet Accent Chair", createdAt: d("2026-06-18") },
    { userId: amelia.id, points: -500, reason: "REDEEM", note: "Redeemed at checkout", createdAt: d("2026-06-02") },
    { userId: amelia.id, points: 1078, reason: "ORDER_EARN", note: "Order SV-10398 — Wool Rug + Mirror", createdAt: d("2026-06-02") },
  ] });

  await db.giftCard.create({ data: { code: "SVGC-7K2M-4821", design: "Classic Gold", initialCents: 10000, balanceCents: 7500, status: "ACTIVE", purchaserId: amelia.id } });

  await db.referral.createMany({ data: [
    { referrerId: amelia.id, code: "AMELIA20", refereeEmail: "jessica.m@email.com", status: "CONVERTED", rewardCents: 2000, createdAt: d("2026-06-22") },
    { referrerId: amelia.id, code: "AMELIA20", refereeEmail: "tom.b@email.com", status: "CONVERTED", rewardCents: 2000, createdAt: d("2026-06-14") },
    { referrerId: amelia.id, code: "AMELIA20", refereeEmail: "ravi@email.com", status: "INVITED", rewardCents: 2000, createdAt: d("2026-06-10") },
    { referrerId: amelia.id, code: "AMELIA20", refereeEmail: "lucy.k@email.com", status: "CONVERTED", rewardCents: 2000, createdAt: d("2026-06-02") },
  ] });
  await db.storeCreditTxn.createMany({ data: [
    { userId: amelia.id, deltaCents: 2000, reason: "Referral: Jessica M.", createdAt: d("2026-06-22") },
    { userId: amelia.id, deltaCents: 2000, reason: "Referral: Tom B.", createdAt: d("2026-06-14") },
    { userId: amelia.id, deltaCents: 2000, reason: "Referral: Lucy K.", createdAt: d("2026-06-02") },
  ] });

  // ── Coupons ─────────────────────────────────────────────────────────────
  await db.coupon.createMany({ data: [
    { code: "WELCOME15", type: "PERCENT", percent: 15, description: "15% off first order", firstOrderOnly: true, usedCount: 1284 },
    { code: "AUTUMN10", type: "PERCENT", percent: 10, description: "10% off sitewide", usedCount: 842, expiresAt: d("2026-06-30") },
    { code: "FREESHIP", type: "FREE_SHIPPING", description: "Free shipping over $100", minSubtotal: 10000, usedCount: 410, expiresAt: d("2026-06-30") },
    { code: "LIGHTING20", type: "PERCENT", percent: 20, description: "20% off Lighting", usedCount: 268, expiresAt: d("2026-07-15") },
    { code: "VIP25", type: "PERCENT", percent: 25, description: "25% off trade & Elite", tradeOnly: true, usedCount: 88 },
    { code: "REFER20", type: "FIXED", valueCents: 2000, description: "$20 off · referral reward", usedCount: 192 },
  ] });

  // ── Promotions & price rules ────────────────────────────────────────────
  await db.promotion.createMany({ data: [
    { name: "Autumn Flash Sale", type: "FLASH_SALE", discount: "−20%", audience: "All customers", channel: "On-site + Email", startsAt: d("2026-06-24"), endsAt: d("2026-06-30"), status: "LIVE", redemptions: 842 },
    { name: "Buy 2 Get 1 Free — Candles", type: "BOGO", discount: "3 for 2", audience: "All customers", status: "LIVE", redemptions: 318 },
    { name: "Bundle & Save — Living Room", type: "BUNDLE", discount: "−15%", audience: "All customers", status: "LIVE", redemptions: 204 },
    { name: "Spend & Save $50 off $300", type: "SPEND_SAVE", discount: "$50", audience: "All customers", status: "LIVE", redemptions: 310 },
    { name: "Free Gift over $250", type: "GIFT_WITH_PURCHASE", discount: "Free candle", audience: "All customers", status: "LIVE", redemptions: 188 },
    { name: "Elite Members −25%", type: "MEMBER_EXCLUSIVE", discount: "−25%", audience: "Elite VIP", status: "LIVE", redemptions: 96 },
    { name: "Christmas Collection", type: "SEASONAL", discount: "TBC", audience: "All customers", startsAt: d("2026-12-01"), status: "SCHEDULED", redemptions: 0 },
    { name: "Birthday 2× Points", type: "BIRTHDAY", discount: "2× pts", audience: "Members", status: "LIVE", redemptions: 620 },
  ] });
  await db.priceRule.createMany({ data: [
    { name: "Autumn Flash Sale", scope: "CATEGORY", targetLabel: "Lighting", adjustmentType: "decrease_pct", value: 20, status: "LIVE", scheduleAt: d("2026-06-30") },
    { name: "Clearance — Last Season", scope: "ALL", adjustmentType: "decrease_pct", value: 40, status: "LIVE" },
    { name: "Trade Pricing", scope: "ALL", adjustmentType: "decrease_pct", value: 25, status: "LIVE" },
    { name: "VIP Early Access", scope: "ALL", adjustmentType: "decrease_pct", value: 15, status: "SCHEDULED" },
  ] });

  // ── Marketing / CRM ─────────────────────────────────────────────────────
  await db.emailCampaign.createMany({ data: [
    { name: "Autumn Collection Launch", status: "SENT", openRate: 42, audience: "All subscribers · 28.6k", sentAt: d("2026-06-24") },
    { name: "Weekend Flash · 20% off", status: "SENT", openRate: 38, sentAt: d("2026-06-21") },
    { name: "New Lighting Arrivals", status: "SENT", openRate: 44, sentAt: d("2026-06-14") },
    { name: "VIP Early Access", status: "SCHEDULED", scheduleAt: d("2026-06-26T09:00:00") },
  ] });
  await db.emailAutomation.createMany({ data: [
    { name: "Welcome Series (Double Opt-in)", trigger: "Signup", status: "LIVE", metric: "3 emails · 52% open" },
    { name: "Abandoned Cart", trigger: "Cart idle", status: "LIVE", metric: "2 emails · 18% recovery" },
    { name: "Back-in-Stock Alert", trigger: "Restock", status: "LIVE", metric: "240 sent" },
    { name: "Price Drop Notification", trigger: "Wishlist price drop", status: "LIVE" },
    { name: "Birthday Email", trigger: "Birthday", status: "LIVE", metric: "2× points" },
    { name: "Win-back (90 days)", trigger: "Lapsed", status: "DRAFT", metric: "Lapsed customers" },
  ] });
  await db.subscriber.createMany({ data: [
    { email: "amelia@email.com", segments: ["VIP / Elite", "Wishlist active"] },
    { email: "dkane@email.com", segments: ["High AOV"] },
    { email: "priya.s@email.com", segments: ["VIP / Elite"] },
    { email: "hello@studiolumen.au", segments: ["Trade accounts"] },
    { email: "newcomer@email.com", segments: ["New subscribers"] },
    { email: "lapsed@email.com", segments: ["Lapsed 90d"] },
  ] });
  await db.segment.createMany({ data: [
    { name: "VIP / Elite", rule: "Lifetime spend $3,000+", count: 980, avgClvCents: 184000, consent: "Opted in" },
    { name: "High AOV", rule: "Avg order $300+", count: 1820, avgClvCents: 72000, consent: "Opted in" },
    { name: "Cart abandoners", rule: "Cart, no purchase 7d", count: 940, avgClvCents: 21000, consent: "Mixed" },
    { name: "Lapsed 90 days", rule: "No order in 90d", count: 2140, avgClvCents: 34000, consent: "Opted in" },
    { name: "Trade accounts", rule: "Business / designer", count: 312, avgClvCents: 420000, consent: "Opted in" },
    { name: "New subscribers", rule: "Joined < 30d", count: 1240, avgClvCents: 0, consent: "Opted in" },
  ] });
  await db.integration.createMany({ data: [
    { name: "Klaviyo", category: "Marketing & Email", blurb: "Email & SMS automation", status: "CONNECTED" },
    { name: "Mailchimp", category: "Marketing & Email", blurb: "Newsletter", status: "CONNECTED" },
    { name: "Brevo", category: "Marketing & Email", blurb: "Transactional email", status: "SETUP" },
    { name: "Google Analytics 4", category: "Analytics & Pixels", blurb: "Web analytics", status: "CONNECTED" },
    { name: "Google Tag Manager", category: "Analytics & Pixels", blurb: "Tag management", status: "CONNECTED" },
    { name: "Meta Pixel", category: "Analytics & Pixels", blurb: "FB & IG tracking", status: "CONNECTED" },
    { name: "TikTok Pixel", category: "Analytics & Pixels", blurb: "TikTok ads", status: "CONNECTED" },
    { name: "Microsoft Clarity", category: "Analytics & Pixels", blurb: "Heatmaps & sessions", status: "SETUP" },
    { name: "Google Merchant Center", category: "Analytics & Pixels", blurb: "Shopping feed", status: "CONNECTED" },
    { name: "Stripe", category: "Payments", blurb: "Card payments", status: "CONNECTED" },
    { name: "PayPal", category: "Payments", blurb: "Express checkout", status: "CONNECTED" },
    { name: "Afterpay", category: "Payments", blurb: "Buy now, pay later", status: "CONNECTED" },
    { name: "Zip", category: "Payments", blurb: "Buy now, pay later", status: "CONNECTED" },
    { name: "Apple Pay", category: "Payments", blurb: "Wallet", status: "CONNECTED" },
    { name: "Google Pay", category: "Payments", blurb: "Wallet", status: "CONNECTED" },
    { name: "Australia Post", category: "Shipping & Logistics", blurb: "Domestic & express", status: "CONNECTED" },
    { name: "Sendle", category: "Shipping & Logistics", blurb: "Carbon-neutral", status: "CONNECTED" },
    { name: "Aramex", category: "Shipping & Logistics", blurb: "Regional", status: "SETUP" },
    { name: "StarTrack", category: "Shipping & Logistics", blurb: "Premium freight", status: "SETUP" },
    { name: "DHL", category: "Shipping & Logistics", blurb: "International", status: "SETUP" },
    { name: "FedEx", category: "Shipping & Logistics", blurb: "International", status: "SETUP" },
  ] });

  // ── CMS: homepage blocks, pages, blog, faqs ─────────────────────────────
  const blocks = [
    { key: "hero", name: "Hero Slider", type: "hero", blurb: "3 slides · Autumn campaign live", visible: true },
    { key: "promo", name: "Promotional Banner", type: "banner", blurb: "Free shipping over $250", visible: true },
    { key: "rooms", name: "Featured Categories", type: "categories", blurb: "6 rooms", visible: true },
    { key: "new", name: "New Arrivals", type: "products", blurb: "Auto · latest 8 products", visible: true },
    { key: "collections", name: "Featured Collections", type: "collections", blurb: "Lighting + Gifts edit", visible: true },
    { key: "best", name: "Hot Selling Products", type: "products", blurb: "Best sellers carousel", visible: true },
    { key: "festival", name: "Festival Specials", type: "products", blurb: "Hidden until Dec 1", visible: false },
    { key: "reviews", name: "Customer Reviews", type: "reviews", blurb: "4.9★ from 2.4k reviews", visible: true },
    { key: "instagram", name: "Instagram Feed", type: "instagram", blurb: "@sapphirevibes · 9 posts", visible: true },
    { key: "newsletter", name: "Newsletter Section", type: "newsletter", blurb: "10% off first order", visible: true },
  ];
  for (const [i, b] of blocks.entries()) {
    await db.homepageBlock.create({ data: { key: b.key, name: b.name, type: b.type, blurb: b.blurb, position: i, isVisible: b.visible } });
  }

  const pages = [
    { slug: "about-us", title: "About Us", status: "PUBLISHED" },
    { slug: "shipping-policy", title: "Shipping Policy", status: "PUBLISHED" },
    { slug: "returns-refunds", title: "Returns & Refunds", status: "PUBLISHED" },
    { slug: "trade-program", title: "Trade Program", status: "PUBLISHED" },
    { slug: "corporate-gifting", title: "Corporate Gifting", status: "DRAFT" },
    { slug: "privacy-policy", title: "Privacy Policy", status: "PUBLISHED" },
    { slug: "terms", title: "Terms & Conditions", status: "PUBLISHED" },
    { slug: "faq", title: "Frequently Asked Questions", status: "PUBLISHED" },
    { slug: "contact", title: "Contact Us", status: "PUBLISHED" },
  ];
  for (const p of pages) {
    await db.page.create({ data: { slug: p.slug, title: p.title, status: p.status as never, body: `## ${p.title}\n\nThis is placeholder content for the ${p.title} page. Edit it in the admin CMS.`, seoTitle: `${p.title} · Sapphire Vibes` } });
  }

  await db.blogPost.createMany({ data: [
    { slug: "5-ways-to-style-brass-lighting", title: "5 Ways to Style Brass Lighting", category: "Home Styling", excerpt: "Warm metallics for every room.", body: "Brass lighting brings warmth and depth…", coverUrl: img("1513506003901-1e6a229e2d15", 800), status: "PUBLISHED", views: 1200, publishedAt: d("2026-06-10") },
    { slug: "the-hamptons-look-at-home", title: "The Hamptons Look at Home", category: "Interior Design", excerpt: "Relaxed coastal elegance.", body: "The Hamptons aesthetic blends…", coverUrl: img("1586023492125-27b2c045efd7", 800), status: "PUBLISHED", views: 840, publishedAt: d("2026-06-04") },
    { slug: "gift-guide-under-100", title: "Gift Guide: Under $100", category: "Gift Guides", excerpt: "Thoughtful pieces to celebrate.", body: "Finding the perfect gift…", coverUrl: img("1549465220-1a8b9238cd48", 800), status: "SCHEDULED", views: 0, publishedAt: d("2026-07-01") },
  ] });

  await db.faq.createMany({ data: [
    { question: "How long does shipping take?", answer: "Standard shipping is 3–7 business days; express is 1–3 business days.", category: "Shipping", position: 0 },
    { question: "What is your returns policy?", answer: "We accept returns within 30 days of delivery for a full refund.", category: "Returns", position: 1 },
    { question: "Do you offer trade pricing?", answer: "Yes — interior designers and architects can apply for our Trade Program for exclusive pricing.", category: "Trade", position: 2 },
    { question: "Can I track my order?", answer: "Yes, use your order number and email on the Track Order page, or your account dashboard.", category: "Orders", position: 3 },
  ] });

  // ── Settings & audit log ────────────────────────────────────────────────
  await db.setting.createMany({ data: [
    { key: "store", value: { name: "Sapphire Vibes", abn: "00 000 000 000", currency: "USD", country: "Australia" } },
    { key: "tax", value: { gstRate: 0.1, display: "Inclusive of GST", abn: "00 000 000 000" } },
    { key: "shipping", value: { freeOver250: true, express: true, clickCollect: false, localDelivery: true } },
  ] });
  await db.auditLog.createMany({ data: [
    { actorName: "Priya Sharma", action: "Updated pricing", targetType: "PriceRule", meta: { rule: "Autumn Flash Sale", change: "−20%" }, createdAt: d("2026-06-25T08:58:00") },
    { actorName: "System", action: "Auto-backup", targetType: "System", meta: { type: "Full store snapshot" }, createdAt: d("2026-06-25T08:00:00") },
    { actorName: "Marcus Lee", action: "Published product", targetType: "Product", meta: { name: "Aurelia Brass Pendant" }, createdAt: d("2026-06-25T06:00:00") },
    { actorName: "Amelia Roberts", action: "Exported orders", targetType: "Order", meta: { format: "CSV", rows: 1284 }, createdAt: d("2026-06-25T04:00:00") },
  ] });

  // ── Wishlist + cart for Amelia (so account/cart aren't empty) ───────────
  await db.wishlistItem.createMany({ data: ["DEC-MAR-007", "LGT-ALA-022", "DEC-MIR-019", "FRN-VEL-014", "FRG-CAN-005", "SFT-WOL-031"].map((sku) => ({ userId: amelia.id, productId: productIds[sku] })) });

  console.log("✅ Seed complete.");
  console.log("   Demo login (all accounts): password123");
  console.log("   Customer: amelia@email.com   ·   Admin: admin@sapphirevibes.au   ·   Marketing: marketing@sapphirevibes.au");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
