import { toast as reactToast, type ToastOptions, type Id } from 'react-toastify';

interface CustomToastOptions extends ToastOptions {
  preventDuplicate?: boolean;
  key?: string;
}

// Track active toasts to prevent duplicates
const activeToasts = new Map<string, Id>();

const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  style: {
    background: '#ffffff',
    color: '#000000',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    fontWeight: '500',
    padding: '16px',
    minHeight: '64px',
  },
};

const createToast = (
  type: 'success' | 'error' | 'info' | 'warning',
  message: string,
  options?: CustomToastOptions
): Id | undefined => {
  const { preventDuplicate = true, key, ...toastOptions } = options || {};

  // Generate unique key if not provided
  const toastKey = key || `${type}-${message}`;

  // Check if duplicate toast is already active
  if (preventDuplicate && activeToasts.has(toastKey)) {
    return activeToasts.get(toastKey);
  }

  // Dismiss existing toast with same key
  if (activeToasts.has(toastKey)) {
    const existingId = activeToasts.get(toastKey);
    if (existingId) {
      reactToast.dismiss(existingId);
    }
  }

  // Custom styles based on type
  const typeStyles = {
    success: {
      borderLeft: '4px solid #10b981',
      background: '#f0fdf4',
    },
    error: {
      borderLeft: '4px solid #ef4444',
      background: '#fef2f2',
    },
    info: {
      borderLeft: '4px solid #e91e63',
      background: '#fce4ec',
    },
    warning: {
      borderLeft: '4px solid #f59e0b',
      background: '#fffbeb',
    },
  };

  const toastId = reactToast[type](message, {
    ...defaultOptions,
    ...toastOptions,
    style: {
      ...defaultOptions.style,
      ...typeStyles[type],
      ...toastOptions.style,
    },
    onClose: () => {
      activeToasts.delete(toastKey);
      toastOptions.onClose?.();
    },
  });

  // Track active toast
  activeToasts.set(toastKey, toastId);

  return toastId;
};

export const toast = {
  success: (message: string, options?: CustomToastOptions): Id | undefined =>
    createToast('success', message, options),
  
  error: (message: string, options?: CustomToastOptions): Id | undefined =>
    createToast('error', message, options),
  
  info: (message: string, options?: CustomToastOptions): Id | undefined =>
    createToast('info', message, options),
  
  warning: (message: string, options?: CustomToastOptions): Id | undefined =>
    createToast('warning', message, options),
  
  dismiss: (toastId?: Id) => {
    if (toastId) {
      reactToast.dismiss(toastId);
    } else {
      reactToast.dismiss();
      activeToasts.clear();
    }
  },
  
  dismissAll: () => {
    reactToast.dismiss();
    activeToasts.clear();
  },
};
