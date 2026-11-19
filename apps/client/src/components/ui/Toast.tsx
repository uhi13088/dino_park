import { forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useUIStore, type Toast as ToastType } from '@/stores';

const toastIcons = {
  success: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

const toastColors = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
};

interface ToastItemProps {
  toast: ToastType;
  onRemove: () => void;
}

const ToastItem = forwardRef<HTMLDivElement, ToastItemProps>(function ToastItem(
  { toast, onRemove },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={cn(
        'flex min-w-[280px] max-w-[400px] items-center gap-3 rounded-xl px-4 py-3 text-white shadow-lg',
        toastColors[toast.type],
      )}
    >
      <span className="flex-shrink-0">{toastIcons[toast.type]}</span>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        aria-label="알림 닫기"
        onClick={onRemove}
        className="flex-shrink-0 rounded-full p-1 transition-colors hover:bg-white/20"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </motion.div>
  );
});

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

// 편의 함수들
export const toast = {
  success: (message: string, duration?: number) =>
    useUIStore.getState().showToast({ type: 'success', message, duration }),
  error: (message: string, duration?: number) =>
    useUIStore.getState().showToast({ type: 'error', message, duration }),
  warning: (message: string, duration?: number) =>
    useUIStore.getState().showToast({ type: 'warning', message, duration }),
  info: (message: string, duration?: number) =>
    useUIStore.getState().showToast({ type: 'info', message, duration }),
};
