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
  /** Custom action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Custom ID for the toast */
  id?: string;
}

/**
 * Display a success toast notification
 * @param message - The message to display
 * @param options - Additional toast options
 */
export const toastSuccess = (message: string, options: ToastOptions = {}) => {
  // Generate unique ID for debugging if not provided
  const toastId = options.id ?? `success-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  
  // Log for debugging
  console.log("🍞 toastSuccess called:", {
    message,
    toastId,
    timestamp: new Date().toISOString(),
    options
  });
  
  const result = sonnerToast.success(message, {
    duration: options.duration ?? 4000,
    action: options.action,
    id: toastId,
  });
  
  console.log("🍞 toastSuccess result:", result);
  return result;
};

/**
 * Display an error/danger toast notification
 * @param message - The message to display
 * @param options - Additional toast options
 */
export const toastError = (message: string, options: ToastOptions = {}) => {
  // Generate unique ID for debugging if not provided
  const toastId = options.id ?? `error-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  
  // Log for debugging
  console.log("🍞 toastError called:", {
    message,
    toastId,
    timestamp: new Date().toISOString(),
    options
  });
  
  const result = sonnerToast.error(message, {
    duration: options.duration ?? 7000, // Longer duration for errors
    action: options.action,
    id: toastId,
  });
  
  console.log("🍞 toastError result:", result);
  return result;
};

/**
 * Display a warning toast notification
 * @param message - The message to display
 * @param options - Additional toast options
 */
export const toastWarning = (message: string, options: ToastOptions = {}) => {
  // Generate unique ID for debugging if not provided
  const toastId = options.id ?? `warning-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  
  // Log for debugging
  console.log("🍞 toastWarning called:", {
    message,
    toastId,
    timestamp: new Date().toISOString(),
    options
  });
  
  const result = sonnerToast.warning(message, {
    duration: options.duration ?? 5000, // Slightly longer for warnings
    action: options.action,
    id: toastId,
  });
  
  console.log("🍞 toastWarning result:", result);
  return result;
};

/**
 * Display an info toast notification
 * @param message - The message to display
 * @param options - Additional toast options
 */
export const toastInfo = (message: string, options: ToastOptions = {}) => {
  return sonnerToast.info(message, {
    duration: options.duration ?? 3000,
    action: options.action,
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
    action: options.action,
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
    action: options.action,
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