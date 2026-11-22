import React from 'react';
import { Check, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  tone?: 'neutral' | 'success' | 'error';
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-50 flex max-w-sm flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 rounded-lg border border-[var(--ps-border)] bg-[var(--ps-surface)] px-4 py-3 text-sm text-[var(--ps-text)] shadow-xl"
        >
          {toast.tone === 'success' && (
            <Check className="h-4 w-4 shrink-0 text-[var(--ps-accent)]" />
          )}
          {toast.tone === 'error' && (
            <AlertCircle className="h-4 w-4 shrink-0 text-[var(--ps-danger)]" />
          )}
          <span className="flex-1 leading-snug">{toast.text}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="rounded p-1 text-[var(--ps-text-muted)] hover:text-[var(--ps-text)]"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
