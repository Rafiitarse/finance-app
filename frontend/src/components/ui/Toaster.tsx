'use client';

import { useToast } from '@/hooks/useToast';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  const getIcon = (type: 'success' | 'error' | 'info') => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'error':
        return AlertCircle;
      case 'info':
        return Info;
      default:
        return Info;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = getIcon(toast.type);
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 p-4 rounded-lg shadow-lg min-w-[300px] max-w-md animate-slide-in',
              toast.type === 'success' && 'bg-green-50 text-green-900 border border-green-200',
              toast.type === 'error' && 'bg-red-50 text-red-900 border border-red-200',
              toast.type === 'info' && 'bg-blue-50 text-blue-900 border border-blue-200'
            )}
            role="alert"
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              {toast.title && (
                <p className="font-medium">{toast.title}</p>
              )}
              {toast.message && (
                <p className="text-sm opacity-90 mt-0.5">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-current opacity-50 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
