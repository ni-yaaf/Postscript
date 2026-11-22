import React, { useState } from 'react';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import type { AppRoute } from '../hooks/useRouter';
import type { FavouritePassage, Letter } from '../types/letter';
import { ConfirmModal } from '../components/ConfirmModal';
import { NotebookDivider } from '../components/Ornament';
import { formatShortDate } from '../utils/text';

interface PassagesPageProps {
  passages: FavouritePassage[];
  letters: Letter[];
  onAddPassage: (passage: FavouritePassage) => void;
  onDeletePassage: (id: string) => void;
  onNavigate: (route: AppRoute) => void;
}

export const PassagesPage: React.FC<PassagesPageProps> = ({
  passages,
  letters,
  onAddPassage,
  onDeletePassage,
  onNavigate,
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedLetterId, setSelectedLetterId] = useState<string>(
    letters[0]?.id || ''
  );
  const [passageText, setPassageText] = useState('');
  const [note, setNote] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FavouritePassage | null>(
    null
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passageText.trim()) return;
    const sourceLetter = letters.find((l) => l.id === selectedLetterId);
    onAddPassage({
      id: `psg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      letterId: sourceLetter?.id || '',
      letterTitle: sourceLetter?.title || 'Personal Note',
      passageText: passageText.trim(),
      note: note.trim(),
      savedAt: new Date().toISOString(),
    });
    setPassageText('');
    setNote('');
    setShowAdd(false);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-handwritten text-xl text-[var(--ps-accent)]">
            Kept in the margin
          </p>
          <h1 className="mt-1 font-serif-editorial text-4xl font-medium text-[var(--ps-text)]">
            Favourite Passages
          </h1>
          <p className="mt-2 text-sm text-[var(--ps-text-secondary)]">
            Lines worth keeping close. Saved passages remain strictly private on
            your desk.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[var(--ps-accent)] px-4 py-2 text-xs font-medium text-[#14110F] hover:bg-[var(--ps-accent-hover)] whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Keep a Passage</span>
        </button>
      </div>

      <NotebookDivider variant="botanical" className="my-8" />

      {showAdd && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-6"
        >
          <h2 className="font-serif-editorial text-2xl font-medium text-[var(--ps-text)]">
            Keep a passage
          </h2>
          <div className="mt-4 space-y-4">
            {letters.length > 0 && (
              <div>
                <label className="block text-xs text-[var(--ps-text-muted)]">
                  Associated letter
                </label>
                <select
                  value={selectedLetterId}
                  onChange={(e) => setSelectedLetterId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-bg)] px-3 py-2 text-sm text-[var(--ps-text)] focus:border-[var(--ps-accent)] focus:outline-none"
                >
                  {letters.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title || 'Untitled Letter'}
                    </option>
                  ))}
                  <option value="">Standalone reflection</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs text-[var(--ps-text-muted)]">
                Passage text
              </label>
              <textarea
                rows={3}
                required
                value={passageText}
                onChange={(e) => setPassageText(e.target.value)}
                placeholder="Write or paste the sentences you want to remember…"
                className="mt-1.5 w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-bg)] px-3 py-2 text-sm leading-relaxed text-[var(--ps-text)] focus:border-[var(--ps-accent)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--ps-text-muted)]">
                Optional personal note
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Why this stayed with you…"
                className="mt-1.5 w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-bg)] px-3 py-2 text-sm text-[var(--ps-text)] focus:border-[var(--ps-accent)] focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-lg border border-[var(--ps-border)] px-4 py-2 text-xs font-medium text-[var(--ps-text-secondary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[var(--ps-accent)] px-4 py-2 text-xs font-medium text-[#14110F]"
            >
              Save Passage
            </button>
          </div>
        </form>
      )}

      {passages.length === 0 ? (
        <div className="stationery-sheet rounded-xl p-10 text-center">
          <p className="font-serif-editorial text-2xl text-[var(--ps-sheet-ink)]">
            No saved passages yet.
          </p>
          <p className="mt-2 text-sm text-[var(--ps-sheet-ink-2)]">
            Whenever you write a line you want to revisit later, open any letter
            in Read view and click Save Passage.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {passages.map((passage) => {
            const linkedLetter = letters.find((l) => l.id === passage.letterId);
            return (
              <article
                key={passage.id}
                className="stationery-sheet rounded-xl px-6 py-7 sm:px-9"
              >
                <blockquote className="font-serif-editorial text-2xl italic leading-relaxed text-[var(--ps-sheet-ink)]">
                  “{passage.passageText}”
                </blockquote>

                {passage.note && (
                  <p className="mt-3 font-handwritten text-xl text-[var(--ps-sheet-accent)]">
                    Note: {passage.note}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ps-sheet-border)] pt-3.5 text-xs text-[var(--ps-sheet-muted)]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>From {passage.letterTitle}</span>
                    <span aria-hidden="true">·</span>
                    <span>Saved {formatShortDate(passage.savedAt)}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    {linkedLetter && (
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate({
                            name: 'desk-letter',
                            id: linkedLetter.id,
                          })
                        }
                        className="inline-flex items-center gap-1 text-[var(--ps-sheet-accent)] hover:underline"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Open letter</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(passage)}
                      className="inline-flex items-center gap-1 text-[var(--ps-danger)] hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Remove saved passage?"
        description="This only removes the excerpt from Favourite Passages. The original letter remains untouched."
        confirmLabel="Remove passage"
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeletePassage(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
};
