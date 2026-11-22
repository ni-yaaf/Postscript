import React, { useEffect, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Share2,
} from 'lucide-react';
import type { AppRoute } from '../hooks/useRouter';
import type { AppSettings, PublicLetter } from '../types/letter';
import { EnvelopeCover } from '../components/EnvelopeCover';
import {
  BotanicalSprig,
  NotebookDivider,
  PostmarkStamp,
  WaxSealMark,
} from '../components/Ornament';
import { buildPublicShareUrl } from '../utils/publishing';
import { sanitizeExternalUrl, sanitizeHtml } from '../utils/sanitize';
import { formatReadableDate } from '../utils/text';

interface PublicLetterPageProps {
  letter: PublicLetter | undefined;
  settings: AppSettings;
  onNavigate: (route: AppRoute) => void;
  onToast: (text: string, tone?: 'neutral' | 'success' | 'error') => void;
}

export const PublicLetterPage: React.FC<PublicLetterPageProps> = ({
  letter,
  settings,
  onNavigate,
  onToast,
}) => {
  const [opened, setOpened] = useState<boolean>(() => {
    if (!letter) return false;
    try {
      return sessionStorage.getItem(`ps_opened_${letter.slug}`) === '1';
    } catch {
      return false;
    }
  });
  const [redditExpanded, setRedditExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageBroken, setImageBroken] = useState(false);

  useEffect(() => {
    if (!letter) return;
    const prevTitle = document.title;
    document.title = `${letter.title} — Postscript`;
    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content') || '';
    if (metaDesc) metaDesc.setAttribute('content', letter.excerpt);
    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc) metaDesc.setAttribute('content', prevDesc);
    };
  }, [letter]);

  if (!letter) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="font-serif-editorial text-3xl font-medium text-[var(--ps-text)]">
          This letter is unavailable.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ps-text-secondary)]">
          It may have been unpublished, or its page has not finished deploying
          yet.
        </p>
        <button
          type="button"
          onClick={() => onNavigate({ name: 'reading-room' })}
          className="mt-6 rounded-lg border border-[var(--ps-border)] px-4 py-2 text-sm font-medium text-[var(--ps-text)] hover:bg-[var(--ps-surface)]"
        >
          Return to Reading Room
        </button>
      </div>
    );
  }

  const handleOpenEnvelope = () => {
    setOpened(true);
    try {
      sessionStorage.setItem(`ps_opened_${letter.slug}`, '1');
    } catch {
      // Ignore storage restriction
    }
  };

  if (!opened) {
    return (
      <EnvelopeCover
        recipientLabel={settings.recipientLabel || 'Neonate'}
        title={letter.title}
        publishedAt={letter.publishedAt}
        redditPostTitle={letter.redditPost.title}
        onOpen={handleOpenEnvelope}
      />
    );
  }

  const shareUrl = buildPublicShareUrl(letter.slug, settings.siteBaseUrl);
  const safeHtml = sanitizeHtml(letter.contentHtml);
  const safeRedditUrl = sanitizeExternalUrl(letter.redditPost.url);
  const safeImageUrl = sanitizeExternalUrl(letter.redditPost.imageUrl);
  const hasRedditRef = Boolean(
    letter.redditPost.title ||
      letter.redditPost.content ||
      safeRedditUrl ||
      letter.redditPost.subreddit
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onToast('Letter link copied.', 'success');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast('Could not copy link.', 'error');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: letter.title,
          text: letter.subtitle || letter.excerpt,
          url: shareUrl,
        });
      } catch {
        // User cancelled share sheet
      }
    } else {
      handleCopyLink();
    }
  };

  const sizeClass =
    settings.fontSize === 'small'
      ? 'text-[19px]'
      : settings.fontSize === 'large'
        ? 'text-[23px]'
        : 'text-[21px]';

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <article className="stationery-sheet animate-letter-unfold mx-auto max-w-2xl rounded-xl px-6 py-10 sm:px-12 sm:py-14">
        <header>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-handwritten text-2xl text-[var(--ps-sheet-ink-2)]">
                For {settings.recipientLabel || 'Neonate'},
              </p>
              <p className="mt-0.5 text-xs tracking-[0.04em] text-[var(--ps-sheet-muted)]">
                {formatReadableDate(letter.publishedAt)}
              </p>
            </div>
            <PostmarkStamp dateText={letter.publishedAt} />
          </div>

          <h1 className="mt-5 font-serif-editorial text-4xl font-medium leading-[1.15] tracking-tight text-[var(--ps-sheet-ink)] sm:text-5xl [text-wrap:balance]">
            {letter.title}
          </h1>

          {letter.subtitle && (
            <p className="mt-3 font-serif-editorial italic text-2xl leading-snug text-[var(--ps-sheet-ink-2)]">
              {letter.subtitle}
            </p>
          )}
        </header>

        <NotebookDivider variant="botanical" onPaper className="my-8" />

        {/* Tucked-away folded Reddit note */}
        {hasRedditRef && (
          <section className="mb-9 rounded-lg border border-[var(--ps-sheet-border)] bg-[var(--ps-sheet-slip)]/75 px-5 py-3.5">
            <button
              type="button"
              onClick={() => setRedditExpanded((v) => !v)}
              aria-expanded={redditExpanded}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <div className="min-w-0">
                <p className="font-handwritten text-lg leading-none text-[var(--ps-sheet-accent)]">
                  Written in reply to
                </p>
                <p className="mt-1 truncate text-sm text-[var(--ps-sheet-ink)]">
                  {letter.redditPost.title || 'your Reddit post'}
                </p>
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-[var(--ps-sheet-accent)] whitespace-nowrap shrink-0">
                <span>{redditExpanded ? 'Fold' : 'Read note'}</span>
                {redditExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </span>
            </button>

            {redditExpanded && (
              <div className="mt-4 border-t border-[var(--ps-sheet-border)] pt-4 text-sm leading-relaxed text-[var(--ps-sheet-ink-2)]">
                {(letter.redditPost.subreddit ||
                  letter.redditPost.username ||
                  letter.redditPost.postDate) && (
                  <p className="mb-2.5 text-xs text-[var(--ps-sheet-muted)]">
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
                  <p className="whitespace-pre-line">
                    {letter.redditPost.content}
                  </p>
                )}
                {safeImageUrl && !imageBroken && (
                  <img
                    src={safeImageUrl}
                    alt="Original post attachment"
                    referrerPolicy="no-referrer"
                    onError={() => setImageBroken(true)}
                    className="mt-3 max-h-72 rounded-lg border border-[var(--ps-sheet-border)] object-contain"
                  />
                )}
                {safeRedditUrl && (
                  <a
                    href={safeRedditUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--ps-sheet-accent)] hover:underline"
                  >
                    <span>View original post on Reddit</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </section>
        )}

        <div
          className={`font-serif-editorial ${sizeClass} letter-ink-prose ${
            settings.showDropCaps ? 'postscript-dropcap' : ''
          }`}
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />

        <footer className="mt-14 border-t border-[var(--ps-sheet-border)] pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <WaxSealMark className="text-[var(--ps-seal)]" />
              <p className="font-handwritten text-2xl text-[var(--ps-sheet-ink-2)]">
                End of letter.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <BotanicalSprig className="mr-1 hidden h-9 w-9 text-[var(--ps-olive)] opacity-75 sm:block" />
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--ps-sheet-border)] px-3 py-1.5 text-xs font-medium text-[var(--ps-sheet-ink-2)] hover:bg-[var(--ps-sheet-slip)] hover:text-[var(--ps-sheet-ink)] whitespace-nowrap shrink-0"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-[var(--ps-sheet-accent)]" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copied ? 'Copied' : 'Copy link'}</span>
              </button>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--ps-sheet-border)] px-3 py-1.5 text-xs font-medium text-[var(--ps-sheet-ink-2)] hover:bg-[var(--ps-sheet-slip)] hover:text-[var(--ps-sheet-ink)] whitespace-nowrap shrink-0"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share</span>
                </button>
              )}
            </div>
          </div>
        </footer>
      </article>

      <div className="mt-8 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => onNavigate({ name: 'reading-room' })}
          className="text-xs text-[var(--ps-text-muted)] transition-colors hover:text-[var(--ps-accent)]"
        >
          ← All letters in the Reading Room
        </button>
        <span className="text-[var(--ps-border)]" aria-hidden="true">
          ·
        </span>
        <button
          type="button"
          onClick={() => setOpened(false)}
          className="text-xs text-[var(--ps-text-muted)] transition-colors hover:text-[var(--ps-accent)]"
        >
          Refold envelope
        </button>
      </div>
    </div>
  );
};
