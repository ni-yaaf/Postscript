import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { AppRoute } from '../hooks/useRouter';

interface DeskLayoutProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  children: React.ReactNode;
}

export const DeskLayout: React.FC<DeskLayoutProps> = ({
  currentRoute,
  onNavigate,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{ label: string; route: AppRoute; match: string[] }> = [
    {
      label: 'Letters',
      route: { name: 'desk-home' },
      match: ['desk-home', 'desk-archive', 'desk-letter', 'desk-edit'],
    },
    {
      label: 'Reading Room',
      route: { name: 'desk-preview' },
      match: ['desk-preview'],
    },
    {
      label: 'Passages',
      route: { name: 'desk-passages' },
      match: ['desk-passages'],
    },
    {
      label: 'Settings',
      route: { name: 'desk-settings' },
      match: ['desk-settings'],
    },
  ];

  const handleNav = (route: AppRoute) => {
    setMobileMenuOpen(false);
    onNavigate(route);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ps-bg)] text-[var(--ps-text)]">
      {/* Three-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-[var(--ps-border-subtle)] bg-[var(--ps-bg)]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          {/* Zone 1: Single-line Wordmark */}
          <button
            type="button"
            onClick={() => handleNav({ name: 'desk-home' })}
            className="font-serif-editorial text-2xl font-semibold tracking-wide text-[var(--ps-text)] transition-colors hover:text-[var(--ps-accent)] focus-visible:outline-2 focus-visible:outline-[var(--ps-accent)] whitespace-nowrap shrink-0"
          >
            Postscript
          </button>

          {/* Zone 2: Minimal Navigation */}
          <nav
            className="hidden md:flex items-center gap-7"
            aria-label="Writing Desk Navigation"
          >
            {navItems.map((item) => {
              const active = item.match.includes(currentRoute.name);
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNav(item.route)}
                  className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[var(--ps-accent)] ${
                    active
                      ? 'text-[var(--ps-text)]'
                      : 'text-[var(--ps-text-secondary)] hover:text-[var(--ps-text)]'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span
                      className="absolute inset-x-0 -bottom-[15px] h-[1.5px] bg-[var(--ps-accent)]"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleNav({ name: 'desk-new' })}
              className="min-h-[40px] rounded-lg bg-[var(--ps-accent)] px-4 py-2 text-sm font-medium text-[#14110F] transition-colors hover:bg-[var(--ps-accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ps-accent)] whitespace-nowrap shrink-0"
            >
              Write a Letter
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="flex md:hidden h-10 w-10 items-center justify-center rounded-lg border border-[var(--ps-border)] text-[var(--ps-text-secondary)] hover:text-[var(--ps-text)] focus-visible:outline-2 focus-visible:outline-[var(--ps-accent)]"
              aria-label={
                mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
              }
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav
            className="border-t border-[var(--ps-border)] bg-[var(--ps-bg-secondary)] px-4 py-3 md:hidden"
            aria-label="Mobile Writing Desk Navigation"
          >
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = item.match.includes(currentRoute.name);
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleNav(item.route)}
                    className={`min-h-[44px] rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[var(--ps-surface)] text-[var(--ps-accent)]'
                        : 'text-[var(--ps-text-secondary)] hover:bg-[var(--ps-surface)] hover:text-[var(--ps-text)]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[var(--ps-border-subtle)] py-6 text-xs text-[var(--ps-text-muted)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
          <span className="font-serif-editorial italic text-sm text-[var(--ps-text-secondary)]">
            Postscript · Some words deserve more than a comment.
          </span>
          <span>Saved privately in this browser until published.</span>
        </div>
      </footer>
    </div>
  );
};
