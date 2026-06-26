import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5 font-serif text-cream", className)} style={{ fontSize: size }}>
      <svg viewBox="0 0 24 24" fill="none" width={size * 0.78} height={size * 0.78}>
        <path
          d="M12 2l3 7 7 1-5 5 1.5 7L12 18 5.5 22 7 13 2 8l7-1z"
          stroke="#C8A45C"
          strokeWidth="1.3"
        />
      </svg>
      Sapphire<b className="font-semibold text-gold">Vibes</b>
    </Link>
  );
}
