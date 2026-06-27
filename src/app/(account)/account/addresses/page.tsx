import { requireUser } from "@/lib/auth-helpers";
import { getAddresses } from "@/lib/data/account";
import { AddressManager } from "@/components/account/AddressManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const user = await requireUser();
  const addresses = await getAddresses(user.id);
  return (
    <div>
      <h1 className="font-serif text-[34px]">Addresses</h1>
      <p className="mb-7 text-[13px] text-muted">Manage your shipping and billing addresses.</p>
      <AddressManager addresses={addresses} />
    </div>
  );
}
