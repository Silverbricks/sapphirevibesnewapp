"use client";

import { useEffect } from "react";
import { useStore } from "./store-context";

export function ClearCart() {
  const store = useStore();
  useEffect(() => {
    store.clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
