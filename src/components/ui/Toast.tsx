'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} />,
  error: <AlertCircle size={18} />,
  info: <Info size={18} />,
  warning: <AlertTriangle size={18} />,
};

const typeStyles: Record<ToastType, { bg: string; border: string; icon: string; bar: string }> = {
  success: {
    bg: 'rgba(58, 170, 96, 0.12)',
    border: 'rgba(58, 170, 96, 0.3)',
    icon: '#3aaa60',
    bar: '#3aaa60',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: '#ef4444',
    bar: '#ef4444',
  },
  info: {
    bg: 'rgba(36, 173, 157, 0.12)',
    border: 'rgba(36, 173, 157, 0.3)',
    icon: '#24ad9d',
    bar: '#24ad9d',
  },
  warning: {
    bg: 'rgba(212, 153, 26, 0.12)',
    border: 'rgba(212, 153, 26, 0.3)',
    icon: '#d4991a',
    bar: '#d4991a',
  },
};

const DEFAULT_DURATION = 4000;

function ToastItem({ toast: t, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const duration = t.duration ?? DEFAULT_DURATION;
  const style = typeStyles[t.type];
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(() => onRemove(t.id), duration);
    return () => clearTimeout(timerRef.current);
  }, [t.id, duration, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="relative flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg overflow-hidden min-w-[18rem] max-w-[24rem]"
      style={{
        background: style.bg,
        borderColor: style.border,
        backdropFilter: 'blur(12px)',
      }}
    >
      <span style={{ color: style.icon }} className="mt-0.5 shrink-0">
        {icons[t.type]}
      </span>
      <p className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        {t.message}
      </p>
      <button
        onClick={() => onRemove(t.id)}
        className="shrink-0 mt-0.5 rounded p-0.5 transition-colors hover:bg-white/10 cursor-pointer"
        style={{ color: 'var(--text-muted)' }}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        className="absolute bottom-0 left-0 h-0.5 w-full origin-left"
        style={{ background: style.bar }}
      />
    </motion.div>
  );
}

let idCounter = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = `toast-${++idCounter}`;
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col-reverse gap-3">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
