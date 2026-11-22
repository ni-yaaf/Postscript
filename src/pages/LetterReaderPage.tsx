import React, { useState } from 'react';
import {
  ArrowLeft,
  BookmarkPlus,
  Check,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  Send,
} from 'lucide-react';
import type { AppRoute } from '../hooks/useRouter';
import type { AppSettings, FavouritePassage, Letter } from '../types/letter';
import {
  BotanicalSprig,
  NotebookDivider,
  PostmarkStamp,
  WaxSealMark,
} from '../components/Ornament';
import { ConfirmModal } from '../components/ConfirmModal';
import { sanitizeExternalUrl, sanitizeHtml } from '../utils/sanitize';
import { triggerDownload } from '../utils/publishing';
import {
  exportLetterAsMarkdown,
  exportLetterAsTxt,
  formatReadableDate,
  htmlToPlainText,
  slugify,
  statusLabel,
} from '../utils/text';

interface LetterReaderPageProps {
  letter: Letter | undefined;
  settings: AppSettings;
  onNavigate: (route: AppRoute) => void;
  onOpenPublishModal: (letter: Letter) => void;
  onUnpublishLetter: (letter: Letter) => void;
  onSavePassage: (passage: FavouritePassage) => void;
  onToast: (text: string, tone?: 'neutral' | 'success' | 'error') => void;
}

