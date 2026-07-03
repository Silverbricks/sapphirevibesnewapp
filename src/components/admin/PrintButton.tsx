"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white hover:bg-black"
    >
      <Printer className="h-4 w-4" /> Print / Save as PDF
    </button>
  );
}
