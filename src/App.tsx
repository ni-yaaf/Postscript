import { useCallback, useEffect, useMemo, useState } from 'react';
import { DeskLayout } from './components/DeskLayout';
import { ReadingRoomLayout } from './components/ReadingRoomLayout';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { useRouter } from './hooks/useRouter';
import { EditorPage } from './pages/EditorPage';
import { LetterReaderPage } from './pages/LetterReaderPage';
import { LettersDeskPage } from './pages/LettersDeskPage';
import { PassagesPage } from './pages/PassagesPage';
import { PublicLetterPage } from './pages/PublicLetterPage';
import { PublishModal } from './pages/PublishModal';
import { ReadingRoomIndexPage } from './pages/ReadingRoomIndexPage';
import { SettingsPage } from './pages/SettingsPage';
import type {
  AppSettings,
  FavouritePassage,
  Letter,
  PublicLetter,
  PublicLettersIndex,
} from './types/letter';
import { letterToPublicLetter } from './utils/publishing';
import {
  clearAllLocalData,
  DEFAULT_SETTINGS,
  loadInitialData,
  saveLetters,
  savePassages,
  saveSettings,
  type ParsedImportResult,
} from './utils/storage';
import { ensureUniqueSlug, slugify } from './utils/text';

export default function App() {
  const { route, navigate } = useRouter();
  const initial = useMemo(() => loadInitialData(), []);

  const [letters, setLetters] = useState<Letter[]>(initial.letters);
  const [passages, setPassages] = useState<FavouritePassage[]>(
    initial.passages
  );
  const [settings, setSettings] = useState<AppSettings>(initial.settings);
  const [publicLetters, setPublicLetters] = useState<PublicLetter[]>([]);
  const [publishTarget, setPublishTarget] = useState<Letter | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (text: string, tone: ToastMessage['tone'] = 'neutral') => {
      const id = `tst_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, text, tone }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (initial.storageError) {
      addToast(initial.storageError, 'error');
    }
  }, [initial.storageError, addToast]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
    root.dataset.paper = settings.paperStyle || 'cream';
  }, [settings.theme, settings.paperStyle]);

  useEffect(() => {
    let cancelled = false;
    const base = import.meta.env.BASE_URL || '/';
    fetch(`${base}data/letters.json`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PublicLettersIndex | null) => {
        if (cancelled || !data || !Array.isArray(data.letters)) return;
        setPublicLetters(data.letters);

        const liveSlugs = new Set(data.letters.map((l) => l.slug));
        setLetters((prev) => {
          let changed = false;
          const next = prev.map((l) => {
            if (l.status === 'pending' && liveSlugs.has(l.slug)) {
              changed = true;
              return {
                ...l,
                status: 'published' as const,
                publication: {
                  ...l.publication,
                  verifiedLiveAt: new Date().toISOString(),
                  previouslyPublishedSlug: l.slug,
                },
              };
            }
            return l;
          });
          if (changed) saveLetters(next);
          return changed ? next : prev;
        });
      })
      .catch(() => {
        // Static public index optional when offline
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persistLetters = useCallback(
    (updater: (prev: Letter[]) => Letter[]) => {
      setLetters((prev) => {
        const next = updater(prev);
        const err = saveLetters(next);
        if (err) addToast(err, 'error');
        return next;
      });
    },
    [addToast]
  );

  const handleSaveLetter = useCallback(
    (updated: Letter) => {
      persistLetters((prev) => {
        const idx = prev.findIndex((l) => l.id === updated.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = updated;
          return copy;
        }
        return [updated, ...prev];
      });
    },
    [persistLetters]
  );

  const handleDuplicateLetter = useCallback(
    (source: Letter) => {
      const now = new Date().toISOString();
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `ltr_${Date.now()}`;
      const newTitle = source.title
        ? `${source.title} (Copy)`
        : 'Untitled Letter (Copy)';
      const slug = ensureUniqueSlug(newTitle, letters);
      const copy: Letter = {
        ...source,
        id,
        title: newTitle,
        slug,
        createdAt: now,
        updatedAt: now,
        status: 'draft',
        publication: {
          publishedAt: null,
          lastPackagedAt: null,
          verifiedLiveAt: null,
          previouslyPublishedSlug: null,
        },
      };
      persistLetters((prev) => [copy, ...prev]);
      addToast('Letter duplicated as a new draft.', 'success');
    },
    [letters, persistLetters, addToast]
  );

  const handleDeleteLetter = useCallback(
    (id: string) => {
      persistLetters((prev) => prev.filter((l) => l.id !== id));
      addToast('Letter deleted.', 'neutral');
    },
    [persistLetters, addToast]
  );

  const handleUnpublishLetter = useCallback(
    (letter: Letter) => {
      const updated: Letter = {
        ...letter,
        status: 'unpublished',
        updatedAt: new Date().toISOString(),
        publication: {
          ...letter.publication,
          previouslyPublishedSlug:
            letter.publication.previouslyPublishedSlug || letter.slug,
        },
      };
      handleSaveLetter(updated);
      addToast(
        'Marked unpublished locally. Download a new publication package to update GitHub.',
        'neutral'
      );
    },
    [handleSaveLetter, addToast]
  );

  const handleMarkPackaged = useCallback(
    (packagedIds: string[]) => {
      const now = new Date().toISOString();
      const idSet = new Set(packagedIds);
      persistLetters((prev) =>
        prev.map((l) => {
          if (!idSet.has(l.id)) return l;
          const cleanSlug = slugify(l.slug || l.title);
          return {
            ...l,
            slug: cleanSlug,
            status: 'pending',
            publication: {
              ...l.publication,
              publishedAt: l.publication.publishedAt || now,
              lastPackagedAt: now,
              previouslyPublishedSlug: cleanSlug,
            },
          };
        })
      );
    },
    [persistLetters]
  );

  const handleMarkVerifiedLive = useCallback(
    (liveSlugs: string[]) => {
      const slugSet = new Set(liveSlugs);
      const now = new Date().toISOString();
      persistLetters((prev) =>
        prev.map((l) =>
          slugSet.has(l.slug) &&
          (l.status === 'pending' ||
            l.status === 'ready' ||
            l.status === 'updated')
            ? {
                ...l,
                status: 'published',
                publication: {
                  ...l.publication,
                  verifiedLiveAt: now,
                  previouslyPublishedSlug: l.slug,
                },
              }
            : l
        )
      );
    },
    [persistLetters]
  );

  const handleAddPassage = useCallback(
    (passage: FavouritePassage) => {
      setPassages((prev) => {
        const next = [passage, ...prev];
        const err = savePassages(next);
        if (err) addToast(err, 'error');
        return next;
      });
      addToast('Passage saved privately.', 'success');
    },
    [addToast]
  );

  const handleDeletePassage = useCallback(
    (id: string) => {
      setPassages((prev) => {
        const next = prev.filter((p) => p.id !== id);
        savePassages(next);
        return next;
      });
      addToast('Passage removed.', 'neutral');
    },
    [addToast]
  );

  const handleUpdateSettings = useCallback(
    (next: AppSettings) => {
      setSettings(next);
      const err = saveSettings(next);
      if (err) addToast(err, 'error');
    },
    [addToast]
  );

  const handleImportData = useCallback(
    (data: ParsedImportResult, mode: 'merge' | 'replace') => {
      if (mode === 'replace') {
        setLetters(data.letters);
        setPassages(data.passages);
        saveLetters(data.letters);
        savePassages(data.passages);
        if (data.settings) {
          setSettings(data.settings);
          saveSettings(data.settings);
        }
        addToast(
          `Restored ${data.letters.length} letter(s) from backup.`,
          'success'
        );
        return;
      }

      setLetters((prev) => {
        const existingIds = new Set(prev.map((l) => l.id));
        const additions = data.letters.filter((l) => !existingIds.has(l.id));
        const merged = [...additions, ...prev];
        saveLetters(merged);
        return merged;
      });

      setPassages((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const additions = data.passages.filter((p) => !existingIds.has(p.id));
        const merged = [...additions, ...prev];
        savePassages(merged);
        return merged;
      });

      addToast('Backup merged safely with your existing notebook.', 'success');
    },
    [addToast]
  );

  const handleClearAllData = useCallback(() => {
    clearAllLocalData();
    setLetters([]);
    setPassages([]);
    setSettings({ ...DEFAULT_SETTINGS });
    addToast('All local notebook data cleared.', 'neutral');
  }, [addToast]);

  // Public Reading Room Views
  if (route.name === 'reading-room' || route.name === 'desk-preview') {
    const isAuthorPreview = route.name === 'desk-preview';
    return (
      <>
        <ReadingRoomLayout
          showBackToCollection={false}
          isAuthorPreview={isAuthorPreview}
          onNavigate={navigate}
        >
          <ReadingRoomIndexPage
            publicLetters={publicLetters}
            localLetters={letters}
            isAuthorPreview={isAuthorPreview}
            recipientLabel={settings.recipientLabel}
            onNavigate={navigate}
          />
        </ReadingRoomLayout>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  if (route.name === 'public-letter') {
    const isGitHubPages =
      typeof window !== 'undefined' &&
      window.location.hostname.endsWith('.github.io');
    const liveMatch = publicLetters.find((l) => l.slug === route.slug);
    const localPreviewMatch = !isGitHubPages
      ? letters.find(
          (l) => l.slug === route.slug && l.status !== 'unpublished'
        )
      : undefined;
    const resolvedLetter =
      liveMatch ||
      (localPreviewMatch ? letterToPublicLetter(localPreviewMatch) : undefined);

    return (
      <>
        <ReadingRoomLayout
          showBackToCollection={true}
          isAuthorPreview={Boolean(!liveMatch && localPreviewMatch)}
          onNavigate={navigate}
        >
          <PublicLetterPage
            letter={resolvedLetter}
            settings={settings}
            onNavigate={navigate}
            onToast={addToast}
          />
        </ReadingRoomLayout>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // Author's Private Writing Desk Views
  return (
    <>
      <DeskLayout currentRoute={route} onNavigate={navigate}>
        {(route.name === 'desk-home' || route.name === 'desk-archive') && (
          <LettersDeskPage
            letters={letters}
            availableTags={settings.tags}
            recipientLabel={settings.recipientLabel}
            onNavigate={navigate}
            onOpenPublishModal={setPublishTarget}
            onDuplicateLetter={handleDuplicateLetter}
            onDeleteLetter={handleDeleteLetter}
            onToast={addToast}
          />
        )}

        {route.name === 'desk-new' && (
          <EditorPage
            allLetters={letters}
            settings={settings}
            onSaveLetter={handleSaveLetter}
            onOpenPublishModal={setPublishTarget}
            onNavigate={navigate}
            onToast={addToast}
          />
        )}

        {route.name === 'desk-edit' && (
          <EditorPage
            letterId={route.id}
            allLetters={letters}
            settings={settings}
            onSaveLetter={handleSaveLetter}
            onOpenPublishModal={setPublishTarget}
            onNavigate={navigate}
            onToast={addToast}
          />
        )}

        {route.name === 'desk-letter' && (
          <LetterReaderPage
            letter={letters.find((l) => l.id === route.id)}
            settings={settings}
            onNavigate={navigate}
            onOpenPublishModal={setPublishTarget}
            onUnpublishLetter={handleUnpublishLetter}
            onSavePassage={handleAddPassage}
            onToast={addToast}
          />
        )}

        {route.name === 'desk-passages' && (
          <PassagesPage
            passages={passages}
            letters={letters}
            onAddPassage={handleAddPassage}
            onDeletePassage={handleDeletePassage}
            onNavigate={navigate}
          />
        )}

        {route.name === 'desk-settings' && (
          <SettingsPage
            settings={settings}
            letters={letters}
            passages={passages}
            onUpdateSettings={handleUpdateSettings}
            onImportData={handleImportData}
            onClearAllData={handleClearAllData}
            onToast={addToast}
          />
        )}
      </DeskLayout>

      <PublishModal
        letter={publishTarget}
        allLetters={letters}
        settings={settings}
        onClose={() => setPublishTarget(null)}
        onMarkPackaged={handleMarkPackaged}
        onMarkVerifiedLive={handleMarkVerifiedLive}
        onToast={addToast}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
