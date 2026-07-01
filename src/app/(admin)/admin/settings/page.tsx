import Image from "next/image";
import { requireModule } from "@/lib/auth-helpers";
import { getSettingsData } from "@/lib/data/admin";
import { getSiteSettings } from "@/lib/data/settings";
import { Panel, Input, Textarea, FormField } from "@/components/ui";
import { PageHead } from "@/components/admin/PageHead";
import { SettingForm } from "@/components/admin/SettingForm";
import { ShippingSettingsForm } from "@/components/admin/ShippingSettingsForm";
import { IntegrationsEditor } from "@/components/admin/IntegrationsEditor";
import {
  saveStoreSettings,
  saveBrandingSettings,
  saveSocialSettings,
  saveTaxSettings,
} from "@/actions/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings · Admin" };

const fileInput =
  "block w-full text-sm text-muted file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gold file:px-4 file:py-2 file:font-medium file:text-ink hover:file:bg-gold-soft";

export default async function SettingsPage() {
  await requireModule("settings");
  const { integrations } = await getSettingsData();
  const { store, social, branding, tax, shipping } = await getSiteSettings();

  return (
    <>
      <PageHead title="Settings" subtitle="Store configuration, branding, tax, shipping, social and integrations." />

      <div className="mb-[18px] grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <SettingForm action={saveStoreSettings} title="Store Information">
          <FormField label="Store Name"><Input name="name" defaultValue={store.name} /></FormField>
          <FormField label="Tagline"><Input name="tagline" defaultValue={store.tagline} /></FormField>
          <FormField label="Description"><Textarea name="description" defaultValue={store.description} rows={2} /></FormField>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <FormField label="Contact Email"><Input name="email" type="email" defaultValue={store.email} /></FormField>
            <FormField label="Phone"><Input name="phone" defaultValue={store.phone} /></FormField>
          </div>
          <FormField label="Address"><Input name="address" defaultValue={store.address} /></FormField>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
            <FormField label="Country"><Input name="country" defaultValue={store.country} /></FormField>
            <FormField label="Currency"><Input name="currency" defaultValue={store.currency} /></FormField>
            <FormField label="ABN"><Input name="abn" defaultValue={store.abn} /></FormField>
          </div>
        </SettingForm>

        <SettingForm action={saveBrandingSettings} title="Branding">
          <div className="mb-4 flex items-center gap-4">
            {branding.logoUrl && (
              <div className="relative h-14 w-28 overflow-hidden rounded-card border border-line bg-ink">
                <Image src={branding.logoUrl} alt="Logo" fill sizes="112px" className="object-contain p-1" />
              </div>
            )}
            <div className="flex-1">
              <FormField label="Logo (upload)"><input type="file" name="logoFile" accept="image/*" className={fileInput} /></FormField>
            </div>
          </div>
          <FormField label="…or logo URL"><Input name="logoUrl" defaultValue={branding.logoUrl ?? ""} placeholder="https://…" /></FormField>
          <div className="mb-4 flex items-center gap-4">
            {branding.faviconUrl && (
              <div className="relative h-10 w-10 overflow-hidden rounded-card border border-line bg-ink">
                <Image src={branding.faviconUrl} alt="Favicon" fill sizes="40px" className="object-contain p-1" />
              </div>
            )}
            <div className="flex-1">
              <FormField label="Favicon (upload)"><input type="file" name="faviconFile" accept="image/*" className={fileInput} /></FormField>
            </div>
          </div>
          <FormField label="…or favicon URL"><Input name="faviconUrl" defaultValue={branding.faviconUrl ?? ""} placeholder="https://…" /></FormField>
        </SettingForm>
      </div>

      <div className="mb-[18px] grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <SettingForm action={saveSocialSettings} title="Social Links">
          <FormField label="Instagram"><Input name="instagram" defaultValue={social.instagram} placeholder="https://instagram.com/…" /></FormField>
          <FormField label="Facebook"><Input name="facebook" defaultValue={social.facebook} placeholder="https://facebook.com/…" /></FormField>
          <FormField label="Pinterest"><Input name="pinterest" defaultValue={social.pinterest} placeholder="https://pinterest.com/…" /></FormField>
          <FormField label="TikTok"><Input name="tiktok" defaultValue={social.tiktok} placeholder="https://tiktok.com/@…" /></FormField>
          <FormField label="YouTube"><Input name="youtube" defaultValue={social.youtube} placeholder="https://youtube.com/@…" /></FormField>
        </SettingForm>

        <div className="space-y-[18px]">
          <SettingForm action={saveTaxSettings} title="Tax & GST">
            <FormField label="GST Rate (%)"><Input name="gstRate" defaultValue={String((tax.gstRate ?? 0.1) * 100)} /></FormField>
            <FormField label="Tax Display"><Input name="display" defaultValue={tax.display} /></FormField>
            <FormField label="Business ABN"><Input name="abn" defaultValue={tax.abn} /></FormField>
          </SettingForm>
          <ShippingSettingsForm shipping={shipping} />
        </div>
      </div>

      <Panel>
        <h3 className="mb-4 font-serif text-[21px]">Integrations</h3>
        <IntegrationsEditor integrations={integrations} />
      </Panel>
    </>
  );
}
