import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Combining diacritical marks (U+0300–U+036F) — stripped after NFD normalization.
const COMBINING_MARKS = /[̀-ͯ]/g;

/** Build a URL-safe slug from a string, e.g. "Lumière Co." -> "lumiere-co". */
export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/** Initials for avatars, e.g. "Amelia Roberts" -> "AR". */
export function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
