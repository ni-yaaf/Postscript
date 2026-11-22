import React from 'react';
import type { AppRoute } from '../hooks/useRouter';

interface ReadingRoomLayoutProps {
  showBackToCollection: boolean;
  isAuthorPreview?: boolean;
  onNavigate: (route: AppRoute) => void;
  children: React.ReactNode;
}

export const ReadingRoomLayout: React.FC<ReadingRoomLayoutProps> = ({
  showBackToCollection,
  isAuthorPreview = false,
  onNavigate,
  children,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--ps-bg)] text-[var(--ps-text)]">
      {isAuthorPreview && (
        <div className="border-b border-[var(--ps-border)] bg-[var(--ps-bg-secondary)] px-4 py-2.5 text-xs text-[var(--ps-text-secondary)]">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
            <span>Reading Room Preview — how your letters appear when shared.</span>
            <button
              type="button"
              onClick={() => onNavigate({ name: 'desk-home' })}
              className="font-medium text-[var(--ps-accent)] hover:underline whitespace-nowrap shrink-0"
            >
              Return to Writing Desk
            </button>
          </div>
        </div>
      )}

      {/* Quiet, Intimate Reading Room Header */}
      <header className="border-b border-[var(--ps-border-subtle)] bg-[var(--ps-bg)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={() => onNavigate({ name: 'reading-room' })}
            className="font-serif-editorial text-2xl font-semibold tracking-wide text-[var(--ps-text)] transition-colors hover:text-[var(--ps-accent)] focus-visible:outline-2 focus-visible:outline-[var(--ps-accent)] whitespace-nowrap shrink-0"
          >
            Postscript
          </button>

          {showBackToCollection && (
            <button
              type="button"
              onClick={() => onNavigate({ name: 'reading-room' })}
              className="text-sm text-[var(--ps-text-secondary)] transition-colors hover:text-[var(--ps-accent)] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[var(--ps-accent)]"
            >
              All letters
            </button>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[var(--ps-border-subtle)] py-8">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-5 text-xs text-[var(--ps-text-muted)] sm:px-8">
          <span className="font-serif-editorial italic text-sm text-[var(--ps-text-secondary)]">
            Postscript · A place for words.
          </span>
          {!isAuthorPreview && (
            <button
              type="button"
              onClick={() => onNavigate({ name: 'desk-home' })}
              className="text-[var(--ps-text-muted)] transition-colors hover:text-[var(--ps-text-secondary)]"
            >
              Writing Desk
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
