"use client";

import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#171c24",
            border: "1px solid rgba(200,164,92,0.2)",
            color: "#F4EFE6",
          },
        }}
      />
    </>
  );
}
