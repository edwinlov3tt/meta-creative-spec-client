import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  createdAt: number;
}

interface ToastStore {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  clear: () => void;
}

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
};

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  showToast: (message, type = 'info', duration = 3000) => {
    const id = generateId();
    const toast: Toast = {
      id,
      message,
      type,
      duration,
      createdAt: Date.now()
    };

    set(state => ({ toasts: [...state.toasts, toast] }));

    window.setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },
  removeToast: (id) =>
    set(state => ({ toasts: state.toasts.filter(toast => toast.id !== id) })),
  clear: () => set({ toasts: [] })
}));

export const showToast = (message: string, type?: ToastType, duration?: number) => {
  useToastStore.getState().showToast(message, type, duration);
};
