"use client";

import { Toaster } from "sonner";
import { StoreProvider } from "@/components/storefront/store-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
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
    </StoreProvider>
  );
}
