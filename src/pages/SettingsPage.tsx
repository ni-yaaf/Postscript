import React, { useRef, useState } from 'react';
import {
  Download,
  Moon,
  Plus,
  Sun,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type {
  AppSettings,
  EditorFontOption,
  FavouritePassage,
  FontSizeOption,
  Letter,
  PaperStyleOption,
} from '../types/letter';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  createBackupPayload,
  parseAndValidateBackupJson,
  type ParsedImportResult,
} from '../utils/storage';
import {
  createPublicationZipBlob,
  triggerDownload,
} from '../utils/publishing';

interface SettingsPageProps {
  settings: AppSettings;
  letters: Letter[];
  passages: FavouritePassage[];
  onUpdateSettings: (next: AppSettings) => void;
  onImportData: (
    data: ParsedImportResult,
    mode: 'merge' | 'replace'
  ) => void;
  onClearAllData: () => void;
  onToast: (text: string, tone?: 'neutral' | 'success' | 'error') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  letters,
  passages,
  onUpdateSettings,
  onImportData,
  onClearAllData,
  onToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [newTag, setNewTag] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] =
    useState<ParsedImportResult | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newTag.trim();
    if (!cleaned) return;
    if (settings.tags.includes(cleaned)) {
      onToast('That category already exists.', 'neutral');
      return;
    }
    onUpdateSettings({ ...settings, tags: [...settings.tags, cleaned] });
    setNewTag('');
    onToast(`Added category "${cleaned}".`, 'success');
  };

  const handleRemoveTag = (tag: string) => {
    onUpdateSettings({
      ...settings,
      tags: settings.tags.filter((t) => t !== tag),
    });
  };

  const handleExportBackup = () => {
    const payload = createBackupPayload(letters, passages, settings);
    const stamp = new Date().toISOString().slice(0, 10);
    triggerDownload(
      JSON.stringify(payload, null, 2),
      `postscript-backup-${stamp}.json`,
      'application/json;charset=utf-8'
    );
    onToast('Full notebook JSON backup downloaded.', 'success');
  };

  const handleDownloadFullPackage = async () => {
    try {
      const { blob, summary } = await createPublicationZipBlob(letters, {
        recipientLabel: settings.recipientLabel,
        paperStyle: settings.paperStyle,
        showDropCaps: settings.showDropCaps,
      });
      const stamp = new Date().toISOString().slice(0, 10);
      triggerDownload(blob, `postscript-public-site-${stamp}.zip`);
      onToast(
        `Publication package downloaded (${summary.includedLetters.length} public letter${
          summary.includedLetters.length === 1 ? '' : 's'
        }).`,
        'success'
      );
    } catch {
      onToast('Could not build publication package.', 'error');
    }
  };

  const handleFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseAndValidateBackupJson(text);
      if (parsed.ok === false) {
        setImportError(parsed.error);
        onToast(parsed.error, 'error');
      } else {
        setPendingImport(parsed);
      }
    } catch {
      setImportError('Could not read the selected file.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="border-b border-[var(--ps-border)] pb-6">
        <p className="font-handwritten text-xl text-[var(--ps-accent)]">
          Desk &amp; Stationery
        </p>
        <h1 className="mt-1 font-serif-editorial text-4xl font-medium text-[var(--ps-text)]">
          Settings
        </h1>
      </div>

      <div className="mt-8 space-y-10">
        {/* Appearance & Stationery */}
        <section className="rounded-xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-6">
          <h2 className="font-serif-editorial text-2xl font-medium text-[var(--ps-text)]">
            Stationery &amp; Typography
          </h2>
          <div className="mt-5 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--ps-text)]">
                  Desk atmosphere
                </p>
                <p className="text-xs text-[var(--ps-text-muted)]">
                  Dark espresso journal desk is the default atmosphere.
                </p>
              </div>
              <div className="inline-flex rounded-lg bg-[var(--ps-bg-secondary)] p-1">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({ ...settings, theme: 'dark' })
                  }
                  className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    settings.theme === 'dark'
                      ? 'bg-[var(--ps-surface)] text-[var(--ps-accent)] shadow-sm'
                      : 'text-[var(--ps-text-secondary)]'
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  <span>Dark Desk</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({ ...settings, theme: 'light' })
                  }
                  className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    settings.theme === 'light'
                      ? 'bg-[var(--ps-surface)] text-[var(--ps-accent)] shadow-sm'
                      : 'text-[var(--ps-text-secondary)]'
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  <span>Daylight</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--ps-border-subtle)] pt-5">
              <div>
                <p className="text-sm font-medium text-[var(--ps-text)]">
                  Letter paper surface
                </p>
                <p className="text-xs text-[var(--ps-text-muted)]">
                  Choose warm cream stationery sheets or low-glare dark paper.
                </p>
              </div>
              <div className="inline-flex rounded-lg bg-[var(--ps-bg-secondary)] p-1">
                {(
                  [
                    { id: 'cream', label: 'Cream Parchment' },
                    { id: 'dark', label: 'Dark Candlelight' },
                  ] as Array<{ id: PaperStyleOption; label: string }>
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ ...settings, paperStyle: opt.id })
                    }
                    className={`min-h-[36px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      settings.paperStyle === opt.id
                        ? 'bg-[var(--ps-surface)] text-[var(--ps-accent)] shadow-sm'
                        : 'text-[var(--ps-text-secondary)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--ps-border-subtle)] pt-5">
              <div>
                <p className="text-sm font-medium text-[var(--ps-text)]">
                  Reading &amp; editor font size
                </p>
                <p className="text-xs text-[var(--ps-text-muted)]">
                  Adjust comfort for long writing sessions.
                </p>
              </div>
              <div className="inline-flex rounded-lg bg-[var(--ps-bg-secondary)] p-1">
                {(['small', 'medium', 'large'] as FontSizeOption[]).map(
                  (size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ ...settings, fontSize: size })
                      }
                      className={`min-h-[36px] rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                        settings.fontSize === size
                          ? 'bg-[var(--ps-surface)] text-[var(--ps-accent)] shadow-sm'
                          : 'text-[var(--ps-text-secondary)]'
                      }`}
                    >
                      {size}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--ps-border-subtle)] pt-5">
              <div>
                <p className="text-sm font-medium text-[var(--ps-text)]">
                  Editor typeface
                </p>
                <p className="text-xs text-[var(--ps-text-muted)]">
                  Choose the voice of your blank page while drafting.
                </p>
              </div>
              <div className="inline-flex rounded-lg bg-[var(--ps-bg-secondary)] p-1">
                {(
                  [
                    { id: 'serif', label: 'Editorial Serif' },
                    { id: 'sans', label: 'Clean Sans' },
                    { id: 'mono', label: 'Typewriter Mono' },
                  ] as Array<{ id: EditorFontOption; label: string }>
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ ...settings, editorFont: opt.id })
                    }
                    className={`min-h-[36px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      settings.editorFont === opt.id
                        ? 'bg-[var(--ps-surface)] text-[var(--ps-accent)] shadow-sm'
                        : 'text-[var(--ps-text-secondary)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--ps-border-subtle)] pt-5">
              <div>
                <p className="text-sm font-medium text-[var(--ps-text)]">
                  Opening drop caps
                </p>
                <p className="text-xs text-[var(--ps-text-muted)]">
                  Display an antique brass initial letter in reader views.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.showDropCaps}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    showDropCaps: e.target.checked,
                  })
                }
                aria-label="Enable opening drop caps"
                className="h-4 w-4 accent-[var(--ps-accent)]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--ps-border-subtle)] pt-5">
              <div>
                <p className="text-sm font-medium text-[var(--ps-text)]">
                  Word counter in editor
                </p>
                <p className="text-xs text-[var(--ps-text-muted)]">
                  Show quiet word count and reading time at the bottom of the
                  sheet.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.showWordCountInEditor}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    showWordCountInEditor: e.target.checked,
                  })
                }
                aria-label="Show word counter in editor"
                className="h-4 w-4 accent-[var(--ps-accent)]"
              />
            </div>
          </div>
        </section>

        {/* Editable Categories */}
        <section className="rounded-xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-6">
          <h2 className="font-serif-editorial text-2xl font-medium text-[var(--ps-text)]">
            Themes &amp; Categories
          </h2>
          <p className="mt-1 text-xs text-[var(--ps-text-muted)]">
            Customize the private labels used to organize letters in your
            journal.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {settings.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ps-border)] bg-[var(--ps-bg-secondary)] px-2.5 py-1 text-xs text-[var(--ps-text)]"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  aria-label={`Remove ${tag}`}
                  className="text-[var(--ps-text-muted)] hover:text-[var(--ps-danger)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddTag} className="mt-4 flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a category…"
              className="min-h-[38px] flex-1 max-w-xs rounded-lg border border-[var(--ps-border)] bg-[var(--ps-bg)] px-3 text-sm text-[var(--ps-text)] focus:border-[var(--ps-accent)] focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--ps-border)] px-3.5 text-xs font-medium text-[var(--ps-text)] hover:bg-[var(--ps-bg-secondary)]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          </form>
        </section>

        {/* Publishing Site URLs */}
        <section className="rounded-xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-6">
          <h2 className="font-serif-editorial text-2xl font-medium text-[var(--ps-text)]">
            GitHub Pages Publishing Links
          </h2>
          <p className="mt-1 text-xs text-[var(--ps-text-muted)]">
            Optional convenience URLs (no tokens or secrets are ever stored).
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-[var(--ps-text-muted)]">
                GitHub Repository URL
              </label>
              <input
                type="url"
                value={settings.githubRepoUrl}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    githubRepoUrl: e.target.value,
                  })
                }
                placeholder="https://github.com/username/postscript"
                className="mt-1.5 w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-bg)] px-3 py-2 text-sm text-[var(--ps-text)] focus:border-[var(--ps-accent)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--ps-text-muted)]">
                Public GitHub Pages URL
              </label>
              <input
                type="url"
                value={settings.siteBaseUrl}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    siteBaseUrl: e.target.value,
                  })
                }
                placeholder="https://username.github.io/postscript"
                className="mt-1.5 w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-bg)] px-3 py-2 text-sm text-[var(--ps-text)] focus:border-[var(--ps-accent)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--ps-text-muted)]">
                Recipient Name / Salutation
              </label>
              <input
                type="text"
                value={settings.recipientLabel}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    recipientLabel: e.target.value,
                  })
                }
                placeholder="Neonate"
                className="mt-1.5 w-full rounded-lg border border-[var(--ps-border)] bg-[var(--ps-bg)] px-3 py-2 text-sm text-[var(--ps-text)] focus:border-[var(--ps-accent)] focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Data Backup & Import */}
        <section className="rounded-xl border border-[var(--ps-border)] bg-[var(--ps-surface)] p-6">
          <h2 className="font-serif-editorial text-2xl font-medium text-[var(--ps-text)]">
            Data Backup, Import &amp; Publication Package
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--ps-text-secondary)]">
            Private drafts, saved passages, and preferences live locally in your
            browser&apos;s storage. Clearing browser data or switching devices
            will erase private drafts unless you export a JSON backup first.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExportBackup}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[var(--ps-accent)] px-4 py-2 text-xs font-medium text-[#14110F] hover:bg-[var(--ps-accent-hover)]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export All Data (JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-[var(--ps-border)] px-4 py-2 text-xs font-medium text-[var(--ps-text)] hover:bg-[var(--ps-bg-secondary)]"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Import JSON Backup</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadFullPackage}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-[var(--ps-border)] px-4 py-2 text-xs font-medium text-[var(--ps-text-secondary)] hover:text-[var(--ps-text)]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Publication Package (.zip)</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileSelected}
              className="hidden"
            />
          </div>

          {importError && (
            <p className="mt-4 rounded-lg border border-[var(--ps-danger)]/40 bg-[var(--ps-danger)]/10 px-4 py-2.5 text-xs text-[var(--ps-danger)]">
              {importError}
            </p>
          )}

          <div className="mt-6 border-t border-[var(--ps-border-subtle)] pt-5">
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--ps-border)] px-3.5 py-1.5 text-xs font-medium text-[var(--ps-danger)] hover:bg-[var(--ps-bg-secondary)]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear All Local Data</span>
            </button>
          </div>
        </section>

        {/* About POSTSCRIPT */}
        <section className="rounded-xl border border-[var(--ps-border)] bg-[var(--ps-bg-secondary)] p-6">
          <h2 className="font-serif-editorial text-2xl font-medium text-[var(--ps-text)]">
            About Postscript
          </h2>
          <p className="mt-2 font-serif-editorial italic text-lg text-[var(--ps-text-secondary)]">
            “Some words deserve more than a comment.”
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ps-text-secondary)]">
            Postscript is a handcrafted digital correspondence journal built to
            give thoughtful, long-form letters a quiet place to exist—hosted
            entirely free without accounts, tracking, or paid servers.
          </p>
        </section>
      </div>

      <ConfirmModal
        open={Boolean(pendingImport)}
        title="Import Postscript backup"
        description={
          pendingImport
            ? `Validated ${pendingImport.letters.length} letter(s) and ${pendingImport.passages.length} saved passage(s)${
                pendingImport.skippedCount > 0
                  ? ` (${pendingImport.skippedCount} malformed item(s) skipped)`
                  : ''
              }. Choose whether to merge into your current journal or replace all local data.`
            : ''
        }
        confirmLabel="Merge with Existing"
        secondaryAction={{
          label: 'Replace All Local Data',
          onClick: () => {
            if (pendingImport) {
              onImportData(pendingImport, 'replace');
              setPendingImport(null);
            }
          },
        }}
        onCancel={() => setPendingImport(null)}
        onConfirm={() => {
          if (pendingImport) {
            onImportData(pendingImport, 'merge');
            setPendingImport(null);
          }
        }}
      />

      <ConfirmModal
        open={confirmClear}
        title="Clear all local application data?"
        description="This permanently erases all local drafts, saved passages, and custom settings from this browser. Export a JSON backup first if you wish to keep them."
        confirmLabel="Clear Everything"
        destructive
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          onClearAllData();
          setConfirmClear(false);
        }}
      />
    </div>
  );
};
