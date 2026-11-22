import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  RefreshCw,
  X,
} from 'lucide-react';
import type { AppSettings, Letter, PublicLettersIndex } from '../types/letter';
import { PostmarkStamp } from '../components/Ornament';
import {
  buildPublicLettersIndex,
  buildPublicShareUrl,
  createPublicationZipBlob,
  letterToPublicLetter,
  triggerDownload,
} from '../utils/publishing';
import { sanitizeExternalUrl, sanitizeHtml } from '../utils/sanitize';
import { formatReadableDate, slugify } from '../utils/text';

interface PublishModalProps {
  letter: Letter | null;
  allLetters: Letter[];
  settings: AppSettings;
  onClose: () => void;
  onMarkPackaged: (packagedLetterIds: string[]) => void;
  onMarkVerifiedLive: (slugs: string[]) => void;
  onToast: (text: string, tone?: 'neutral' | 'success' | 'error') => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  letter,
  allLetters,
  settings,
  onClose,
  onMarkPackaged,
  onMarkVerifiedLive,
  onToast,
}) => {
  const [step, setStep] = useState<'preview' | 'package'>('preview');
  const [confirmed, setConfirmed] = useState(false);
  const [packaging, setPackaging] = useState(false);
  const [checkingLive, setCheckingLive] = useState(false);
  const [liveStatusMsg, setLiveStatusMsg] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (!letter) return;
    setStep('preview');
    setConfirmed(false);
    setLiveStatusMsg(null);
  }, [letter]);

  if (!letter) return null;

  const targetSlug = slugify(letter.slug || letter.title);
  const shareUrl = buildPublicShareUrl(targetSlug, settings.siteBaseUrl);

  const simulatedLetters = allLetters.map((l) =>
    l.id === letter.id
      ? {
          ...l,
          slug: targetSlug,
          status: (l.status === 'published' ? 'updated' : 'ready') as Letter['status'],
          publication: {
            ...l.publication,
            publishedAt: l.publication.publishedAt || new Date().toISOString(),
          },
        }
      : l
  );
  if (!simulatedLetters.some((l) => l.id === letter.id)) {
    simulatedLetters.push({
      ...letter,
      slug: targetSlug,
      status: 'ready',
      publication: {
        ...letter.publication,
        publishedAt: letter.publication.publishedAt || new Date().toISOString(),
      },
    });
  }

  const publicPreview = letterToPublicLetter({
    ...letter,
    slug: targetSlug,
  });
  const safeHtml = sanitizeHtml(publicPreview.contentHtml);
  const publicIndex = buildPublicLettersIndex(simulatedLetters);

  const unpublishedToRemove = simulatedLetters.filter(
    (l) =>
      l.status === 'unpublished' &&
      l.publication.previouslyPublishedSlug &&
      !publicIndex.letters.some(
        (p) => p.slug === l.publication.previouslyPublishedSlug
      )
  );

  const handleDownloadZip = async () => {
    setPackaging(true);
    try {
      const { blob } = await createPublicationZipBlob(simulatedLetters, {
        recipientLabel: settings.recipientLabel,
        paperStyle: settings.paperStyle,
        showDropCaps: settings.showDropCaps,
      });
      triggerDownload(blob, `postscript-publish-${targetSlug}.zip`);
      const includedIds = simulatedLetters
        .filter((l) =>
          publicIndex.letters.some((p) => p.slug === slugify(l.slug || l.title))
        )
        .map((l) => l.id);
      onMarkPackaged(includedIds);
      setStep('package');
      onToast(
        'Publication package downloaded. Upload it to GitHub to go live.',
        'success'
      );
    } catch {
      onToast('Failed to generate publication ZIP package.', 'error');
    } finally {
      setPackaging(false);
    }
  };

  const handleDownloadJsonOnly = () => {
    const json = JSON.stringify(publicIndex, null, 2) + '\n';
    triggerDownload(json, 'letters.json', 'application/json;charset=utf-8');
    const includedIds = simulatedLetters
      .filter((l) =>
        publicIndex.letters.some((p) => p.slug === slugify(l.slug || l.title))
      )
      .map((l) => l.id);
    onMarkPackaged(includedIds);
    setStep('package');
    onToast('Downloaded public letters.json.', 'success');
  };

  const handleCopyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedUrl(true);
      onToast('Shareable link copied.', 'success');
      window.setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      onToast('Could not copy link.', 'error');
    }
  };

  const handleCheckLive = async () => {
    setCheckingLive(true);
    setLiveStatusMsg(null);
    try {
      const base = import.meta.env.BASE_URL || '/';
      const res = await fetch(`${base}data/letters.json?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        setLiveStatusMsg('Could not reach live letters.json yet.');
        return;
      }
      const data = (await res.json()) as PublicLettersIndex;
      const found = Array.isArray(data.letters)
        ? data.letters.find((item) => item.slug === targetSlug)
        : undefined;

      if (found) {
        onMarkVerifiedLive(data.letters.map((l) => l.slug));
        setLiveStatusMsg(
          `Verified live in the Reading Room ("${found.title}").`
        );
      } else {
        setLiveStatusMsg(
          'Not yet live in data/letters.json. After committing to GitHub, wait ~60 seconds and check again.'
        );
      }
    } catch {
      setLiveStatusMsg('Could not verify live deployment right now.');
    } finally {
      setCheckingLive(false);
    }
  };

  const safeRepoUrl = sanitizeExternalUrl(settings.githubRepoUrl);
  const githubUploadUrl = safeRepoUrl
    ? `${safeRepoUrl.replace(/\/+$/, '')}/upload/main`
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[var(--ps-border)] bg-[var(--ps-surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--ps-border)] px-6 py-4">
          <div>
            <p className="font-handwritten text-lg text-[var(--ps-accent)]">
              {step === 'preview'
                ? 'Step 1 · Review Letter Sheet'
                : 'Step 2 · Send & Share'}
            </p>
            <h2
              id="publish-modal-title"
              className="font-serif-editorial text-2xl font-medium text-[var(--ps-text)]"
            >
              {step === 'preview'
                ? `Seal this letter for ${settings.recipientLabel || 'Neonate'}`
                : 'Package ready to upload'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--ps-text-muted)] hover:bg-[var(--ps-surface-elevated)] hover:text-[var(--ps-text)]"
            aria-label="Close publish dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 'preview' ? (
            <div className="space-y-6">
              <div className="rounded-lg border border-[var(--ps-border)] bg-[var(--ps-bg-secondary)] p-4 text-xs leading-relaxed text-[var(--ps-text-secondary)]">
                To keep your private drafts safe on free static hosting,
                publishing creates a downloadable package that you commit to
                your GitHub repository. Drafts are never included.
              </div>

              <div className="rounded-lg border border-[var(--ps-border)] bg-[var(--ps-bg)] p-4">
                <p className="text-xs text-[var(--ps-text-muted)]">
                  Permanent link once deployed
                </p>
                <p className="mt-1 break-all font-mono-tabular text-xs text-[var(--ps-accent)]">
                  {shareUrl}
                </p>
              </div>

              {/* Parchment Stationery Preview */}
              <div className="stationery-sheet rounded-xl p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-handwritten text-xl text-[var(--ps-sheet-ink-2)]">
                      For {settings.recipientLabel || 'Neonate'},
                    </p>
                    <p className="text-xs text-[var(--ps-sheet-muted)]">
                      {formatReadableDate(publicPreview.publishedAt)}
                    </p>
                  </div>
                  <PostmarkStamp dateText={publicPreview.publishedAt} />
                </div>
                <h3 className="mt-3 font-serif-editorial text-3xl font-medium text-[var(--ps-sheet-ink)]">
                  {publicPreview.title}
                </h3>
                {publicPreview.subtitle && (
                  <p className="mt-1.5 font-serif-editorial italic text-xl text-[var(--ps-sheet-ink-2)]">
                    {publicPreview.subtitle}
                  </p>
                )}

                {publicPreview.redditPost.title && (
                  <div className="mt-5 rounded-lg border border-[var(--ps-sheet-border)] bg-[var(--ps-sheet-slip)]/75 px-4 py-3 text-xs text-[var(--ps-sheet-ink-2)]">
                    <span className="text-[var(--ps-sheet-muted)]">
                      Written in reply to:{' '}
                    </span>
                    <span className="font-medium text-[var(--ps-sheet-ink)]">
                      {publicPreview.redditPost.title}
                    </span>
                  </div>
                )}

                <div
                  className="mt-6 max-h-64 overflow-y-auto border-t border-[var(--ps-sheet-border)] pt-5 font-serif-editorial text-lg letter-ink-prose"
                  dangerouslySetInnerHTML={{ __html: safeHtml }}
                />
              </div>

              <div className="rounded-lg border border-[var(--ps-border)] bg-[var(--ps-bg-secondary)] p-4 text-xs text-[var(--ps-text-secondary)]">
                <p className="font-medium text-[var(--ps-text)]">
                  Files in this package ({publicIndex.letters.length} published{' '}
                  {publicIndex.letters.length === 1 ? 'letter' : 'letters'}):
                </p>
                <ul className="mt-2 space-y-1 font-mono-tabular text-[11px] text-[var(--ps-text-muted)]">
                  <li>• public/data/letters.json</li>
                  <li>• public/letters/{targetSlug}/index.html</li>
                </ul>

                {unpublishedToRemove.length > 0 && (
                  <p className="mt-3 text-[var(--ps-danger)]">
                    Note: {unpublishedToRemove.length} unpublished letter(s)
                    will be removed from the public index. Check
                    PUBLISH_MANIFEST.txt inside the ZIP for folders to delete.
                  </p>
                )}

                <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm text-[var(--ps-text)]">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[var(--ps-accent)]"
                  />
                  <span>
                    I have read this preview and want to prepare it for{' '}
                    {settings.recipientLabel || 'Neonate'}.
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-lg border border-[var(--ps-border)] bg-[var(--ps-bg-secondary)] p-5">
                <p className="font-serif-editorial text-xl font-medium text-[var(--ps-text)]">
                  Status: Pending GitHub deployment
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--ps-text-secondary)]">
                  Upload your downloaded files to make this letter live:
                </p>
                <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-[var(--ps-text-secondary)]">
                  <li>
                    Unzip{' '}
                    <span className="font-mono-tabular text-xs text-[var(--ps-text)]">
                      postscript-publish-{targetSlug}.zip
                    </span>
                    .
                  </li>
                  <li>
                    Open your repository on GitHub and select{' '}
                    <strong>Add file → Upload files</strong>.
                  </li>
                  <li>
                    Drag the unzipped{' '}
                    <span className="font-mono-tabular text-xs text-[var(--ps-text)]">
                      public
                    </span>{' '}
                    folder onto GitHub and click <strong>Commit changes</strong>.
                  </li>
                  <li>
                    Wait ~1 minute for GitHub Actions to rebuild, then send the
                    link below.
                  </li>
                </ol>

                {githubUploadUrl && (
                  <a
                    href={githubUploadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ps-accent)] hover:underline"
                  >
                    <span>Open GitHub Upload Page</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              <div className="rounded-lg border border-[var(--ps-border)] bg-[var(--ps-bg)] p-4">
                <p className="text-xs text-[var(--ps-text-muted)]">
                  Shareable link for {settings.recipientLabel || 'Neonate'}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <code className="flex-1 break-all rounded bg-[var(--ps-surface)] px-2.5 py-1.5 font-mono-tabular text-xs text-[var(--ps-text)]">
                    {shareUrl}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyShareUrl}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--ps-border)] px-3 py-1.5 text-xs font-medium text-[var(--ps-text)] hover:bg-[var(--ps-surface)] whitespace-nowrap shrink-0"
                  >
                    {copiedUrl ? (
                      <Check className="h-3.5 w-3.5 text-[var(--ps-accent)]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copiedUrl ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCheckLive}
                    disabled={checkingLive}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--ps-border)] px-3 py-1.5 text-xs font-medium text-[var(--ps-text-secondary)] hover:text-[var(--ps-text)] disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${checkingLive ? 'animate-spin' : ''}`}
                    />
                    <span>Verify Live Link</span>
                  </button>
                  {liveStatusMsg && (
                    <span className="text-xs text-[var(--ps-text-secondary)]">
                      {liveStatusMsg}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ps-border)] px-6 py-4">
          {step === 'preview' ? (
            <>
              <button
                type="button"
                onClick={handleDownloadJsonOnly}
                disabled={!confirmed || packaging}
                className="min-h-[40px] rounded-lg border border-[var(--ps-border)] px-4 py-2 text-xs font-medium text-[var(--ps-text-secondary)] hover:text-[var(--ps-text)] disabled:opacity-40 whitespace-nowrap shrink-0"
              >
                Download letters.json only
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[40px] rounded-lg border border-[var(--ps-border)] px-4 py-2 text-sm font-medium text-[var(--ps-text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDownloadZip}
                  disabled={!confirmed || packaging}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[var(--ps-accent)] px-4 py-2 text-sm font-medium text-[#14110F] hover:bg-[var(--ps-accent-hover)] disabled:opacity-40 whitespace-nowrap shrink-0"
                >
                  <Download className="h-4 w-4" />
                  <span>
                    {packaging
                      ? 'Preparing…'
                      : 'Download Publication Package (.zip)'}
                  </span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex w-full items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep('preview')}
                className="min-h-[40px] rounded-lg border border-[var(--ps-border)] px-4 py-2 text-xs font-medium text-[var(--ps-text-secondary)]"
              >
                Back to Preview
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[40px] rounded-lg bg-[var(--ps-accent)] px-5 py-2 text-sm font-medium text-[#14110F]"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
