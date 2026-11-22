import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  secondaryAction,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="confirm-modal-title"
            className="font-serif-editorial text-2xl font-semibold text-[var(--ps-text)]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--ps-text-muted)] transition-colors hover:bg-[var(--ps-surface-elevated)] hover:text-[var(--ps-text)] focus-visible:outline-2 focus-visible:outline-[var(--ps-accent)]"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-[var(--ps-text-secondary)]">
          {description}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[40px] rounded-lg border border-[var(--ps-border)] px-4 py-2 text-sm font-medium text-[var(--ps-text-secondary)] transition-colors hover:bg-[var(--ps-surface-elevated)] hover:text-[var(--ps-text)] focus-visible:outline-2 focus-visible:outline-[var(--ps-accent)] whitespace-nowrap shrink-0"
          >
            {cancelLabel}
          </button>
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="min-h-[40px] rounded-lg border border-[var(--ps-border)] bg-[var(--ps-bg-secondary)] px-4 py-2 text-sm font-medium text-[var(--ps-text)] transition-colors hover:bg-[var(--ps-surface-elevated)] focus-visible:outline-2 focus-visible:outline-[var(--ps-accent)] whitespace-nowrap shrink-0"
            >
              {secondaryAction.label}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-[40px] rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--ps-accent)] whitespace-nowrap shrink-0 ${
              destructive
                ? 'bg-[var(--ps-danger)] text-white hover:opacity-90'
                : 'bg-[var(--ps-accent)] text-[#14110F] hover:bg-[var(--ps-accent-hover)]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
