import {
  Button,
  Card,
  Panel,
  PanelHead,
  Pill,
  OrderStatusPill,
  ProductBadgeChip,
  SoldOutChip,
  Price,
  RatingStars,
  ProgressBar,
  StockBar,
  StatCard,
  MiniStat,
  SummaryCard,
  Input,
  Textarea,
  FormField,
  Avatar,
  EmptyState,
} from "@/components/ui";
import { ALL_BADGES } from "@/lib/badges";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-serif text-2xl text-gold">{title}</h2>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  );
}

export default function StyleGuide() {
  return (
    <main className="wrap space-y-12 py-16">
      <header>
        <span className="eyebrow">Internal</span>
        <h1 className="font-serif text-5xl">Style Guide</h1>
        <p className="mt-2 text-muted">
          Design tokens & shared UI primitives for Sapphire Vibes.
        </p>
      </header>

      <Section title="Buttons">
        <Button variant="gold">Add to Cart</Button>
        <Button variant="outline">Track Order</Button>
        <Button variant="ghost">View Details</Button>
        <Button variant="dark">Cancel</Button>
        <Button variant="gold" size="lg">
          Shop the Collection
        </Button>
        <Button variant="gold" loading>
          Saving
        </Button>
      </Section>

      <Section title="Pills & status">
        <Pill color="gold">Gold</Pill>
        <Pill color="green">Active</Pill>
        <Pill color="amber">Expires soon</Pill>
        <Pill color="red">Flagged</Pill>
        <Pill color="blue">Shipped</Pill>
        <Pill color="purple">Member</Pill>
        <OrderStatusPill status="PROCESSING" />
        <OrderStatusPill status="SHIPPED" />
        <OrderStatusPill status="DELIVERED" />
      </Section>

      <Section title="Product badges">
        <div className="flex flex-wrap gap-2">
          {ALL_BADGES.map((b) => (
            <ProductBadgeChip key={b} badge={b} />
          ))}
          <SoldOutChip />
        </div>
      </Section>

      <Section title="Price & rating">
        <Card className="p-5">
          <Price cents={89900} compareCents={119900} showSave size="lg" />
          <RatingStars rating={5} count={284} className="mt-2" />
        </Card>
      </Section>

      <Section title="Stat cards">
        <StatCard label="Revenue (30d)" value="$84.2k" delta="12.4% vs last month" />
        <MiniStat label="Low Stock" value={18} tone="warn" />
        <MiniStat label="Out of Stock" value={5} tone="danger" />
        <SummaryCard value="1,240" label="Reward Points" />
      </Section>

      <Section title="Progress & stock">
        <Card className="w-72 space-y-3 p-5">
          <ProgressBar value={68} />
          <div className="flex items-center gap-3 text-xs text-muted">
            48 units
            <StockBar value={48} max={60} tone="green" />
          </div>
          <div className="flex items-center gap-3 text-xs text-muted">
            6 units
            <StockBar value={6} max={40} tone="amber" />
          </div>
        </Card>
      </Section>

      <Section title="Form fields">
        <Panel className="w-80">
          <PanelHead title="Personal Details" />
          <FormField label="First Name">
            <Input defaultValue="Amelia" />
          </FormField>
          <FormField label="Notes">
            <Textarea placeholder="Add a note…" />
          </FormField>
          <Button variant="gold">Save Changes</Button>
        </Panel>
      </Section>

      <Section title="Avatar & empty state">
        <Avatar name="Amelia Roberts" size={56} />
        <EmptyState
          title="Your wishlist is empty"
          description="Save pieces you love and find them here."
          className="w-96"
        />
      </Section>
    </main>
  );
}
