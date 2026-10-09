'use client';

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message?: string;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: uuidv4() }],
    })),
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

// Helper functions
export function toastSuccess(message: string, title?: string) {
  useToast.getState().addToast({ type: 'success', title, message });
}

export function toastError(message: string, title?: string) {
  useToast.getState().addToast({ type: 'error', title, message });
}

export function toastInfo(message: string, title?: string) {
  useToast.getState().addToast({ type: 'info', title, message });
}
