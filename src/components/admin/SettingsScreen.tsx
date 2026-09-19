import React, { useEffect, useState } from 'react';
import { AlertCircle, MapPin, Plus, Save, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { StoreSettings } from '../../types';
import { ImageField } from './ImageField';
import { Field, btnGhost, btnPrimary, inputClass, useToast } from './ui';

export const SettingsScreen: React.FC = () => {
  const { storeSettings, updateStoreSettings } = useStore();
  const toast = useToast();
  const [form, setForm] = useState<StoreSettings>(storeSettings);
  const [areaName, setAreaName] = useState('');
  const [areaPin, setAreaPin] = useState('');

  useEffect(() => setForm(storeSettings), [storeSettings]);

  const set = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings(form);
    toast('success', 'Settings saved.');
  };

  const addArea = () => {
    if (!areaName.trim()) return;
    const next = { ...form, deliveryAreas: [...form.deliveryAreas, { name: areaName.trim(), pin: areaPin.trim() }] };
    setForm(next);
    updateStoreSettings(next);
    setAreaName('');
    setAreaPin('');
  };

  const removeArea = (index: number) => {
    const next = { ...form, deliveryAreas: form.deliveryAreas.filter((_, i) => i !== index) };
    setForm(next);
    updateStoreSettings(next);
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#241510]">Settings</h2>
          <p className="text-xs text-[#8C766B]">
            The details that appear on your site, your invoices and your payment screen.
          </p>
        </div>
        <button type="submit" className={btnPrimary}>
          <Save className="h-3.5 w-3.5" /> Save settings
        </button>
      </div>

      <section className="space-y-3 rounded-2xl border border-[#E8DFD8] bg-white p-4">
        <h3 className="text-xs font-semibold text-[#241510]">Business</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Store name">
            <input value={form.storeName} onChange={(e) => set('storeName', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Tagline">
            <input value={form.tagline} onChange={(e) => set('tagline', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Street address" className="sm:col-span-2">
            <input value={form.address} onChange={(e) => set('address', e.target.value)} className={inputClass} />
          </Field>
          <Field label="City">
            <input value={form.city} onChange={(e) => set('city', e.target.value)} className={inputClass} />
          </Field>
          <Field label="State">
            <input value={form.state} onChange={(e) => set('state', e.target.value)} className={inputClass} />
          </Field>
          <Field label="PIN code">
            <input value={form.pincode} onChange={(e) => set('pincode', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Landmark">
            <input value={form.landmark} onChange={(e) => set('landmark', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Operating hours" className="sm:col-span-2">
            <input value={form.operatingHours} onChange={(e) => set('operatingHours', e.target.value)} className={inputClass} />
          </Field>
          <Field
            label="FSSAI licence number"
            hint="14 digits. A food business must display this; it appears in the footer and on the shop page."
          >
            <input
              value={form.fssaiLicense}
              onChange={(e) => set('fssaiLicense', e.target.value)}
              inputMode="numeric"
              className={`${inputClass} font-mono tabular-nums`}
            />
          </Field>
          <Field label="GSTIN">
            <input value={form.gstin} onChange={(e) => set('gstin', e.target.value)} className={`${inputClass} font-mono`} />
          </Field>
          <ImageField
            label="Logo image"
            hint="The full badge. Used large, and as the picture when your link is shared."
            value={form.logoUrl}
            onChange={(logoUrl) => set('logoUrl', logoUrl)}
          />
          <ImageField
            label="Small logo mark"
            hint="A tighter crop for the header, where the badge's lettering is too small to read. Blank uses the full logo."
            value={form.logoMarkUrl}
            onChange={(logoMarkUrl) => set('logoMarkUrl', logoMarkUrl)}
          />
          <ImageField
            label="FSSAI logo"
            hint="The official emblem from fssai.gov.in. Leave blank to show the licence number on its own."
            value={form.fssaiLogoUrl}
            onChange={(fssaiLogoUrl) => set('fssaiLogoUrl', fssaiLogoUrl)}
          />
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-[#E8DFD8] bg-white p-4">
        <h3 className="text-xs font-semibold text-[#241510]">Payment</h3>

        {!form.upiId && (
          <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-900">
            <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
            <span>
              <b>Check this today.</b> With no UPI ID set, the payment screen has nothing to show a
              customer. Set it, then send yourself a ₹1 test payment to confirm the money arrives.
            </span>
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Primary UPI ID">
            <input
              value={form.upiId}
              onChange={(e) => set('upiId', e.target.value)}
              placeholder="yourname@bank"
              className={`${inputClass} font-mono`}
            />
          </Field>
          <Field label="UPI account holder name">
            <input value={form.upiAccountName} onChange={(e) => set('upiAccountName', e.target.value)} className={inputClass} />
          </Field>
          <ImageField
            label="UPI QR image"
            hint="Optional — upload a screenshot of your bank's QR code to show at checkout."
            value={form.upiQrImage}
            onChange={(upiQrImage) => set('upiQrImage', upiQrImage)}
            className="sm:col-span-2"
          />
          <Field label="Payment instructions" hint="Shown to the customer at checkout." className="sm:col-span-2">
            <textarea
              rows={2}
              value={form.paymentInstructions}
              onChange={(e) => set('paymentInstructions', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-[#E8DFD8] bg-white p-4">
        <h3 className="text-xs font-semibold text-[#241510]">Charges</h3>
        <p className="text-[11px] text-[#8C766B]">
          These feed the one pricing function the cart, the checkout and the stored order all use, so
          the three can never disagree.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="GST %">
            <input
              type="number"
              min={0}
              max={100}
              value={form.gstPercent}
              onChange={(e) => set('gstPercent', Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Delivery fee (₹)">
            <input
              type="number"
              min={0}
              value={form.deliveryFee}
              onChange={(e) => set('deliveryFee', Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Free delivery over (₹)">
            <input
              type="number"
              min={0}
              value={form.freeDeliveryThreshold}
              onChange={(e) => set('freeDeliveryThreshold', Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-[#E8DFD8] bg-white p-4">
        <h3 className="text-xs font-semibold text-[#241510]">Delivery coverage</h3>
        <Field label="Delivery radius (km)" className="max-w-[12rem]">
          <input
            type="number"
            min={0}
            value={form.deliveryRadiusKm}
            onChange={(e) => set('deliveryRadiusKm', Number(e.target.value))}
            className={inputClass}
          />
        </Field>

        <div className="flex flex-wrap gap-2">
          {form.deliveryAreas.map((area, i) => (
            <span
              key={`${area.name}-${i}`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#E8DFD8] bg-[#FAF7F2] py-0.5 pl-3 pr-1 text-[11px] font-medium text-[#241510]"
            >
              <MapPin className="h-3 w-3 text-[#C58940]" />
              {area.name}
              {area.pin && <span className="font-mono text-[10px] text-[#8C766B]">({area.pin})</span>}
              <button
                type="button"
                aria-label={`Remove ${area.name}`}
                onClick={() => removeArea(i)}
                className="-mr-1 ml-0.5 flex h-8 w-8 items-center justify-center rounded-full text-[#8C766B] hover:bg-rose-50 hover:text-rose-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            value={areaName}
            onChange={(e) => setAreaName(e.target.value)}
            placeholder="Area or neighbourhood"
            className={`${inputClass} max-w-xs flex-1`}
          />
          <input
            value={areaPin}
            onChange={(e) => setAreaPin(e.target.value)}
            placeholder="PIN"
            className={`${inputClass} w-28`}
          />
          <button type="button" onClick={addArea} className={btnGhost}>
            <Plus className="h-3.5 w-3.5" /> Add area
          </button>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-[#E8DFD8] bg-white p-4">
        <h3 className="text-xs font-semibold text-[#241510]">Contact &amp; social</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Admin WhatsApp number" hint="Every Inquire button reaches this number.">
            <input
              value={form.whatsappNumber}
              onChange={(e) => set('whatsappNumber', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Instagram URL">
            <input value={form.instagramUrl} onChange={(e) => set('instagramUrl', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Facebook URL">
            <input value={form.facebookUrl} onChange={(e) => set('facebookUrl', e.target.value)} className={inputClass} />
          </Field>
          <Field label="YouTube URL">
            <input value={form.youtubeUrl} onChange={(e) => set('youtubeUrl', e.target.value)} className={inputClass} />
          </Field>
        </div>
        <p className="text-[11px] text-[#8C766B]">A link left blank is simply not shown, rather than appearing as a dead icon.</p>
      </section>

      <button type="submit" className={`${btnPrimary} w-full py-2.5`}>
        <Save className="h-3.5 w-3.5" /> Save settings
      </button>
    </form>
  );
};
