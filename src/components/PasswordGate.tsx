import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { BotanicalSprig, NotebookDivider, WaxSealMark } from './Ornament';
import { verifyAppPasscode } from '../utils/passcode';

interface PasswordGateProps {
  onUnlock: () => void;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || checking) return;
    setChecking(true);
    setError(null);
    try {
      const ok = await verifyAppPasscode(password);
      if (ok) {
        onUnlock();
      } else {
        setError('That password is incorrect. Please try again.');
      }
    } catch {
      setError('Could not verify password right now.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--ps-bg)] px-4 py-12 text-[var(--ps-text)]">
      <main className="w-full max-w-md">
        <div className="envelope-card animate-letter-unfold relative overflow-hidden rounded-xl px-7 py-10 sm:px-10 sm:py-12">
          {/* Subtle top envelope flap fold */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-16 border-b border-[var(--ps-sheet-border)]/70 opacity-60"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              backgroundColor: 'rgba(130, 100, 68, 0.045)',
            }}
            aria-hidden="true"
          />

          <div className="relative text-center">
            <div className="mx-auto mb-3 flex items-center justify-center gap-2 text-[var(--ps-olive)]">
              <BotanicalSprig className="h-9 w-9 opacity-80" />
            </div>

            <p className="font-handwritten text-2xl text-[var(--ps-sheet-accent)]">
              A quiet place for words
            </p>
            <h1 className="mt-1 font-serif-editorial text-4xl font-medium tracking-tight text-[var(--ps-sheet-ink)]">
              Postscript
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-[var(--ps-sheet-muted)]">
              Enter the password to open these pages.
            </p>
          </div>

          <NotebookDivider variant="botanical" onPaper className="my-7" />

          <form onSubmit={handleSubmit} className="relative space-y-4">
            <div>
              <label
                htmlFor="postscript-passcode"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--ps-sheet-ink-2)]"
              >
                <Lock className="h-3.5 w-3.5 text-[var(--ps-sheet-muted)]" />
                <span>Password</span>
              </label>

              <div className="relative">
                <input
                  id="postscript-passcode"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter password…"
                  autoFocus
                  autoComplete="off"
                  className="w-full rounded-lg border border-[var(--ps-sheet-border)] bg-[var(--ps-sheet-slip)]/75 py-2.5 pl-3.5 pr-10 text-sm text-[var(--ps-sheet-ink)] placeholder:text-[var(--ps-sheet-muted)] focus:border-[var(--ps-sheet-accent)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--ps-sheet-muted)] transition-colors hover:text-[var(--ps-sheet-ink)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-[var(--ps-danger)]/35 bg-[var(--ps-danger)]/10 px-3 py-2 text-xs text-[var(--ps-danger)]"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!password || checking}
              className="group inline-flex min-h-[46px] w-full items-center justify-center gap-2.5 rounded-lg border border-[var(--ps-seal)]/50 bg-[var(--ps-seal)] px-5 py-2.5 text-sm font-medium text-[#FAF4E9] transition-all hover:opacity-95 disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ps-seal)]"
            >
              <WaxSealMark className="h-5 w-5" />
              <span>{checking ? 'Opening…' : 'Open Postscript'}</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
