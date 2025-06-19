// src/hooks/use-toast.ts
"use client"

import { toast as sonnerToast } from "sonner"

// Re-export sonner's toast functions.
// You can directly import these from 'sonner' in your components,
// or import them from this file if you prefer a centralized point.

type ToastOptions = {
  description?: React.ReactNode;
  action?: {
    label: string;
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  };
  cancel?: {
    label: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  };
  duration?: number;
  // Add other sonner options as needed
};

type ToastFunction = (message: React.ReactNode, options?: ToastOptions) => string | number;

interface SonnerToast extends ToastFunction {
  success: ToastFunction;
  info: ToastFunction;
  warning: ToastFunction;
  error: ToastFunction;
  loading: ToastFunction;
  promise: <T>(promise: Promise<T>, options: {
    loading: React.ReactNode;
    success: React.ReactNode | ((data: T) => React.ReactNode);
    error: React.ReactNode | ((error: any) => React.ReactNode);
  }) => string | number;
  custom: (component: (toastId: string | number) => React.ReactNode, options?: ToastOptions) => string | number;
  dismiss: (toastId?: string | number) => void;
}

const toast: SonnerToast = sonnerToast;

export { toast };
