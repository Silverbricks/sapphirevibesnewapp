"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-[9px] border border-line bg-panel px-3.5 py-3 text-[14px] text-cream outline-none transition-colors placeholder:text-muted focus:border-gold";

export const Input = ({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(fieldBase, className)} {...props} />
);

/** Password field with a show/hide toggle, so a typed value can be checked before submit. */
export const PasswordInput = ({
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) => {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return (
    <div className="relative">
      {/* pr-11 keeps a long value from running under the toggle. */}
      <input
        type={visible ? "text" : "password"}
        className={cn(fieldBase, "pr-11", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-0 top-0 flex h-full w-11 items-center justify-center text-muted transition-colors hover:text-gold"
      >
        <Icon className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </div>
  );
};

export const Textarea = ({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cn(fieldBase, "min-h-[90px] resize-y", className)} {...props} />
);

export const Select = ({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={cn(fieldBase, "cursor-pointer", className)} {...props}>
    {children}
  </select>
);

export function FieldLabel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "mb-[7px] block text-[11px] uppercase tracking-[0.12em] text-muted",
        className,
      )}
    >
      {children}
    </label>
  );
}

export function FormField({
  label,
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4", className)}>
      {label && <FieldLabel>{label}</FieldLabel>}
      {children}
    </div>
  );
}

/** Gold/grey switch toggle matching the mockups' `.sw`. */
export function Toggle({
  checked,
  onChange,
  className,
}: {
  checked: boolean;
  onChange?: (next: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative h-6 w-[42px] flex-shrink-0 rounded-full transition-colors",
        checked ? "bg-gold" : "bg-white/15",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-all",
          checked ? "right-[3px]" : "left-[3px]",
        )}
      />
    </button>
  );
}
