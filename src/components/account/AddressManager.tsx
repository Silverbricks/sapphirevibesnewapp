"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, FormField } from "@/components/ui";
import { addAddress, deleteAddress, setDefaultAddress } from "@/actions/account";

interface Address {
  id: string;
  label: string | null;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
}

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  async function onDelete(id: string) {
    await deleteAddress(id);
    router.refresh();
  }
  async function onSetDefault(id: string) {
    await setDefaultAddress(id);
    router.refresh();
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {addresses.map((a) => (
          <div key={a.id} className={`relative rounded-card border bg-card p-[22px] ${a.isDefault ? "border-line-gold" : "border-line"}`}>
            {a.isDefault && (
              <span className="absolute right-[18px] top-[18px] text-[10px] uppercase tracking-[0.1em] text-gold">Default</span>
            )}
            <h4 className="mb-1.5 font-serif text-xl">{a.label}</h4>
            <p className="text-[13px] leading-[1.7] text-grey">
              {a.fullName}<br />
              {a.line1}<br />
              {a.line2 && <>{a.line2}<br /></>}
              {a.city}, {a.region} {a.postalCode}<br />
              {a.country}
              {a.phone && <><br />{a.phone}</>}
            </p>
            <div className="mt-3.5 flex gap-4 text-xs text-gold">
              {!a.isDefault && (
                <button onClick={() => onSetDefault(a.id)} className="hover:underline">Set Default</button>
              )}
              <button onClick={() => onDelete(a.id)} className="text-muted hover:text-red">Remove</button>
            </div>
          </div>
        ))}
      </div>

      {adding ? (
        <form
          action={async (fd) => {
            await addAddress(fd);
            setAdding(false);
            router.refresh();
          }}
          className="mt-5 rounded-card border border-line bg-card p-[22px]"
        >
          <h4 className="mb-4 font-serif text-xl">New Address</h4>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <FormField label="Label"><Input name="label" placeholder="Home" /></FormField>
            <FormField label="Full Name"><Input name="fullName" required /></FormField>
            <FormField label="Address Line 1"><Input name="line1" required /></FormField>
            <FormField label="Address Line 2"><Input name="line2" /></FormField>
            <FormField label="City"><Input name="city" required /></FormField>
            <FormField label="State / Region"><Input name="region" required /></FormField>
            <FormField label="Postcode"><Input name="postalCode" required /></FormField>
            <FormField label="Phone"><Input name="phone" /></FormField>
          </div>
          <div className="flex gap-3">
            <Button type="submit" variant="gold">Save Address</Button>
            <Button type="button" variant="dark" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <Button variant="gold" className="mt-[18px]" onClick={() => setAdding(true)}>
          + Add New Address
        </Button>
      )}
    </div>
  );
}
