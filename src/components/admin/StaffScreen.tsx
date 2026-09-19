import React, { useState } from 'react';
import { Lock, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  StaffRole,
  isPermanentSuperAdmin,
  permissionsFor,
} from '../../lib/permissions';
import { Field, btnPrimary, inputClass, useToast } from './ui';

const ROLES: StaffRole[] = ['super_admin', 'admin', 'order_manager'];

const MATRIX_ROWS: { label: string; check: (r: StaffRole) => boolean }[] = [
  { label: 'Orders', check: (r) => permissionsFor(r).includes('orders.advance') },
  { label: 'Verify payments', check: (r) => permissionsFor(r).includes('orders.verify_payment') },
  { label: 'Products', check: (r) => permissionsFor(r).includes('products.edit') },
  { label: 'Customers', check: (r) => permissionsFor(r).includes('customers.view') },
  { label: 'Marketing', check: (r) => permissionsFor(r).includes('marketing.manage') },
  { label: 'Settings', check: (r) => permissionsFor(r).includes('settings.manage') },
];

export const StaffScreen: React.FC = () => {
  const { staff, addStaff, updateStaff, removeStaff } = useStore();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('order_manager');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await addStaff(name, email, role, password);
    setBusy(false);
    toast(res.success ? 'success' : 'error', res.message);
    if (res.success) {
      setName('');
      setEmail('');
      setPassword('');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-xl font-bold text-[#241510]">Staff</h2>
        <p className="text-xs text-[#8C766B]">
          Three roles. Give people the narrowest one that lets them do their job.
        </p>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-[#E8DFD8] bg-[#FAF7F2] p-3 text-[11px] leading-relaxed text-[#5C4033]">
        <Lock className="mt-px h-4 w-4 shrink-0 text-emerald-700" />
        <p>
          Roles are <b>enforced by the database</b>, not just hidden in this screen. An Order
          Manager who found a way to click a Settings button would still be refused by Firestore,
          because the security rules read the same role you set here.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-[#E8DFD8] bg-white p-4">
        <h3 className="text-xs font-semibold text-[#241510]">Add a staff member</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Full name">
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Email">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Role">
            <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} className={inputClass}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Starting password"
            hint="At least 6 characters. Tell them what you set and ask them to change it."
          >
            <input
              required
              type="password"
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <p className="text-[11px] text-[#8C766B]">{ROLE_DESCRIPTIONS[role]}</p>
        <button type="submit" disabled={busy} className={`${btnPrimary} disabled:opacity-60`}>
          <UserPlus className="h-3.5 w-3.5" /> {busy ? 'Creating\u2026' : 'Add staff member'}
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-[#E8DFD8] bg-white">
        <table className="w-full min-w-[42rem] text-left text-xs">
          <thead>
            <tr className="border-b border-[#E8DFD8] bg-[#FAF7F2] text-[10px] uppercase tracking-wider text-[#8C766B]">
              <th className="px-3 py-2.5 font-medium">Name</th>
              <th className="px-3 py-2.5 font-medium">Email</th>
              <th className="px-3 py-2.5 font-medium">Role</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => {
              const permanent = isPermanentSuperAdmin(s.email);
              return (
                <tr key={s.id} className="border-b border-[#F0EAE3] last:border-0">
                  <td className="px-3 py-2.5">
                    <span className="font-medium text-[#241510]">{s.name}</span>
                    {permanent && (
                      <span className="mt-0.5 flex items-center gap-1 text-[10px] text-[#8C766B]">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" /> permanent owner
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-[#5C4033]">{s.email}</td>
                  <td className="px-3 py-2.5">
                    <select
                      value={s.role}
                      disabled={permanent}
                      onChange={async (e) => {
                        const res = await updateStaff(s.id, { role: e.target.value as StaffRole });
                        toast(res.success ? 'success' : 'error', res.message);
                      }}
                      aria-label={`Role for ${s.name}`}
                      className={`${inputClass} w-auto py-1 disabled:opacity-50`}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      disabled={permanent}
                      onClick={async () => {
                        const res = await updateStaff(s.id, { isActive: !s.isActive });
                        toast(res.success ? 'success' : 'error', res.message);
                      }}
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium disabled:opacity-50 ${
                        s.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-rose-200 bg-rose-50 text-rose-700'
                      }`}
                    >
                      {s.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      type="button"
                      disabled={permanent}
                      aria-label={`Remove ${s.name}`}
                      onClick={async () => {
                        if (!confirm(`Remove ${s.name}'s access?`)) return;
                        const res = await removeStaff(s.id);
                        toast(res.success ? 'success' : 'error', res.message);
                      }}
                      className="rounded-md p-1 text-[#8C766B] hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#E8DFD8] bg-white">
        <table className="w-full min-w-[34rem] text-left text-xs">
          <thead>
            <tr className="border-b border-[#E8DFD8] bg-[#FAF7F2] text-[10px] uppercase tracking-wider text-[#8C766B]">
              <th className="px-3 py-2.5 font-medium">Can</th>
              {ROLES.map((r) => (
                <th key={r} className="px-3 py-2.5 text-center font-medium">
                  {ROLE_LABELS[r]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-[#F0EAE3] last:border-0">
                <td className="px-3 py-2 font-medium text-[#241510]">{row.label}</td>
                {ROLES.map((r) => (
                  <td key={r} className="px-3 py-2 text-center">
                    {row.check(r) ? (
                      <span className="font-semibold text-emerald-700">Yes</span>
                    ) : (
                      <span className="text-[#8C766B]">No</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
