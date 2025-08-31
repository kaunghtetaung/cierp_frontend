"use client";

import { useState, useCallback } from "react";

interface DialogState<T = any> {
  isOpen: boolean;
  data?: T;
  loading?: boolean;
}

interface UseDialogOptions<T = any> {
  defaultOpen?: boolean;
  defaultData?: T;
  onOpen?: (data?: T) => void;
  onClose?: () => void;
  onConfirm?: (data?: T) => Promise<void> | void;
}

export function useDialog<T = any>(options: UseDialogOptions<T> = {}) {
  const [state, setState] = useState<DialogState<T>>({
    isOpen: options.defaultOpen || false,
    data: options.defaultData,
    loading: false,
  });

  const open = useCallback((data?: T) => {
    setState({
      isOpen: true,
      data,
      loading: false,
    });
    options.onOpen?.(data);
  }, [options]);

  const close = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
      loading: false,
    }));
    options.onClose?.();
  }, [options]);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({
      ...prev,
      loading,
    }));
  }, []);

  const confirm = useCallback(async () => {
    if (options.onConfirm) {
      setLoading(true);
      try {
        await options.onConfirm(state.data);
        close();
      } catch (error) {
        console.error("Dialog confirm error:", error);
        // Keep dialog open on error
      } finally {
        setLoading(false);
      }
    } else {
      close();
    }
  }, [state.data, options, close, setLoading]);

  const updateData = useCallback((data: T | ((prev?: T) => T)) => {
    setState((prev) => ({
      ...prev,
      data: typeof data === "function" ? (data as Function)(prev.data) : data,
    }));
  }, []);

  return {
    isOpen: state.isOpen,
    data: state.data,
    loading: state.loading,
    open,
    close,
    confirm,
    setLoading,
    updateData,
  };
}

// Confirmation dialog specific hook
interface UseConfirmationOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  onConfirm: () => Promise<void> | void;
}

export function useConfirmation(options: UseConfirmationOptions) {
  const dialog = useDialog({
    onConfirm: options.onConfirm,
  });

  const showConfirmation = useCallback(
    (overrides?: Partial<UseConfirmationOptions>) => {
      dialog.open({
        title: overrides?.title || options.title,
        description: overrides?.description || options.description,
        confirmText: overrides?.confirmText || options.confirmText,
        cancelText: overrides?.cancelText || options.cancelText,
        variant: overrides?.variant || options.variant,
      });
    },
    [dialog, options]
  );

  return {
    ...dialog,
    showConfirmation,
  };
}