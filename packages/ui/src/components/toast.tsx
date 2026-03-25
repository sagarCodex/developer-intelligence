'use client';

import { createContext, useCallback, useContext, useState, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  title: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (opts: { title: string; variant?: ToastVariant }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((opts: { title: string; variant?: ToastVariant }) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, title: opts.title, variant: opts.variant ?? 'info' }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <Toaster toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

const variantConfig: Record<ToastVariant, { icon: typeof CheckCircle2; color: string; borderColor: string }> = {
  success: { icon: CheckCircle2, color: 'text-[#00E5C8]', borderColor: 'border-[#00E5C8]/30' },
  error: { icon: XCircle, color: 'text-red-400', borderColor: 'border-red-400/30' },
  info: { icon: Info, color: 'text-blue-400', borderColor: 'border-blue-400/30' },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    timerRef.current = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 200);
    }, 3000);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, onRemove]);

  const dismiss = () => {
    clearTimeout(timerRef.current);
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 200);
  };

  const { icon: Icon, color, borderColor } = variantConfig[toast.variant];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-md border bg-surface ${borderColor} shadow-lg backdrop-blur-sm transition-all duration-200 ease-out ${
        visible && !exiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
    >
      <Icon className={`h-4 w-4 flex-shrink-0 ${color}`} />
      <span className="font-mono text-sm text-text-primary flex-1">{toast.title}</span>
      <button onClick={dismiss} className="text-text-muted hover:text-text-primary flex-shrink-0">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

function Toaster({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}
