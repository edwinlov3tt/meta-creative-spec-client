import React from 'react';
import { showToast, useToastStore } from '@/stores/toastStore';
import type { Toast } from '@/stores/toastStore';

const getToastClasses = (toast: Toast) => {
  switch (toast.type) {
    case 'success':
      return 'bg-success text-white border-success/70';
    case 'error':
      return 'bg-danger text-white border-danger/70';
    case 'warning':
      return 'bg-warning text-white border-warning/70';
    default:
      return 'bg-surface text-text-primary border-border';
  }
};

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore(state => state.toasts);
  const removeToast = useToastStore(state => state.removeToast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-6 right-6 z-[60] flex flex-col gap-3 w-72">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`border rounded-card shadow-card px-4 py-3 text-sm font-medium cursor-pointer transition-opacity duration-200 ${getToastClasses(toast)}`}
          onClick={() => removeToast(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export const useToast = () => ({ showToast });
