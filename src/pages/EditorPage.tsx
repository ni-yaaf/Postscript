import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Eye,
  ExternalLink,
  Save,
  Send,
  Minimize2,
} from 'lucide-react';
import type { AppRoute } from '../hooks/useRouter';
import type { AppSettings, Letter } from '../types/letter';
import { PostmarkStamp } from '../components/Ornament';
import { RichTextEditor } from '../components/RichTextEditor';
import { createEmptyLetter } from '../utils/storage';
import { sanitizeExternalUrl } from '../utils/sanitize';
import {
  countCharacters,
  countWords,
  ensureUniqueSlug,
  estimateReadingTime,
  formatReadableDate,
  formatRelativeTime,
  slugify,
  statusLabel,
} from '../utils/text';

interface EditorPageProps {
  letterId?: string;
  allLetters: Letter[];
  settings: AppSettings;
  onSaveLetter: (letter: Letter) => void;
  onOpenPublishModal: (letter: Letter) => void;
  onNavigate: (route: AppRoute) => void;
  onToast: (text: string, tone?: 'neutral' | 'success' | 'error') => void;
}

export const EditorPage: React.FC<EditorPageProps> = ({
  letterId,
  allLetters,
  settings,
  onSaveLetter,
  onOpenPublishModal,
  onNavigate,
  onToast,
}) => {
  const existing = useMemo(
    () => (letterId ? allLetters.find((l) => l.id === letterId) : undefined),
    [allLetters, letterId]
  );

  const [draft, setDraft] = useState<Letter>(() =>
    existing
      ? { ...existing }
      : createEmptyLetter({
          redditPost: {
            title: '',
            username: settings.recipientLabel || 'Neonate',
            subreddit: '',
            url: '',
            postDate: '',
            content: '',
            imageUrl: '',
          },
        })
  );

  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved'>(
    existing ? 'saved' : 'unsaved'
  );
  const [redditOpen, setRedditOpen] = useState<boolean>(
    Boolean(existing?.redditPost.title || existing?.redditPost.content || !existing)
  );
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const [distractionFree, setDistractionFree] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(existing?.slug));
  const [imageError, setImageError] = useState(false);

  const isFirstRender = useRef(true);
  const latestDraftRef = useRef(draft);
  latestDraftRef.current = draft;

  useEffect(() => {
    if (existing) {
      setDraft({ ...existing });
      setSlugTouched(Boolean(existing.slug));
      setSaveState('saved');
      setImageError(false);
    } else if (!letterId) {
      setDraft(
        createEmptyLetter({
          redditPost: {
            title: '',
            username: settings.recipientLabel || 'Neonate',
            subreddit: '',
            url: '',
            postDate: '',
            content: '',
            imageUrl: '',
          },
        })
      );
      setSlugTouched(false);
      setSaveState('unsaved');
      setImageError(false);
    }
    isFirstRender.current = true;
  }, [letterId, existing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const commitSave = (letterToSave: Letter, silent = false) => {
    const now = new Date().toISOString();
    const resolvedSlug = ensureUniqueSlug(
      letterToSave.slug || letterToSave.title || 'untitled-letter',
      allLetters,
      letterToSave.id
    );

    const nextStatus =
      letterToSave.status === 'published' ? 'updated' : letterToSave.status;

    const prepared: Letter = {
      ...letterToSave,
      slug: resolvedSlug,
      updatedAt: now,
      status: nextStatus,
    };

    setDraft(prepared);
    onSaveLetter(prepared);
    setSaveState('saved');
    if (!silent) {
      onToast('Letter saved locally.', 'success');
    }
    return prepared;
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const hasMeaningfulContent =
      draft.title.trim().length > 0 ||
      countWords(draft.contentHtml, true) > 0 ||
      draft.redditPost.title.trim().length > 0 ||
      draft.redditPost.content.trim().length > 0;

    if (!hasMeaningfulContent && !existing) {
      return;
    }

    setSaveState('saving');
    const timer = window.setTimeout(() => {
      commitSave(latestDraftRef.current, true);
    }, 850);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    draft.title,
    draft.subtitle,
    draft.slug,
    draft.contentHtml,
    draft.tags,
    draft.redditPost,
  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        commitSave(latestDraftRef.current, false);
      } else if (e.key === 'Escape' && distractionFree) {
        setDistractionFree(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distractionFree]);

  const words = countWords(draft.contentHtml, true);
  const chars = countCharacters(draft.contentHtml, true);
  const readingMins = estimateReadingTime(words);

  const safeRedditUrl = sanitizeExternalUrl(draft.redditPost.url);
  const safeImageUrl = sanitizeExternalUrl(draft.redditPost.imageUrl);

  const updateTitle = (newTitle: string) => {
    setDraft((prev) => ({
      ...prev,
      title: newTitle,
      slug:
        !slugTouched && prev.status !== 'published' && prev.status !== 'updated'
          ? slugify(newTitle)
          : prev.slug,
    }));
  };

  const toggleTag = (tag: string) => {
    setDraft((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleOpenPreview = () => {
    const saved = commitSave(draft, true);
    onNavigate({ name: 'desk-letter', id: saved.id });
  };

  const handlePreparePublish = () => {
    const saved = commitSave(draft, true);
    onOpenPublishModal(saved);
  };

  if (distractionFree) {
    return (
      <div className="fixed inset-0 z-40 overflow-y-auto bg-[var(--ps-bg)] px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--ps-text-muted)]">
            <div className="flex items-center gap-3">
              <span className="font-handwritten text-lg text-[var(--ps-accent)]">
                {draft.title || 'Untitled Letter'}
              </span>
              <span>·</span>
              <span>
                {saveState === 'saving'
                  ? 'Saving…'
                  : saveState === 'saved'
                    ? 'Saved'
                    : 'Unsaved'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {settings.showWordCountInEditor && (
                <span className="tabular-nums">
                  {words.toLocaleString()} words
                </span>
              )}
              <button
                type="button"
                onClick={() => setDistractionFree(false)}
                className="flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--ps-border)] px-3 py-1.5 text-xs font-medium text-[var(--ps-text-secondary)] hover:text-[var(--ps-text)]"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                <span>Exit Focus</span>
              </button>
            </div>
          </div>

          <div className="stationery-sheet rounded-xl px-6 py-9 sm:px-12 sm:py-12">
            <input
              type="text"
              value={draft.title}
              onChange={(e) => updateTitle(e.target.value)}
              placeholder="Title of your letter…"
              className="mb-2 w-full bg-transparent font-serif-editorial text-3xl font-medium text-[var(--ps-sheet-ink)] placeholder:text-[var(--ps-sheet-muted)] focus:outline-none sm:text-4xl"
            />
            <input
              type="text"
              value={draft.subtitle}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, subtitle: e.target.value }))
              }
              placeholder="Optional opening note…"
              className="mb-6 w-full bg-transparent font-serif-editorial italic text-xl text-[var(--ps-sheet-ink-2)] placeholder:text-[var(--ps-sheet-muted)] focus:outline-none"
            />

            <RichTextEditor
              value={draft.contentHtml}
              onChange={(html) =>
                setDraft((prev) => ({ ...prev, contentHtml: html }))
              }
              editorFont={settings.editorFont}
              fontSize={settings.fontSize}
              distractionFree={true}
              onToggleDistractionFree={() => setDistractionFree(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Quiet Desk Action Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--ps-text-muted)]">
          <button
            type="button"
            onClick={() => onNavigate({ name: 'desk-home' })}
            className="flex items-center gap-1.5 text-sm text-[var(--ps-text-secondary)] hover:text-[var(--ps-text)]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Letters</span>
          </button>
          <span aria-hidden="true">·</span>
          <span>{statusLabel(draft.status)}</span>
          <span aria-hidden="true">·</span>
          <span>
            {saveState === 'saving'
              ? 'Saving…'
              : saveState === 'saved'
                ? `Saved ${formatRelativeTime(draft.updatedAt)}`
                : 'Not yet saved'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => commitSave(draft, false)}
            className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--ps-border)] px-3.5 py-1.5 text-xs font-medium text-[var(--ps-text-secondary)] transition-colors hover:bg-[var(--ps-surface)] hover:text-[var(--ps-text)] whitespace-nowrap shrink-0"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save</span>
          </button>

          <button
            type="button"
            onClick={handleOpenPreview}
            className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--ps-border)] px-3.5 py-1.5 text-xs font-medium text-[var(--ps-text-secondary)] transition-colors hover:bg-[var(--ps-surface)] hover:text-[var(--ps-text)] whitespace-nowrap shrink-0"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Read</span>
          </button>

          <button
            type="button"
            onClick={handlePreparePublish}
            className="flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[var(--ps-accent)] px-4 py-1.5 text-xs font-medium text-[#14110F] transition-colors hover:bg-[var(--ps-accent-hover)] whitespace-nowrap shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Publish &amp; Share</span>
          </button>
        </div>
      </div>

      {/* Folded Reddit Reference Slip */}
      <section className="rounded-xl border border-[var(--ps-border)] bg-[var(--ps-bg-secondary)]">
        <button
          type="button"
          onClick={() => setRedditOpen((v) => !v)}
          aria-expanded={redditOpen}
          className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left"
        >
          <div className="min-w-0">
            <p className="font-handwritten text-base text-[var(--ps-accent)]">
              Note pinned from Reddit
            </p>
            <p className="truncate text-sm text-[var(--ps-text)]">
              {draft.redditPost.title ||
                `Paste ${settings.recipientLabel || 'Neonate'}'s post here for reference while you write`}
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs font-medium text-[var(--ps-accent)] whitespace-nowrap shrink-0">
            <span>{redditOpen ? 'Fold away' : 'Open note'}</span>
            {redditOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
        </button>

        {redditOpen && (
          <div className="border-t border-[var(--ps-border)] px-5 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs text-[var(--ps-text-muted)]">
                  Post Title
                </label>
                <input
                  type="text"
                  value={draft.redditPost.title}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      redditPost: { ...prev.redditPost, title: e.target.value },
                    }))
                  }
                  placeholder="Title of the Reddit post…"
                  className="mt-1.5 w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-surface)] px-3 py-2 text-sm text-[var(--ps-text)] placeholder:text-[var(--ps-text-muted)] focus:border-[var(--ps-accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--ps-text-muted)]">
                  Reddit Username
                </label>
                <input
                  type="text"
                  value={draft.redditPost.username}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      redditPost: {
                        ...prev.redditPost,
                        username: e.target.value,
                      },
                    }))
                  }
                  placeholder="e.g. neonate"
                  className="mt-1.5 w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-surface)] px-3 py-2 text-sm text-[var(--ps-text)] placeholder:text-[var(--ps-text-muted)] focus:border-[var(--ps-accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--ps-text-muted)]">
                  Subreddit
                </label>
                <input
                  type="text"
                  value={draft.redditPost.subreddit}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      redditPost: {
                        ...prev.redditPost,
                        subreddit: e.target.value,
                      },
                    }))
                  }
                  placeholder="e.g. CasualConversation"
                  className="mt-1.5 w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-surface)] px-3 py-2 text-sm text-[var(--ps-text)] placeholder:text-[var(--ps-text-muted)] focus:border-[var(--ps-accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--ps-text-muted)]">
                  Original Reddit URL
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="url"
                    value={draft.redditPost.url}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        redditPost: {
                          ...prev.redditPost,
                          url: e.target.value,
                        },
                      }))
                    }
                    placeholder="https://reddit.com/r/…"
                    className="w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-surface)] px-3 py-2 text-sm text-[var(--ps-text)] placeholder:text-[var(--ps-text-muted)] focus:border-[var(--ps-accent)] focus:outline-none"
                  />
                  {safeRedditUrl && (
                    <a
                      href={safeRedditUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--ps-border)] text-[var(--ps-text-secondary)] hover:text-[var(--ps-accent)]"
                      aria-label="Open original Reddit URL"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-[var(--ps-text-muted)]">
                  Post Date
                </label>
                <input
                  type="text"
                  value={draft.redditPost.postDate}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      redditPost: {
                        ...prev.redditPost,
                        postDate: e.target.value,
                      },
                    }))
                  }
                  placeholder="e.g. November 18, 2026"
                  className="mt-1.5 w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-surface)] px-3 py-2 text-sm text-[var(--ps-text)] placeholder:text-[var(--ps-text-muted)] focus:border-[var(--ps-accent)] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-[var(--ps-text-muted)]">
                  Original Post Content
                </label>
                <textarea
                  rows={4}
                  value={draft.redditPost.content}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      redditPost: {
                        ...prev.redditPost,
                        content: e.target.value,
                      },
                    }))
                  }
                  placeholder="Paste her post here…"
                  className="mt-1.5 w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-surface)] px-3 py-2.5 text-sm leading-relaxed text-[var(--ps-text)] placeholder:text-[var(--ps-text-muted)] focus:border-[var(--ps-accent)] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-[var(--ps-text-muted)]">
                  Optional Image URL
                </label>
                <input
                  type="url"
                  value={draft.redditPost.imageUrl}
                  onChange={(e) => {
                    setImageError(false);
                    setDraft((prev) => ({
                      ...prev,
                      redditPost: {
                        ...prev.redditPost,
                        imageUrl: e.target.value,
                      },
                    }));
                  }}
                  placeholder="https://… (optional)"
                  className="mt-1.5 w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-surface)] px-3 py-2 text-sm text-[var(--ps-text)] placeholder:text-[var(--ps-text-muted)] focus:border-[var(--ps-accent)] focus:outline-none"
                />
                {safeImageUrl && !imageError && (
                  <div className="mt-3 overflow-hidden rounded-lg border border-[var(--ps-border)] bg-[var(--ps-surface)] p-2">
                    <img
                      src={safeImageUrl}
                      alt="Original Reddit post attachment"
                      referrerPolicy="no-referrer"
                      onError={() => setImageError(true)}
                      className="max-h-56 rounded object-contain"
                    />
                  </div>
                )}
                {safeImageUrl && imageError && (
                  <p className="mt-2 text-xs text-[var(--ps-text-muted)]">
                    Image preview unavailable (URL preserved).
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Main Warm Cream Stationery Sheet */}
      <section className="stationery-sheet mt-7 rounded-xl px-6 py-8 sm:px-12 sm:py-12">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-handwritten text-2xl text-[var(--ps-sheet-ink-2)]">
              For {settings.recipientLabel || 'Neonate'},
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-[var(--ps-sheet-muted)]">
              <span>{formatReadableDate(draft.createdAt)}</span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => setDetailsOpen((v) => !v)}
                className="text-[var(--ps-sheet-accent)] hover:underline"
              >
                {detailsOpen ? 'Hide themes & link' : 'Themes & link'}
              </button>
            </div>
          </div>

          <PostmarkStamp dateText={draft.createdAt} className="hidden sm:inline-flex" />
        </div>

        <input
          type="text"
          value={draft.title}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="Title of this letter…"
          aria-label="Letter title"
          className="w-full bg-transparent font-serif-editorial text-3xl font-medium tracking-tight text-[var(--ps-sheet-ink)] placeholder:text-[var(--ps-sheet-muted)] focus:outline-none sm:text-4xl"
        />

        <input
          type="text"
          value={draft.subtitle}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, subtitle: e.target.value }))
          }
          placeholder="Optional subtitle or quiet dedication…"
          aria-label="Letter subtitle"
          className="mt-2 w-full bg-transparent font-serif-editorial italic text-xl text-[var(--ps-sheet-ink-2)] placeholder:text-[var(--ps-sheet-muted)] focus:outline-none"
        />

        {detailsOpen && (
          <div className="mt-5 flex flex-col gap-3 border-t border-[var(--ps-sheet-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {settings.tags.map((tag) => {
                const selected = draft.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    aria-pressed={selected}
                    className={`rounded-md px-2.5 py-1 text-xs transition-colors whitespace-nowrap shrink-0 ${
                      selected
                        ? 'bg-[var(--ps-sheet-slip)] text-[var(--ps-sheet-accent)] font-medium'
                        : 'text-[var(--ps-sheet-muted)] hover:bg-[var(--ps-sheet-slip)]/60 hover:text-[var(--ps-sheet-ink)]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="letter-slug-input"
                className="text-xs text-[var(--ps-sheet-muted)] whitespace-nowrap"
              >
                Link slug:
              </label>
              <input
                id="letter-slug-input"
                type="text"
                value={draft.slug}
                disabled={
                  draft.status === 'published' || draft.status === 'updated'
                }
                onChange={(e) => {
                  setSlugTouched(true);
                  setDraft((prev) => ({
                    ...prev,
                    slug: slugify(e.target.value),
                  }));
                }}
                placeholder="auto-from-title"
                className="w-44 rounded-md border border-[var(--ps-sheet-border)] bg-[var(--ps-sheet-bg)] px-2.5 py-1 font-mono-tabular text-xs text-[var(--ps-sheet-ink-2)] focus:border-[var(--ps-sheet-accent)] focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>
        )}

        <div className="mt-6">
          <RichTextEditor
            value={draft.contentHtml}
            onChange={(html) =>
              setDraft((prev) => ({ ...prev, contentHtml: html }))
            }
            editorFont={settings.editorFont}
            fontSize={settings.fontSize}
            distractionFree={false}
            onToggleDistractionFree={() => setDistractionFree(true)}
          />
        </div>

        {settings.showWordCountInEditor && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ps-sheet-border)] pt-4 text-xs text-[var(--ps-sheet-muted)]">
            <div className="flex items-center gap-3 tabular-nums">
              <span>{words.toLocaleString()} words</span>
              <span aria-hidden="true">·</span>
              <span>{chars.toLocaleString()} characters</span>
              <span aria-hidden="true">·</span>
              <span>~{readingMins} min read</span>
            </div>
            <span>Ctrl/Cmd + S to save</span>
          </div>
        )}
      </section>
    </div>
  );
};
