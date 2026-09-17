import React, { useState } from 'react';
import {
  BarChart3,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Package,
  Settings as SettingsIcon,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Users,
  UserCog,
  AlertCircle,
  HardDrive,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  STORAGE_BUDGET_BYTES,
  formatBytes,
  localStorageBytesUsed,
} from '../../lib/imageUpload';
import { Permission, ROLE_DESCRIPTIONS, ROLE_LABELS } from '../../lib/permissions';
import { ToastHost, btnPrimary, inputClass } from './ui';
import { DashboardScreen } from './DashboardScreen';
import { OrdersScreen } from './OrdersScreen';
import { ProductsScreen } from './ProductsScreen';
import { CustomersScreen } from './CustomersScreen';
import { SignatureScreen } from './SignatureScreen';
import { CouponsScreen } from './CouponsScreen';
import { BannersScreen } from './BannersScreen';
import { SettingsScreen } from './SettingsScreen';
import { StaffScreen } from './StaffScreen';

type ScreenId =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'customers'
  | 'coupons'
  | 'signature'
  | 'banners'
  | 'settings'
  | 'staff';

interface ScreenDef {
  id: ScreenId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: Permission;
  render: () => React.ReactNode;
}

const SCREENS: ScreenDef[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'orders.view', render: () => <DashboardScreen /> },
  { id: 'orders', label: 'Orders', icon: ShoppingBag, permission: 'orders.view', render: () => <OrdersScreen /> },
  { id: 'products', label: 'Products & Inventory', icon: Package, permission: 'products.view', render: () => <ProductsScreen /> },
  { id: 'customers', label: 'Customers', icon: Users, permission: 'customers.view', render: () => <CustomersScreen /> },
  { id: 'signature', label: 'Signature Collection', icon: Sparkles, permission: 'products.edit', render: () => <SignatureScreen /> },
  { id: 'coupons', label: 'Coupons', icon: Tag, permission: 'marketing.manage', render: () => <CouponsScreen /> },
  { id: 'banners', label: 'Images & Banners', icon: ImageIcon, permission: 'marketing.manage', render: () => <BannersScreen /> },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, permission: 'settings.manage', render: () => <SettingsScreen /> },
  { id: 'staff', label: 'Staff', icon: UserCog, permission: 'staff.manage', render: () => <StaffScreen /> },
];

/* ------------------------------------------------------------- login -- */

const AdminLogin: React.FC = () => {
  const { loginAsStaff, staff, storeSettings } = useStore();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = loginAsStaff(email);
    if (!res.success) setError(res.message);
  };

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12 sm:py-20">
      <div className="space-y-6 rounded-3xl border border-[#E8DFD8] bg-white p-6 shadow-lg sm:p-9">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#241510] text-[#E5A93C]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#241510]">Ovenglow Staff Sign In</h2>
          <p className="text-xs text-[#8C766B]">
            {storeSettings.storeName} · {storeSettings.city}
          </p>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900">
          <AlertCircle className="mt-px h-4 w-4 shrink-0" />
          <p>
            <b>This is not real authentication.</b> There is no server yet, so any email in the staff
            list signs in without a password and roles only hide buttons. Do not put live customer
            data in here until the backend is built.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[#5C4033]">Registered staff email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="you@ovenglow.in"
              className={inputClass}
            />
          </label>

          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          )}

          <button type="submit" className={`${btnPrimary} w-full py-2.5`}>
            Sign in
          </button>
        </form>

        <div className="border-t border-[#E8DFD8] pt-4">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[#8C766B]">
            Registered accounts
          </p>
          <ul className="space-y-1.5">
            {staff.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setEmail(s.email)}
                  className="inline-flex min-h-9 items-center truncate font-mono text-[#5C4033] underline decoration-[#E8DFD8] underline-offset-2 hover:text-[#241510]"
                >
                  {s.email}
                </button>
                <span className={`shrink-0 ${s.isActive ? 'text-[#8C766B]' : 'text-rose-600'}`}>
                  {ROLE_LABELS[s.role]}
                  {!s.isActive && ' · inactive'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------- shell -- */

export const AdminApp: React.FC = () => {
  const { currentStaff, logoutStaff, hasPermission, orders, storageWarning } = useStore();
  const storageUsed = localStorageBytesUsed();
  const storagePct = Math.min(100, Math.round((storageUsed / STORAGE_BUDGET_BYTES) * 100));
  const [screen, setScreen] = useState<ScreenId>('dashboard');

  if (!currentStaff) {
    return (
      <ToastHost>
        <AdminLogin />
      </ToastHost>
    );
  }

  const visible = SCREENS.filter((s) => hasPermission(s.permission));
  const active = visible.find((s) => s.id === screen) ?? visible[0];

  const needsAttention = orders.filter(
    (o) => o.stage === 'inquiry_received' || o.stage === 'payment_verification_pending',
  ).length;

  return (
    <ToastHost>
      <div className="mx-auto w-full max-w-[100rem] px-3 py-4 sm:px-5 sm:py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E8DFD8] bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#241510] text-[#E5A93C]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#241510]">{currentStaff.name}</p>
              <p className="font-mono text-[11px] text-[#8C766B]">
                {currentStaff.email} · {ROLE_LABELS[currentStaff.role]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {needsAttention > 0 && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-900">
                {needsAttention} need{needsAttention === 1 ? 's' : ''} attention
              </span>
            )}
            <button
              type="button"
              onClick={logoutStaff}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#E8DFD8] px-3 text-xs font-medium text-[#5C4033] transition-colors hover:border-[#8C766B] hover:text-[#241510]"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>

        {storageWarning && (
          <p className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] text-rose-800">
            <AlertCircle className="mt-px h-4 w-4 shrink-0" />
            <span>{storageWarning}</span>
          </p>
        )}

        {storagePct >= 70 && !storageWarning && (
          <p className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-900">
            <HardDrive className="mt-px h-4 w-4 shrink-0" />
            <span>
              Browser storage is {storagePct}% full ({formatBytes(storageUsed)} of{' '}
              {formatBytes(STORAGE_BUDGET_BYTES)}). Uploaded photos are stored inline here. Prefer
              image URLs for the rest, or edits will stop saving.
            </span>
          </p>
        )}

        <div className="grid min-w-0 gap-4 lg:grid-cols-[13rem_1fr]">
          <nav aria-label="Admin sections" className="min-w-0 lg:sticky lg:top-4 lg:self-start">
            <ul className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
              {visible.map((s) => {
                const Icon = s.icon;
                const isActive = active?.id === s.id;
                return (
                  <li key={s.id} className="shrink-0 lg:shrink">
                    <button
                      type="button"
                      onClick={() => setScreen(s.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex min-h-10 w-full items-center gap-2 whitespace-nowrap rounded-xl px-3 text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[#241510] text-white'
                          : 'border border-[#E8DFD8] bg-white text-[#5C4033] hover:border-[#8C766B] hover:text-[#241510] lg:border-transparent lg:bg-transparent'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-[#E5A93C]' : 'text-[#8C766B]'}`} />
                      <span>{s.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <p className="mt-3 hidden rounded-xl border border-[#E8DFD8] bg-white p-3 text-[11px] leading-relaxed text-[#8C766B] lg:block">
              <BarChart3 className="mb-1 h-3.5 w-3.5 text-[#C58940]" />
              <br />
              {ROLE_DESCRIPTIONS[currentStaff.role]}
            </p>
          </nav>

          <main className="min-w-0">{active?.render()}</main>
        </div>
      </div>
    </ToastHost>
  );
};
