/**
 * Toast Utility Functions
 * 
 * Provides consistent toast notifications with proper typing and multilingual support.
 * Uses Sonner toast library with custom styling for different toast types.
 */

import { toast as sonnerToast } from "sonner";

export interface ToastOptions {
  /** Duration in milliseconds (default: success=4000, error=5000, warning=4000, info=3000) */
  duration?: number;
  /** Position of the toast (default: "top-right") */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";
  /** Custom action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Whether the toast can be dismissed by clicking */
  dismissible?: boolean;
  /** Custom ID for the toast */
  id?: string;
}

/**
 * Display a success toast notification
 * @param message - The message to display
 * @param options - Additional toast options
 */
export const toastSuccess = (message: string, options: ToastOptions = {}) => {
  return sonnerToast.success(message, {
    duration: options.duration ?? 4000,
    position: options.position ?? "top-right",
    action: options.action,
    dismissible: options.dismissible ?? true,
    id: options.id,
  });
};

/**
 * Display an error/danger toast notification
 * @param message - The message to display
 * @param options - Additional toast options
 */
export const toastError = (message: string, options: ToastOptions = {}) => {
  return sonnerToast.error(message, {
    duration: options.duration ?? 5000,
    position: options.position ?? "top-right",
    action: options.action,
    dismissible: options.dismissible ?? true,
    id: options.id,
  });
};

/**
 * Display a warning toast notification
 * @param message - The message to display
 * @param options - Additional toast options
 */
export const toastWarning = (message: string, options: ToastOptions = {}) => {
  return sonnerToast.warning(message, {
    duration: options.duration ?? 4000,
    position: options.position ?? "top-right",
    action: options.action,
    dismissible: options.dismissible ?? true,
    id: options.id,
  });
};

/**
 * Display an info toast notification
 * @param message - The message to display
 * @param options - Additional toast options
 */
export const toastInfo = (message: string, options: ToastOptions = {}) => {
  return sonnerToast.info(message, {
    duration: options.duration ?? 3000,
    position: options.position ?? "top-right",
    action: options.action,
    dismissible: options.dismissible ?? true,
    id: options.id,
  });
};

/**
 * Display a default toast notification
 * @param message - The message to display
 * @param options - Additional toast options
 */
export const toastDefault = (message: string, options: ToastOptions = {}) => {
  return sonnerToast(message, {
    duration: options.duration ?? 3000,
    position: options.position ?? "top-right",
    action: options.action,
    dismissible: options.dismissible ?? true,
    id: options.id,
  });
};

/**
 * Display a custom toast notification with promise handling
 * Useful for async operations
 * @param promise - Promise to track
 * @param messages - Messages for different states
 * @param options - Additional toast options
 */
export const toastPromise = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  },
  options: ToastOptions = {}
) => {
  return sonnerToast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
    duration: options.duration,
    position: options.position ?? "top-right",
    action: options.action,
    dismissible: options.dismissible ?? true,
    id: options.id,
  });
};

/**
 * Dismiss a specific toast by ID
 * @param id - The ID of the toast to dismiss
 */
export const dismissToast = (id: string | number) => {
  sonnerToast.dismiss(id);
};

/**
 * Dismiss all active toasts
 */
export const dismissAllToasts = () => {
  sonnerToast.dismiss();
};

// Re-export the original toast for backward compatibility
export { sonnerToast as toast };