export const LetterReaderPage: React.FC<LetterReaderPageProps> = ({
  letter,
  settings,
  onNavigate,
  onOpenPublishModal,
  onUnpublishLetter,
  onSavePassage,
  onToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [showPassageForm, setShowPassageForm] = useState(false);
  const [passageText, setPassageText] = useState('');
  const [passageNote, setPassageNote] = useState('');
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);

  if (!letter) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-serif-editorial text-3xl text-[var(--ps-text)]">
          Letter not found
        </h1>
        <p className="mt-2 text-sm text-[var(--ps-text-secondary)]">
          This letter may have been deleted from your local browser notebook.
        </p>
        <button
          type="button"
          onClick={() => onNavigate({ name: 'desk-home' })}
          className="mt-6 rounded-lg bg-[var(--ps-accent)] px-4 py-2 text-sm font-medium text-[#14110F]"
        >
          Return to Letters
        </button>
      </div>
    );
  }

  const safeHtml = sanitizeHtml(letter.contentHtml);
  const safeRedditUrl = sanitizeExternalUrl(letter.redditPost.url);
  const safeImageUrl = sanitizeExternalUrl(letter.redditPost.imageUrl);

  const canUnpublish =
    letter.status === 'published' ||
    letter.status === 'pending' ||
    letter.status === 'updated' ||
    letter.status === 'ready';

  const handleCopyLetter = async () => {
    try {
      await navigator.clipboard.writeText(htmlToPlainText(letter.contentHtml));
      setCopied(true);
      onToast('Letter text copied to clipboard.', 'success');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast('Could not access clipboard.', 'error');
    }
  };

  const handleOpenPassageSaver = () => {
    const selected = window.getSelection()?.toString().trim() || '';
    setPassageText(selected);
    setPassageNote('');
    setShowPassageForm(true);
  };

  const handleSavePassageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passageText.trim()) return;
    onSavePassage({
      id: `psg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      letterId: letter.id,
      letterTitle: letter.title || 'Untitled Letter',
      passageText: passageText.trim(),
      note: passageNote.trim(),
      savedAt: new Date().toISOString(),
    });
    setShowPassageForm(false);
    setPassageText('');
    setPassageNote('');
  };

  const sizeClass =
    settings.fontSize === 'small'
      ? 'text-[18px]'
      : settings.fontSize === 'large'
        ? 'text-[22px]'
        : 'text-[20px]';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Author Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
        <div className="flex items-center gap-3 text-xs text-[var(--ps-text-muted)]">
          <button
            type="button"
            onClick={() => onNavigate({ name: 'desk-home' })}
            className="flex items-center gap-1.5 text-sm text-[var(--ps-text-secondary)] hover:text-[var(--ps-text)]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Letters</span>
          </button>
          <span aria-hidden="true">·</span>
          <span>{statusLabel(letter.status)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate({ name: 'desk-edit', id: letter.id })}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--ps-border)] px-3 py-1.5 text-xs font-medium text-[var(--ps-text)] hover:bg-[var(--ps-surface)] whitespace-nowrap shrink-0"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLetter}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--ps-border)] px-3 py-1.5 text-xs font-medium text-[var(--ps-text-secondary)] hover:bg-[var(--ps-surface)] hover:text-[var(--ps-text)] whitespace-nowrap shrink-0"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[var(--ps-accent)]" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              triggerDownload(
                exportLetterAsTxt(letter),
                `${slugify(letter.slug || letter.title)}.txt`
              )
            }
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--ps-border)] px-3 py-1.5 text-xs font-medium text-[var(--ps-text-secondary)] hover:bg-[var(--ps-surface)] hover:text-[var(--ps-text)] whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>TXT</span>
          </button>

          <button
            type="button"
            onClick={() =>
              triggerDownload(
                exportLetterAsMarkdown(letter),
                `${slugify(letter.slug || letter.title)}.md`,
                'text/markdown;charset=utf-8'
              )
            }
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--ps-border)] px-3 py-1.5 text-xs font-medium text-[var(--ps-text-secondary)] hover:bg-[var(--ps-surface)] hover:text-[var(--ps-text)] whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Markdown</span>
          </button>

          <button
            type="button"
            onClick={handleOpenPassageSaver}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--ps-border)] px-3 py-1.5 text-xs font-medium text-[var(--ps-text-secondary)] hover:bg-[var(--ps-surface)] hover:text-[var(--ps-text)] whitespace-nowrap shrink-0"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            <span>Save Passage</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate({ name: 'desk-preview' })}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--ps-border)] px-3 py-1.5 text-xs font-medium text-[var(--ps-text-secondary)] hover:bg-[var(--ps-surface)] hover:text-[var(--ps-text)] whitespace-nowrap shrink-0"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Reading Room</span>
          </button>

          {canUnpublish && (
            <button
              type="button"
              onClick={() => setConfirmUnpublish(true)}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--ps-border)] px-3 py-1.5 text-xs font-medium text-[var(--ps-danger)] hover:bg-[var(--ps-surface)] whitespace-nowrap shrink-0"
            >
              <EyeOff className="h-3.5 w-3.5" />
              <span>Unpublish</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenPublishModal(letter)}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[var(--ps-accent)] px-3.5 py-1.5 text-xs font-medium text-[#14110F] hover:bg-[var(--ps-accent-hover)] whitespace-nowrap shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
            <span>
              {letter.status === 'published' || letter.status === 'updated'
                ? 'Update Link'
                : 'Publish & Share'}
            </span>
          </button>
        </div>
      </div>

      {showPassageForm && (
        <form
          onSubmit={handleSavePassageSubmit}
          className="mb-8 rounded-xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-5"
        >
          <p className="font-serif-editorial text-xl font-medium text-[var(--ps-text)]">
            Save a favourite passage
          </p>
          <p className="mt-1 text-xs text-[var(--ps-text-muted)]">
            Tip: Highlight any lines in your letter before clicking Save Passage
            to fill them automatically.
          </p>
          <textarea
            rows={3}
            required
            value={passageText}
            onChange={(e) => setPassageText(e.target.value)}
            placeholder="Paste or refine the passage to preserve…"
            className="mt-3 w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-bg)] px-3 py-2 text-sm text-[var(--ps-text)] focus:border-[var(--ps-accent)] focus:outline-none"
          />
          <input
            type="text"
            value={passageNote}
            onChange={(e) => setPassageNote(e.target.value)}
            placeholder="Optional personal note…"
            className="mt-2.5 w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-bg)] px-3 py-2 text-sm text-[var(--ps-text)] focus:border-[var(--ps-accent)] focus:outline-none"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowPassageForm(false)}
              className="rounded-lg border border-[var(--ps-border)] px-3.5 py-1.5 text-xs font-medium text-[var(--ps-text-secondary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[var(--ps-accent)] px-4 py-1.5 text-xs font-medium text-[#14110F]"
            >
              Save Passage
            </button>
          </div>
        </form>
      )}

      {/* Stationery Letter Sheet */}
      <article className="stationery-sheet mx-auto max-w-2xl rounded-xl px-6 py-10 sm:px-12 sm:py-14">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-handwritten text-2xl text-[var(--ps-sheet-ink-2)]">
              For {settings.recipientLabel || 'Neonate'},
            </p>
            <p className="mt-0.5 text-xs text-[var(--ps-sheet-muted)]">
              {formatReadableDate(letter.createdAt)}
            </p>
          </div>
          <PostmarkStamp dateText={letter.createdAt} />
        </div>

        <h1 className="mt-5 font-serif-editorial text-4xl font-medium leading-tight text-[var(--ps-sheet-ink)] sm:text-5xl [text-wrap:balance]">
          {letter.title || 'Untitled Letter'}
        </h1>

        {letter.subtitle && (
          <p className="mt-3 font-serif-editorial italic text-2xl leading-snug text-[var(--ps-sheet-ink-2)]">
            {letter.subtitle}
          </p>
        )}

        <NotebookDivider variant="botanical" onPaper className="my-8" />

        {(letter.redditPost.title ||
          letter.redditPost.content ||
          safeRedditUrl) && (
          <section className="mb-9 rounded-lg border border-[var(--ps-sheet-border)] bg-[var(--ps-sheet-slip)]/75 px-5 py-4">
            <p className="font-handwritten text-lg text-[var(--ps-sheet-accent)]">
              In reply to her post
            </p>
            {letter.redditPost.title && (
              <h2 className="mt-0.5 font-serif-editorial text-xl font-medium text-[var(--ps-sheet-ink)]">
                {letter.redditPost.title}
              </h2>
            )}
            {(letter.redditPost.subreddit ||
              letter.redditPost.username ||
              letter.redditPost.postDate) && (
              <p className="mt-1 text-xs text-[var(--ps-sheet-muted)]">
                {[
                  letter.redditPost.subreddit
                    ? `r/${letter.redditPost.subreddit.replace(/^r\//i, '')}`
                    : '',
                  letter.redditPost.username
                    ? `u/${letter.redditPost.username.replace(/^u\//i, '')}`
                    : '',
                  letter.redditPost.postDate,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            {letter.redditPost.content && (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--ps-sheet-ink-2)]">
                {letter.redditPost.content}
              </p>
            )}
            {safeImageUrl && (
              <img
                src={safeImageUrl}
                alt="Referenced Reddit post attachment"
                referrerPolicy="no-referrer"
                className="mt-4 max-h-72 rounded-lg border border-[var(--ps-sheet-border)] object-contain"
              />
            )}
            {safeRedditUrl && (
              <a
                href={safeRedditUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--ps-sheet-accent)] hover:underline"
              >
                <span>View original post</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </section>
        )}

        <div
          className={`font-serif-editorial ${sizeClass} letter-ink-prose ${
            settings.showDropCaps ? 'postscript-dropcap' : ''
          }`}
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />

        <div className="mt-12 flex items-center justify-between border-t border-[var(--ps-sheet-border)] pt-7">
          <div className="flex items-center gap-3">
            <WaxSealMark className="text-[var(--ps-seal)]" />
            <span className="font-handwritten text-2xl text-[var(--ps-sheet-ink-2)]">
              End of letter.
            </span>
          </div>
          <BotanicalSprig className="h-10 w-10 text-[var(--ps-olive)] opacity-75" />
        </div>
      </article>

      <ConfirmModal
        open={confirmUnpublish}
        title="Unpublish this letter?"
        description="This marks the letter as Unpublished locally. To remove it from your public GitHub Pages site, download an updated publication package and commit it to GitHub."
        confirmLabel="Mark Unpublished"
        destructive
        onCancel={() => setConfirmUnpublish(false)}
        onConfirm={() => {
          onUnpublishLetter(letter);
          setConfirmUnpublish(false);
        }}
      />
    </div>
  );
};
