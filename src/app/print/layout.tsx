import type { Metadata } from "next";

export const metadata: Metadata = { title: "Document" };

// Standalone light layout for printable documents (no admin chrome).
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <div className="mx-auto max-w-[820px] px-8 py-8">{children}</div>
    </div>
  );
}
