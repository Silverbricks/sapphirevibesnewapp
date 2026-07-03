"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateOrderStatus } from "@/actions/orders";

export const ORDER_STATUSES = [
  "PENDING", "PROCESSING", "PACKED", "READY_FOR_DISPATCH", "SHIPPED", "IN_TRANSIT",
  "OUT_FOR_DELIVERY", "DELIVERED", "ON_HOLD", "CANCELLED", "RETURNED", "REFUNDED",
];
const STATUSES = ORDER_STATUSES;

export function OrderStatusSelect({ orderId, current }: { orderId: string; current: string }) {
  const [value, setValue] = useState(current);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        setValue(next);
        startTransition(async () => {
          await updateOrderStatus(orderId, next);
          toast.success(`Status → ${next.charAt(0) + next.slice(1).toLowerCase().replace(/_/g, " ")}`);
          router.refresh();
        });
      }}
      className="rounded-lg border border-line bg-panel px-2.5 py-1.5 text-xs text-cream outline-none focus:border-gold disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}
