import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "gold" | "outline" | "ghost" | "dark";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none";

const VARIANTS: Record<ButtonVariant, string> = {
  gold: "bg-gold text-ink hover:bg-gold-soft",
  outline: "border border-line-gold text-gold hover:bg-gold/10",
  ghost: "text-grey hover:text-cream hover:bg-white/5",
  dark: "bg-panel border border-line text-cream hover:border-line-gold",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "text-xs px-4 py-2",
  md: "text-[13px] px-5 py-3 tracking-[0.04em]",
  lg: "text-[13px] px-8 py-4 tracking-[0.16em] uppercase",
};

/** Class string for buttons — reuse on `<Link>` etc. so anchors look like buttons. */
export function buttonClasses(
  variant: ButtonVariant = "gold",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(base, VARIANTS[variant], SIZES[size], className);
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = "gold",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClasses(variant, size, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
