import Link from "next/link";
import { Logo } from "@/components/storefront/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="glow-gold flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Logo size={30} />
      <div className="mt-8 w-full max-w-md">{children}</div>
      <Link
        href="/"
        className="mt-8 text-xs uppercase tracking-[0.12em] text-muted transition-colors hover:text-gold"
      >
        ← Back to store
      </Link>
    </div>
  );
}
