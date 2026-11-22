import React, { useMemo, useState } from 'react';
import {
  Copy,
  Download,
  Edit3,
  Eye,
  Feather,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import type { AppRoute } from '../hooks/useRouter';
import type { Letter } from '../types/letter';
import { ConfirmModal } from '../components/ConfirmModal';
import { BotanicalSprig, NotebookDivider } from '../components/Ornament';
import { triggerDownload } from '../utils/publishing';
import {
  createExcerpt,
  exportLetterAsMarkdown,
  formatRelativeTime,
  formatShortDate,
  htmlToPlainText,
  shortStatusLabel,
  slugify,
} from '../utils/text';

interface LettersDeskPageProps {
  letters: Letter[];
  availableTags: string[];
  recipientLabel: string;
  onNavigate: (route: AppRoute) => void;
  onOpenPublishModal: (letter: Letter) => void;
  onDuplicateLetter: (letter: Letter) => void;
  onDeleteLetter: (id: string) => void;
  onToast: (text: string, tone?: 'neutral' | 'success' | 'error') => void;
}

type StatusFilter = 'all' | 'draft' | 'published' | 'unpublished';
type SortOption = 'updated-desc' | 'created-desc' | 'created-asc';

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Late hours at the desk';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getMonthHeading(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Undated';
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export const LettersDeskPage: React.FC<LettersDeskPageProps> = ({
  letters,
  availableTags,
  recipientLabel,
  onNavigate,
  onOpenPublishModal,
  onDuplicateLetter,
  onDeleteLetter,
  onToast,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('updated-desc');
  const [deleteTarget, setDeleteTarget] = useState<Letter | null>(null);

  const filteredLetters = useMemo(() => {
    const q = search.trim().toLowerCase();

    const list = letters.filter((letter) => {
      if (statusFilter === 'draft') {
        if (letter.status !== 'draft' && letter.status !== 'ready') {
          return false;
        }
      } else if (statusFilter === 'published') {
        if (
          letter.status !== 'published' &&
          letter.status !== 'pending' &&
          letter.status !== 'updated'
        ) {
          return false;
        }
      } else if (statusFilter === 'unpublished') {
        if (letter.status !== 'unpublished') {
          return false;
        }
      }

      if (tagFilter !== 'all' && !letter.tags.includes(tagFilter)) {
        return false;
      }

      if (!q) return true;

      const haystack = [
        letter.title,
        letter.subtitle,
        htmlToPlainText(letter.contentHtml),
        letter.redditPost.title,
        letter.redditPost.subreddit,
        letter.redditPost.username,
        letter.redditPost.content,
        ...letter.tags,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });

    list.sort((a, b) => {
      if (sortBy === 'created-desc') {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (sortBy === 'created-asc') {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      return (
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });

    return list;
  }, [letters, search, statusFilter, tagFilter, sortBy]);

  // Group letters chronologically into journal chapters (Month Year)
  const groupedByMonth = useMemo(() => {
    const groups: Array<{ heading: string; items: Letter[] }> = [];
    for (const letter of filteredLetters) {
      const dateField =
        sortBy === 'updated-desc' ? letter.updatedAt : letter.createdAt;
      const heading = getMonthHeading(dateField);
      const existingGroup = groups.find((g) => g.heading === heading);
      if (existingGroup) {
        existingGroup.items.push(letter);
      } else {
        groups.push({ heading, items: [letter] });
      }
    }
    return groups;
  }, [filteredLetters, sortBy]);

  const handleExportMarkdown = (letter: Letter) => {
    const md = exportLetterAsMarkdown(letter);
    triggerDownload(
      md,
      `${slugify(letter.slug || letter.title)}.md`,
      'text/markdown;charset=utf-8'
    );
    onToast('Exported letter as Markdown.', 'success');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Personal Journal Opening */}
      <section className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-handwritten text-xl text-[var(--ps-accent)]">
            Correspondence Journal · For {recipientLabel}
          </p>
          <h1 className="mt-1 font-serif-editorial text-4xl font-medium tracking-tight text-[var(--ps-text)] sm:text-5xl [text-wrap:balance]">
            {getTimeGreeting()}.
          </h1>
          <p className="mt-2 font-serif-editorial italic text-xl text-[var(--ps-text-secondary)]">
            Take your time. Some words deserve a page of their own.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate({ name: 'desk-new' })}
          className="inline-flex min-h-[42px] items-center gap-2 self-start rounded-lg bg-[var(--ps-accent)] px-5 py-2 text-sm font-medium text-[#14110F] transition-colors hover:bg-[var(--ps-accent-hover)] whitespace-nowrap shrink-0 sm:self-auto"
        >
          <Feather className="h-4 w-4" />
          <span>Open a Fresh Page</span>
        </button>
      </section>

      <NotebookDivider variant="botanical" className="my-8" />

      {/* Search & Filter Controls */}
      {letters.length > 0 && (
        <section
          aria-label="Browse journal entries"
          className="mb-9 flex flex-col gap-3"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ps-text-muted)]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search letters by title, memory, or Reddit post…"
                aria-label="Search letters"
                className="min-h-[40px] w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-surface)] pl-9 pr-3 text-sm text-[var(--ps-text)] placeholder:text-[var(--ps-text-muted)] focus:border-[var(--ps-accent)] focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                aria-label="Filter by theme"
                className="min-h-[40px] rounded-lg border border-[var(--ps-border)] bg-[var(--ps-surface)] px-3 text-xs font-medium text-[var(--ps-text-secondary)] focus:border-[var(--ps-accent)] focus:outline-none"
              >
                <option value="all">All themes</option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort journal entries"
                className="min-h-[40px] rounded-lg border border-[var(--ps-border)] bg-[var(--ps-surface)] px-3 text-xs font-medium text-[var(--ps-text-secondary)] focus:border-[var(--ps-accent)] focus:outline-none"
              >
                <option value="updated-desc">Recently edited</option>
                <option value="created-desc">Newest pages first</option>
                <option value="created-asc">Oldest pages first</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-[var(--ps-bg-secondary)] p-1"
              role="tablist"
              aria-label="Letter status filter"
            >
              {(
                [
                  { id: 'all', label: 'All Pages' },
                  { id: 'draft', label: 'Drafts' },
                  { id: 'published', label: 'Published' },
                  { id: 'unpublished', label: 'Unpublished' },
                ] as const
              ).map((tab) => {
                const active = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`min-h-[32px] rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[var(--ps-surface)] text-[var(--ps-accent)] shadow-sm'
                        : 'text-[var(--ps-text-secondary)] hover:text-[var(--ps-text)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <span className="font-handwritten text-base text-[var(--ps-text-muted)]">
              {filteredLetters.length} of {letters.length}{' '}
              {letters.length === 1 ? 'kept letter' : 'kept letters'}
            </span>
          </div>
        </section>
      )}

      {/* Journal Folio Entries Grouped Chronologically */}
      {filteredLetters.length === 0 ? (
        <div className="stationery-sheet rounded-xl p-10 text-center">
          <BotanicalSprig className="mx-auto mb-3 h-12 w-12 text-[var(--ps-olive)] opacity-80" />
          <p className="font-serif-editorial text-2xl text-[var(--ps-sheet-ink)]">
            {letters.length === 0
              ? 'An open journal waiting for its first letter.'
              : 'No kept pages match what you searched for.'}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--ps-sheet-ink-2)]">
            {letters.length === 0
              ? `Whenever one of ${recipientLabel}'s posts lingers in your thoughts, open a fresh page here.`
              : 'Try clearing your search words or switching the status filter.'}
          </p>
          {letters.length === 0 ? (
            <button
              type="button"
              onClick={() => onNavigate({ name: 'desk-new' })}
              className="mt-6 inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[var(--ps-sheet-accent)] px-5 py-2 text-sm font-medium text-[#FAF4E9]"
            >
              Write First Letter
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setTagFilter('all');
              }}
              className="mt-5 inline-flex min-h-[40px] items-center rounded-lg border border-[var(--ps-sheet-border)] px-4 py-2 text-sm font-medium text-[var(--ps-sheet-ink-2)] hover:text-[var(--ps-sheet-ink)]"
            >
              Show all pages
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          {groupedByMonth.map((group) => (
            <section key={group.heading}>
              <div className="mb-5 flex items-baseline gap-4">
                <h2 className="font-handwritten text-2xl text-[var(--ps-accent)]">
                  {group.heading}
                </h2>
                <span className="h-px flex-1 bg-[var(--ps-border)]" />
              </div>

              <div className="space-y-6">
                {group.items.map((letter) => (
                  <article
                    key={letter.id}
                    className="stationery-sheet rounded-xl px-6 py-6 transition-transform duration-200 hover:-translate-y-0.5 sm:px-9 sm:py-7"
                  >
                    {/* Handwritten Date & Quiet Status Margin */}
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-handwritten text-xl text-[var(--ps-sheet-muted)]">
                        {formatShortDate(letter.createdAt)} · edited{' '}
                        {formatRelativeTime(letter.updatedAt)}
                      </span>
                      <span
                        className={`text-xs font-medium tracking-wide ${
                          letter.status === 'published'
                            ? 'text-[var(--ps-olive)]'
                            : letter.status === 'pending' ||
                                letter.status === 'ready' ||
                                letter.status === 'updated'
                              ? 'text-[var(--ps-seal)]'
                              : 'text-[var(--ps-sheet-muted)]'
                        }`}
                      >
                        {shortStatusLabel(letter.status)}
                      </span>
                    </div>

                    <h3 className="mt-2 font-serif-editorial text-2xl font-medium leading-snug text-[var(--ps-sheet-ink)] sm:text-3xl [text-wrap:balance]">
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate({ name: 'desk-edit', id: letter.id })
                        }
                        className="text-left transition-colors hover:text-[var(--ps-sheet-accent)] focus-visible:outline-2 focus-visible:outline-[var(--ps-sheet-accent)]"
                      >
                        {letter.title || 'Untitled Letter'}
                      </button>
                    </h3>

                    {letter.redditPost.title && (
                      <p className="mt-1.5 text-xs italic text-[var(--ps-sheet-muted)]">
                        In reply to: {letter.redditPost.title}
                        {letter.redditPost.subreddit
                          ? ` · r/${letter.redditPost.subreddit.replace(/^r\//i, '')}`
                          : ''}
                      </p>
                    )}

                    <p className="mt-3 font-serif-editorial text-lg leading-relaxed text-[var(--ps-sheet-ink-2)]">
                      {createExcerpt(letter.contentHtml, 195)}
                    </p>

                    {letter.tags.length > 0 && (
                      <p className="mt-3 text-xs text-[var(--ps-sheet-muted)]">
                        {letter.tags.join(' · ')}
                      </p>
                    )}

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ps-sheet-border)] pt-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onNavigate({ name: 'desk-edit', id: letter.id })
                          }
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-[var(--ps-sheet-border)] bg-[var(--ps-sheet-bg)] px-3 py-1.5 text-xs font-medium text-[var(--ps-sheet-ink)] transition-colors hover:bg-[var(--ps-sheet-slip)] whitespace-nowrap shrink-0"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Write</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onNavigate({ name: 'desk-letter', id: letter.id })
                          }
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-[var(--ps-sheet-border)] px-3 py-1.5 text-xs font-medium text-[var(--ps-sheet-ink-2)] transition-colors hover:bg-[var(--ps-sheet-slip)] hover:text-[var(--ps-sheet-ink)] whitespace-nowrap shrink-0"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Read</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenPublishModal(letter)}
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-[var(--ps-seal)]/35 bg-[var(--ps-seal)]/10 px-3 py-1.5 text-xs font-medium text-[var(--ps-seal)] transition-colors hover:bg-[var(--ps-seal)] hover:text-[#FAF4E9] whitespace-nowrap shrink-0"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>
                            {letter.status === 'published' ||
                            letter.status === 'updated'
                              ? 'Update Link'
                              : 'Publish'}
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onDuplicateLetter(letter)}
                          title="Duplicate letter"
                          aria-label="Duplicate letter"
                          className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--ps-sheet-muted)] transition-colors hover:bg-[var(--ps-sheet-slip)] hover:text-[var(--ps-sheet-ink)]"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportMarkdown(letter)}
                          title="Export as Markdown"
                          aria-label="Export as Markdown"
                          className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--ps-sheet-muted)] transition-colors hover:bg-[var(--ps-sheet-slip)] hover:text-[var(--ps-sheet-ink)]"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(letter)}
                          title="Delete letter"
                          aria-label="Delete letter"
                          className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--ps-sheet-muted)] transition-colors hover:bg-[var(--ps-sheet-slip)] hover:text-[var(--ps-danger)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete this letter?"
        description={
          deleteTarget
            ? `"${deleteTarget.title || 'Untitled Letter'}" will be removed permanently from your local journal. If it was previously published, re-generate your publication package to remove it publicly.`
            : ''
        }
        confirmLabel="Delete letter"
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteLetter(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
};
