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

/** Google's mark, from their branding guidelines. Not drawn from memory. */
const GoogleG: React.FC = () => (
  <svg viewBox="0 0 48 48" className="h-4 w-4 shrink-0" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const AdminLogin: React.FC = () => {
  const { loginAsStaff, loginAsStaffWithGoogle, sendStaffPasswordReset, storeSettings } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const res = await loginAsStaff(email, password);
    setBusy(false);
    // On success the auth listener swaps this screen out; there is nothing to
    // do here but clear the password from memory.
    if (res.success) setPassword('');
    else setError(res.message);
  };

  const forgot = async () => {
    setBusy(true);
    const res = await sendStaffPasswordReset(email);
    setBusy(false);
    setError(res.success ? null : res.message);
    setNotice(res.success ? res.message : null);
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-20">
      <div className="space-y-6 rounded-3xl border border-[#E8DFD8] bg-white p-6 shadow-lg sm:p-9">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#241510] text-[#E5A93C]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#241510]">Staff sign in</h2>
          <p className="text-xs text-[#8C766B]">
            {storeSettings.storeName} · {storeSettings.city}
          </p>
        </div>

        {/*
          What used to be here: a banner admitting there was no authentication,
          and below it every staff email printed as a button that signed you in
          on one click. Both are gone -- Firebase checks the password now, and
          the account list is not something a sign-in screen should publish.
        */}
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[#5C4033]">Email</span>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="you@example.com"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[#5C4033]">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              className={inputClass}
            />
          </label>

          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              {notice}
            </p>
          )}

          <button type="submit" disabled={busy} className={`${btnPrimary} w-full py-2.5 disabled:opacity-60`}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="flex items-center gap-3 py-0.5">
            <span className="h-px flex-1 bg-[#E8DFD8]" />
            <span className="text-[10px] uppercase tracking-[0.12em] text-[#A69286]">or</span>
            <span className="h-px flex-1 bg-[#E8DFD8]" />
          </div>

          {/*
            Worth having beyond convenience: a Google account comes with its
            address already confirmed, and the owner addresses only get their
            Super Admin powers once the address is confirmed. Signing in this
            way skips the verification email entirely.
          */}
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              setNotice(null);
              const res = await loginAsStaffWithGoogle();
              setBusy(false);
              if (!res.success) setError(res.message);
            }}
            className="flex min-h-11 w-full items-center justify-center gap-2.5 rounded-full border border-[#E8DFD8] bg-white px-5 text-sm font-medium text-[#241510] transition-colors hover:border-[#8C766B] hover:bg-[#FAF7F2] disabled:opacity-60"
          >
            <GoogleG />
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={forgot}
            disabled={busy || !email.trim()}
            className="mx-auto block min-h-9 text-[11px] text-[#8C766B] underline decoration-[#E8DFD8] underline-offset-2 hover:text-[#241510] disabled:opacity-50"
          >
            Forgotten your password?
          </button>
        </form>
      </div>
    </div>
  );
};

/* ------------------------------------------------- email verification -- */

/**
 * The one hurdle between an owner and their own admin.
 *
 * The security rules grant the two owner addresses their powers only once the
 * address is verified, and an account created by hand in the Firebase console
 * starts unverified. Without this screen that arrives as "Missing or
 * insufficient permissions" on every action, with nothing to click.
 */
const VerifyEmail: React.FC = () => {
  const { resendVerification, recheckVerification, logoutStaff } = useStore();
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-20">
      <div className="space-y-5 rounded-3xl border border-[#E8DFD8] bg-white p-6 text-center shadow-lg sm:p-9">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="font-serif text-xl font-bold text-[#241510]">Confirm your email first</h2>
        <p className="text-xs leading-relaxed text-[#6B574E]">
          We have sent a link to your address. Click it, then come back and choose
          “I have clicked the link”. This is what proves the address is yours, and it is
          only needed once.
        </p>

        {notice && (
          <p className="rounded-lg border border-[#E8DFD8] bg-[#FAF7F2] px-3 py-2 text-xs text-[#5C4033]">
            {notice}
          </p>
        )}

        <div className="space-y-2">
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const ok = await recheckVerification();
              setBusy(false);
              setNotice(
                ok
                  ? 'Thank you — opening the console.'
                  : 'Not confirmed yet. Check your inbox, and your spam folder.',
              );
            }}
            className={`${btnPrimary} w-full py-2.5 disabled:opacity-60`}
          >
            I have clicked the link
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const res = await resendVerification();
              setBusy(false);
              setNotice(res.message);
            }}
            className="min-h-9 w-full text-[11px] text-[#8C766B] underline decoration-[#E8DFD8] underline-offset-2 hover:text-[#241510]"
          >
            Send the link again
          </button>

          <button
            type="button"
            onClick={() => void logoutStaff()}
            className="min-h-9 w-full text-[11px] text-[#8C766B] hover:text-[#241510]"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------- shell -- */

export const AdminApp: React.FC = () => {
  const { currentStaff, logoutStaff, hasPermission, orders, storageWarning, authReady, needsEmailVerification } =
    useStore();
  const storageUsed = localStorageBytesUsed();
  const storagePct = Math.min(100, Math.round((storageUsed / STORAGE_BUDGET_BYTES) * 100));
  const [screen, setScreen] = useState<ScreenId>('dashboard');

  // Firebase restores a session asynchronously. Rendering the login screen
  // before that settles makes a signed-in admin watch it flash past on every
  // page load, and invites them to type a password they did not need.
  if (!authReady) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-20 text-center text-xs text-[#8C766B]">
        Checking your sign-in…
      </div>
    );
  }

  if (needsEmailVerification && !currentStaff) {
    return (
      <ToastHost>
        <VerifyEmail />
      </ToastHost>
    );
  }

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
              onClick={() => void logoutStaff()}
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
