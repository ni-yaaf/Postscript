import React, { useState } from 'react';
import type { AppRoute } from '../hooks/useRouter';
import type { Letter, PublicLetter } from '../types/letter';
import {
  BotanicalSprig,
  NotebookDivider,
  PostmarkStamp,
} from '../components/Ornament';
import { letterToPublicLetter } from '../utils/publishing';
import { formatReadableDate } from '../utils/text';

interface ReadingRoomIndexPageProps {
  publicLetters: PublicLetter[];
  localLetters: Letter[];
  isAuthorPreview: boolean;
  recipientLabel?: string;
  onNavigate: (route: AppRoute) => void;
}

export const ReadingRoomIndexPage: React.FC<ReadingRoomIndexPageProps> = ({
  publicLetters,
  localLetters,
  isAuthorPreview,
  recipientLabel = 'Neonate',
  onNavigate,
}) => {
  const [previewScope, setPreviewScope] = useState<'live' | 'staged'>(
    isAuthorPreview && publicLetters.length === 0 ? 'staged' : 'live'
  );

  const displayedLetters: PublicLetter[] =
    isAuthorPreview && previewScope === 'staged'
      ? localLetters
          .filter((l) => l.status !== 'unpublished')
          .map(letterToPublicLetter)
          .sort(
            (a, b) =>
              new Date(b.publishedAt).getTime() -
              new Date(a.publishedAt).getTime()
          )
      : publicLetters;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <header className="text-center">
        <p className="font-handwritten text-2xl text-[var(--ps-accent)]">
          For {recipientLabel},
        </p>
        <h1 className="mt-1 font-serif-editorial text-4xl font-medium tracking-tight text-[var(--ps-text)] sm:text-5xl [text-wrap:balance]">
          A place for words.
        </h1>
        <p className="mx-auto mt-3 max-w-lg font-serif-editorial italic text-xl leading-relaxed text-[var(--ps-text-secondary)]">
          Some thoughts are too long for a comment. Some words deserve their
          own page.
        </p>
      </header>

      <NotebookDivider variant="botanical" className="my-10" />

      {isAuthorPreview && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--ps-border)] bg-[var(--ps-bg-secondary)] px-4 py-3 text-xs">
          <span className="text-[var(--ps-text-secondary)]">
            Preview source:
          </span>
          <div className="inline-flex rounded-md bg-[var(--ps-bg)] p-1">
            <button
              type="button"
              onClick={() => setPreviewScope('live')}
              className={`rounded px-3 py-1 font-medium transition-colors ${
                previewScope === 'live'
                  ? 'bg-[var(--ps-surface)] text-[var(--ps-accent)]'
                  : 'text-[var(--ps-text-muted)] hover:text-[var(--ps-text)]'
              }`}
            >
              Live Public Letters ({publicLetters.length})
            </button>
            <button
              type="button"
              onClick={() => setPreviewScope('staged')}
              className={`rounded px-3 py-1 font-medium transition-colors ${
                previewScope === 'staged'
                  ? 'bg-[var(--ps-surface)] text-[var(--ps-accent)]'
                  : 'text-[var(--ps-text-muted)] hover:text-[var(--ps-text)]'
              }`}
            >
              Local Notebook ({localLetters.filter((l) => l.status !== 'unpublished').length})
            </button>
          </div>
        </div>
      )}

      {displayedLetters.length === 0 ? (
        <div className="stationery-sheet rounded-xl p-10 text-center">
          <BotanicalSprig className="mx-auto mb-3 h-12 w-12 text-[var(--ps-olive)] opacity-80" />
          <p className="font-serif-editorial text-2xl text-[var(--ps-sheet-ink)]">
            The reading room is quiet for now.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--ps-sheet-ink-2)]">
            When a letter has been sealed and published, it will rest here—each
            with its own envelope and permanent link.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedLetters.map((letter) => (
            <article
              key={letter.slug}
              className="stationery-sheet rounded-xl px-6 py-7 transition-transform duration-200 hover:-translate-y-0.5 sm:px-10 sm:py-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-handwritten text-xl text-[var(--ps-sheet-muted)]">
                    {formatReadableDate(letter.publishedAt)}
                  </p>
                  <h2 className="mt-1 font-serif-editorial text-3xl font-medium leading-snug text-[var(--ps-sheet-ink)] [text-wrap:balance]">
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate({ name: 'public-letter', slug: letter.slug })
                      }
                      className="text-left transition-colors hover:text-[var(--ps-sheet-accent)] focus-visible:outline-2 focus-visible:outline-[var(--ps-sheet-accent)]"
                    >
                      {letter.title}
                    </button>
                  </h2>
                </div>

                <PostmarkStamp
                  dateText={letter.publishedAt}
                  className="hidden sm:inline-flex shrink-0"
                />
              </div>

              {letter.redditPost.title && (
                <p className="mt-1.5 text-xs italic text-[var(--ps-sheet-muted)]">
                  In reply to: {letter.redditPost.title}
                </p>
              )}

              <p className="mt-3 font-serif-editorial text-lg leading-relaxed text-[var(--ps-sheet-ink-2)]">
                {letter.excerpt}
              </p>

              <div className="mt-5 border-t border-[var(--ps-sheet-border)] pt-4">
                <button
                  type="button"
                  onClick={() =>
                    onNavigate({ name: 'public-letter', slug: letter.slug })
                  }
                  className="text-sm font-medium text-[var(--ps-sheet-accent)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--ps-sheet-accent)]"
                >
                  Open envelope →
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
