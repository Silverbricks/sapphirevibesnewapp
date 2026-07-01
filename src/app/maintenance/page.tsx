import { getSystemSettings, getSiteSettings } from "@/lib/data/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "We’ll be right back" };

export default async function MaintenancePage() {
  const [system, { store }] = await Promise.all([getSystemSettings(), getSiteSettings()]);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center">
      <div className="glow-gold absolute inset-0 -z-10" />
      <span className="eyebrow mb-6">{store.name}</span>
      <h1 className="mb-4 font-serif text-[clamp(36px,6vw,64px)] leading-tight text-cream">
        We’ll be right back
      </h1>
      <p className="max-w-lg text-[15px] leading-relaxed text-grey">{system.maintenanceMessage}</p>
      <div className="mt-8 h-px w-24 bg-line-gold" />
      <p className="mt-8 text-xs uppercase tracking-[0.2em] text-muted">Thank you for your patience</p>
    </div>
  );
}
