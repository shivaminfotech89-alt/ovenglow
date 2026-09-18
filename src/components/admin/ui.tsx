/**
 * Shared admin primitives: badges, inline editing, toasts, empty states.
 * Kept in one file because each piece is small and they are always used
 * together.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Info, Loader2, X } from 'lucide-react';
import { OrderStage, STAGES } from '../../lib/orderStages';

/* ------------------------------------------------------------- toasts -- */

interface Toast {
  id: number;
  tone: 'success' | 'error' | 'info';
  message: string;
}

const ToastContext = createContext<(tone: Toast['tone'], message: string) => void>(() => {});

export const useToast = () => useContext(ToastContext);

export const ToastHost: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const push = useCallback((tone: Toast['tone'], message: string) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, tone, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[80] flex flex-col gap-2 w-[min(22rem,calc(100vw-2rem))]"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs shadow-lg ${
              t.tone === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : t.tone === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-white border-[#E8DFD8] text-[#241510]'
            }`}
          >
            {t.tone === 'success' ? (
              <Check className="w-4 h-4 shrink-0 mt-px" />
            ) : t.tone === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
            ) : (
              <Info className="w-4 h-4 shrink-0 mt-px" />
            )}
            <span className="leading-snug">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/* -------------------------------------------------------- stage badge -- */

const TONE_CLASSES: Record<string, string> = {
  neutral: 'bg-[#F5EFE6] text-[#5C4033] border-[#E8DFD8]',
  waiting: 'bg-amber-50 text-amber-900 border-amber-200',
  money: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  kitchen: 'bg-orange-50 text-orange-900 border-orange-200',
  transit: 'bg-sky-50 text-sky-900 border-sky-200',
  done: 'bg-emerald-600 text-white border-emerald-700',
  stopped: 'bg-rose-50 text-rose-900 border-rose-200',
};

export const StageBadge: React.FC<{ stage: OrderStage; className?: string }> = ({
  stage,
  className = '',
}) => {
  const def = STAGES[stage];
  return (
    <span
      title={def.why}
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${TONE_CLASSES[def.tone]} ${className}`}
    >
      {def.label}
    </span>
  );
};

/* ------------------------------------------------------- inline edit -- */

interface InlineEditProps {
  value: number;
  /**
   * Returns an error message to refuse the edit, or null to accept it. The
   * field snaps back to the stored value on a refusal, so the screen never
   * shows a number that was not saved -- which now means waiting for the
   * database to answer rather than deciding locally.
   */
  onSave: (next: number) => Promise<string | null> | string | null;
  prefix?: string;
  suffix?: string;
  /** Group digits for display (Indian grouping). Editing always shows the raw number. */
  groupDigits?: boolean;
  disabled?: boolean;
  label: string;
  className?: string;
}

export const InlineEditNumber: React.FC<InlineEditProps> = ({
  value,
  onSave,
  prefix = '',
  suffix = '',
  groupDigits = false,
  disabled = false,
  label,
  className = '',
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  // If the stored value changes while not editing, follow it.
  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  const commit = async () => {
    const next = Number(draft);
    if (!Number.isFinite(next)) {
      setDraft(String(value));
      setError('Enter a number.');
      setEditing(false);
      return;
    }
    // Leave edit mode straight away: the value shown is already the one being
    // saved, and holding the field open until the server answers makes every
    // edit feel slow.
    setEditing(false);
    const refusal = await onSave(next);
    if (refusal) {
      setDraft(String(value)); // snap back
      setError(refusal);
    } else {
      setError(null);
    }
  };

  const cancel = () => {
    setDraft(String(value));
    setError(null);
    setEditing(false);
  };

  const shown = groupDigits ? value.toLocaleString('en-IN') : String(value);

  if (disabled) {
    return (
      <span className={`tabular-nums text-[#8C766B] ${className}`}>
        {prefix}
        {shown}
        {suffix}
      </span>
    );
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        aria-label={label}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void commit();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
          }
        }}
        className={`w-20 rounded-md border border-[#241510] bg-white px-1.5 py-0.5 text-xs tabular-nums text-[#241510] focus:outline-none ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title={error ?? `Click to edit ${label}`}
      className={`group inline-flex min-h-9 min-w-10 items-center justify-end rounded-md px-1.5 text-right tabular-nums transition-colors hover:bg-[#F5EFE6] ${
        error ? 'text-rose-700' : 'text-[#241510]'
      } ${className}`}
    >
      {prefix}
      {shown}
      {suffix}
      {error && <span className="ml-1 text-[10px] text-rose-600">!</span>}
    </button>
  );
};

/* ------------------------------------------------------------- misc -- */

export const StatCard: React.FC<{
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'warn' | 'good';
}> = ({ label, value, hint, tone = 'default' }) => (
  <div
    className={`rounded-xl border p-3.5 ${
      tone === 'warn'
        ? 'border-amber-200 bg-amber-50'
        : tone === 'good'
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-[#E8DFD8] bg-white'
    }`}
  >
    <div className="text-[10px] font-medium uppercase tracking-wider text-[#8C766B]">{label}</div>
    <div className="mt-1 font-serif text-xl font-bold tabular-nums text-[#241510]">{value}</div>
    {hint && <div className="mt-0.5 text-[11px] text-[#8C766B]">{hint}</div>}
  </div>
);

export const EmptyState: React.FC<{ title: string; hint?: string }> = ({ title, hint }) => (
  <div className="rounded-2xl border border-dashed border-[#E8DFD8] bg-white/60 p-10 text-center">
    <h4 className="font-serif text-base font-bold text-[#241510]">{title}</h4>
    {hint && <p className="mx-auto mt-1 max-w-md text-xs text-[#8C766B]">{hint}</p>}
  </div>
);

export const Field: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, hint, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="mb-1 block text-xs font-medium text-[#5C4033]">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-[11px] text-[#8C766B]">{hint}</span>}
  </label>
);

export const inputClass =
  'w-full min-h-10 rounded-lg border border-[#E8DFD8] bg-white px-3 py-2 text-xs text-[#241510] placeholder:text-[#A69286] focus:border-[#241510] focus:outline-none';

export const btnPrimary =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#241510] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#3D2317] disabled:cursor-not-allowed disabled:opacity-40';

export const btnGhost =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#E8DFD8] bg-white px-3 text-xs font-medium text-[#5C4033] transition-colors hover:border-[#8C766B] hover:text-[#241510] disabled:cursor-not-allowed disabled:opacity-40';

export const Spinner: React.FC = () => <Loader2 className="h-4 w-4 animate-spin" />;

/** A right-hand drawer used for order detail and record editing. */
export const Drawer: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ open, onClose, title, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex h-full w-screen max-w-lg flex-col border-l border-[#E8DFD8] bg-[#FAF7F2] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E8DFD8] bg-white px-4 py-3">
          <h3 className="font-serif text-base font-bold text-[#241510]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-full p-1.5 text-[#8C766B] transition-colors hover:bg-[#FAF7F2] hover:text-[#241510]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
};
