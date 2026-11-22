import type {
  AppSettings,
  FavouritePassage,
  Letter,
  PostscriptBackup,
  PublicationStatus,
  WritingStats,
} from '../types/letter';
import { sanitizeExternalUrl, sanitizeHtml } from './sanitize';
import { countWords, slugify } from './text';

const KEYS = {
  LETTERS: 'postscript_v1_letters',
  PASSAGES: 'postscript_v1_passages',
  SETTINGS: 'postscript_v1_settings',
  INITIALIZED: 'postscript_v1_initialized',
} as const;

export const DEFAULT_TAGS = [
  'Reflection',
  'Comfort',
  'Philosophy',
  'Appreciation',
  'Humour',
  'Advice',
  'Friendship',
  'Miscellaneous',
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  paperStyle: 'cream',
  fontSize: 'medium',
  editorFont: 'serif',
  showDropCaps: true,
  showWordCountInEditor: true,
  githubRepoUrl: '',
  siteBaseUrl: '',
  recipientLabel: 'Neonate',
  tags: DEFAULT_TAGS,
};

export function createEmptyLetter(partial?: Partial<Letter>): Letter {
  const now = new Date().toISOString();
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `ltr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    title: '',
    subtitle: '',
    slug: '',
    contentHtml: '<p></p>',
    tags: [],
    createdAt: now,
    updatedAt: now,
    status: 'draft',
    redditPost: {
      title: '',
      username: 'Neonate',
      subreddit: '',
      url: '',
      postDate: '',
      content: '',
      imageUrl: '',
    },
    publication: {
      publishedAt: null,
      lastPackagedAt: null,
      verifiedLiveAt: null,
      previouslyPublishedSlug: null,
    },
    ...partial,
  };
}

function getStarterDrafts(): { letters: Letter[]; passages: FavouritePassage[] } {
  const now = Date.now();
  const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();
  const yesterday = new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString();

  const letterOneId = 'starter-draft-quiet-hours';
  const letterTwoId = 'starter-draft-small-observances';

  const letters: Letter[] = [
    {
      id: letterOneId,
      title: 'On Midnight Tea and the Art of Not Rushing',
      subtitle: 'A long reply that refused to fit inside a comment box',
      slug: 'on-midnight-tea-and-the-art-of-not-rushing',
      contentHtml:
        '<p>I read what you wrote three times before I even reached for the keyboard, mostly because the best parts of it were tucked quietly between the lines—the way you always do when you are trying not to make a fuss about something that actually mattered quite a bit to you.</p>' +
        '<blockquote>There is a peculiar kindness in allowing someone to take their time arriving at an answer, without tapping your foot at the door.</blockquote>' +
        '<p>People on the internet speak in sprints. Everyone wants to deliver a verdict in two sentences and move on to the next window. Reading your post felt like stepping out of a noisy train station into a small, warm bookshop where nobody asks what you are buying.</p>' +
        '<h2>Three things I noticed while reading</h2>' +
        '<ul><li><p>You always apologize right before you say the most perceptive thing in the entire paragraph.</p></li><li><p>Even when you are tired, your metaphors still have a dry little grin hiding in the corner.</p></li><li><p>You underestimate how rare it is to notice small details and remember them a month later.</p></li></ul>' +
        '<p>So here is a whole page instead of a hasty reply. Put the kettle on, read it whenever the house goes quiet, and never feel obliged to answer in kind.</p>',
      tags: ['Reflection', 'Appreciation'],
      createdAt: twoDaysAgo,
      updatedAt: yesterday,
      status: 'draft',
      redditPost: {
        title: 'Does anyone else feel like the quietest hours after midnight are the only honest ones?',
        username: 'neonate',
        subreddit: 'CasualConversation',
        url: '',
        postDate: 'November 2026',
        content:
          'Not in a dramatic way—I just notice how differently everyone writes once the rush of the afternoon fades. Even small errands feel like distant folklore after midnight.',
        imageUrl: '',
      },
      publication: {
        publishedAt: null,
        lastPackagedAt: null,
        verifiedLiveAt: null,
        previouslyPublishedSlug: null,
      },
    },
    {
      id: letterTwoId,
      title: 'A Field Note on Overthinking Tuesday',
      subtitle: 'Notes on small absurdities and why they matter',
      slug: 'a-field-note-on-overthinking-tuesday',
      contentHtml:
        '<p>If memory serves, you once claimed that Tuesdays have no natural personality of their own—that Monday has its drama, Wednesday has its symmetry, Friday has its relief, and Tuesday merely stands in the hallway holding a lukewarm mug.</p>' +
        '<p>I would like to submit a polite objection. Most of the finest conversations begin on unremarkable days when nobody expected anything grand to happen.</p>' +
        '<p>Keep this as a small reminder whenever a week feels stubbornly ordinary: ordinary days are where most of life actually happens, and you are unusually good at making them worth remembering.</p>',
      tags: ['Humour', 'Friendship'],
      createdAt: twoDaysAgo,
      updatedAt: twoDaysAgo,
      status: 'draft',
      redditPost: {
        title: 'Unpopular opinion: Tuesday is the beige wallpaper of the calendar',
        username: 'neonate',
        subreddit: 'Lighthearted',
        url: '',
        postDate: 'November 2026',
        content:
          'Monday has adrenaline, Friday has optimism, and Tuesday is just there to hold the shelf up.',
        imageUrl: '',
      },
      publication: {
        publishedAt: null,
        lastPackagedAt: null,
        verifiedLiveAt: null,
        previouslyPublishedSlug: null,
      },
    },
  ];

  const passages: FavouritePassage[] = [
    {
      id: 'starter-passage-1',
      letterId: letterOneId,
      letterTitle: 'On Midnight Tea and the Art of Not Rushing',
      passageText:
        'Reading your post felt like stepping out of a noisy train station into a small, warm bookshop where nobody asks what you are buying.',
      note: 'A line to keep close when writing feels rushed.',
      savedAt: yesterday,
    },
  ];

  return { letters, passages };
}

const VALID_STATUSES: PublicationStatus[] = [
  'draft',
  'ready',
  'pending',
  'published',
  'updated',
  'unpublished',
];

export function validateAndNormalizeLetter(raw: unknown): Letter | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id.trim()) return null;

  const title = typeof r.title === 'string' ? r.title : '';
  const subtitle = typeof r.subtitle === 'string' ? r.subtitle : '';
  const contentHtml =
    typeof r.contentHtml === 'string' ? sanitizeHtml(r.contentHtml) : '<p></p>';
  const createdAt =
    typeof r.createdAt === 'string' && !Number.isNaN(Date.parse(r.createdAt))
      ? r.createdAt
      : new Date().toISOString();
  const updatedAt =
    typeof r.updatedAt === 'string' && !Number.isNaN(Date.parse(r.updatedAt))
      ? r.updatedAt
      : createdAt;
  const status: PublicationStatus = VALID_STATUSES.includes(r.status as PublicationStatus)
    ? (r.status as PublicationStatus)
    : 'draft';

  const rawSlug = typeof r.slug === 'string' && r.slug.trim() ? r.slug : title;
  const slug = slugify(rawSlug);

  const tags = Array.isArray(r.tags)
    ? r.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    : [];

  const rawReddit =
    r.redditPost && typeof r.redditPost === 'object'
      ? (r.redditPost as Record<string, unknown>)
      : {};

  const rawPub =
    r.publication && typeof r.publication === 'object'
      ? (r.publication as Record<string, unknown>)
      : {};

  return {
    id: r.id.trim(),
    title,
    subtitle,
    slug,
    contentHtml,
    tags,
    createdAt,
    updatedAt,
    status,
    redditPost: {
      title: typeof rawReddit.title === 'string' ? rawReddit.title : '',
      username: typeof rawReddit.username === 'string' ? rawReddit.username : '',
      subreddit: typeof rawReddit.subreddit === 'string' ? rawReddit.subreddit : '',
      url: typeof rawReddit.url === 'string' ? sanitizeExternalUrl(rawReddit.url) : '',
      postDate: typeof rawReddit.postDate === 'string' ? rawReddit.postDate : '',
      content: typeof rawReddit.content === 'string' ? rawReddit.content : '',
      imageUrl:
        typeof rawReddit.imageUrl === 'string'
          ? sanitizeExternalUrl(rawReddit.imageUrl)
          : '',
    },
    publication: {
      publishedAt:
        typeof rawPub.publishedAt === 'string' ? rawPub.publishedAt : null,
      lastPackagedAt:
        typeof rawPub.lastPackagedAt === 'string' ? rawPub.lastPackagedAt : null,
      verifiedLiveAt:
        typeof rawPub.verifiedLiveAt === 'string' ? rawPub.verifiedLiveAt : null,
      previouslyPublishedSlug:
        typeof rawPub.previouslyPublishedSlug === 'string'
          ? rawPub.previouslyPublishedSlug
          : null,
    },
  };
}

export function validateAndNormalizePassage(raw: unknown): FavouritePassage | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.passageText !== 'string') return null;
  if (!r.passageText.trim()) return null;
  return {
    id: r.id,
    letterId: typeof r.letterId === 'string' ? r.letterId : '',
    letterTitle: typeof r.letterTitle === 'string' ? r.letterTitle : 'Untitled Letter',
    passageText: r.passageText,
    note: typeof r.note === 'string' ? r.note : '',
    savedAt:
      typeof r.savedAt === 'string' && !Number.isNaN(Date.parse(r.savedAt))
        ? r.savedAt
        : new Date().toISOString(),
  };
}

export function validateAndNormalizeSettings(raw: unknown): AppSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS };
  const r = raw as Record<string, unknown>;
  const tags = Array.isArray(r.tags)
    ? Array.from(
        new Set(
          r.tags
            .filter((t): t is string => typeof t === 'string')
            .map((t) => t.trim())
            .filter(Boolean)
        )
      )
    : DEFAULT_TAGS;

  return {
    theme: r.theme === 'light' ? 'light' : 'dark',
    paperStyle: r.paperStyle === 'dark' ? 'dark' : 'cream',
    fontSize:
      r.fontSize === 'small' || r.fontSize === 'large' ? r.fontSize : 'medium',
    editorFont:
      r.editorFont === 'sans' || r.editorFont === 'mono' ? r.editorFont : 'serif',
    showDropCaps: typeof r.showDropCaps === 'boolean' ? r.showDropCaps : true,
    showWordCountInEditor:
      typeof r.showWordCountInEditor === 'boolean'
        ? r.showWordCountInEditor
        : true,
    githubRepoUrl:
      typeof r.githubRepoUrl === 'string'
        ? sanitizeExternalUrl(r.githubRepoUrl)
        : '',
    siteBaseUrl:
      typeof r.siteBaseUrl === 'string'
        ? sanitizeExternalUrl(r.siteBaseUrl)
        : '',
    recipientLabel:
      typeof r.recipientLabel === 'string' && r.recipientLabel.trim()
        ? r.recipientLabel.trim().slice(0, 40)
        : 'Neonate',
    tags: tags.length > 0 ? tags : DEFAULT_TAGS,
  };
}

export function loadInitialData(): {
  letters: Letter[];
  passages: FavouritePassage[];
  settings: AppSettings;
  storageError: string | null;
} {
  try {
    const initialized = localStorage.getItem(KEYS.INITIALIZED);
    if (!initialized) {
      const starter = getStarterDrafts();
      localStorage.setItem(KEYS.LETTERS, JSON.stringify(starter.letters));
      localStorage.setItem(KEYS.PASSAGES, JSON.stringify(starter.passages));
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      localStorage.setItem(KEYS.INITIALIZED, 'true');
      return {
        letters: starter.letters,
        passages: starter.passages,
        settings: { ...DEFAULT_SETTINGS },
        storageError: null,
      };
    }

    const rawLetters = localStorage.getItem(KEYS.LETTERS);
    const rawPassages = localStorage.getItem(KEYS.PASSAGES);
    const rawSettings = localStorage.getItem(KEYS.SETTINGS);

    const parsedLetters = rawLetters ? JSON.parse(rawLetters) : [];
    const letters = Array.isArray(parsedLetters)
      ? parsedLetters
          .map(validateAndNormalizeLetter)
          .filter((l): l is Letter => l !== null)
      : [];

    const parsedPassages = rawPassages ? JSON.parse(rawPassages) : [];
    const passages = Array.isArray(parsedPassages)
      ? parsedPassages
          .map(validateAndNormalizePassage)
          .filter((p): p is FavouritePassage => p !== null)
      : [];

    const settings = rawSettings
      ? validateAndNormalizeSettings(JSON.parse(rawSettings))
      : { ...DEFAULT_SETTINGS };

    return { letters, passages, settings, storageError: null };
  } catch (err) {
    return {
      letters: [],
      passages: [],
      settings: { ...DEFAULT_SETTINGS },
      storageError:
        err instanceof Error
          ? `Could not read browser storage (${err.message}).`
          : 'Could not read browser storage.',
    };
  }
}

export function saveLetters(letters: Letter[]): string | null {
  try {
    localStorage.setItem(KEYS.LETTERS, JSON.stringify(letters));
    localStorage.setItem(KEYS.INITIALIZED, 'true');
    return null;
  } catch (err) {
    return err instanceof Error
      ? `Unable to save letters locally: ${err.message}`
      : 'Unable to save letters locally.';
  }
}

export function savePassages(passages: FavouritePassage[]): string | null {
  try {
    localStorage.setItem(KEYS.PASSAGES, JSON.stringify(passages));
    return null;
  } catch (err) {
    return err instanceof Error
      ? `Unable to save passages locally: ${err.message}`
      : 'Unable to save passages locally.';
  }
}

export function saveSettings(settings: AppSettings): string | null {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    return null;
  } catch (err) {
    return err instanceof Error
      ? `Unable to save settings locally: ${err.message}`
      : 'Unable to save settings locally.';
  }
}

export function clearAllLocalData(): void {
  localStorage.setItem(KEYS.LETTERS, JSON.stringify([]));
  localStorage.setItem(KEYS.PASSAGES, JSON.stringify([]));
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  localStorage.setItem(KEYS.INITIALIZED, 'true');
}

export function createBackupPayload(
  letters: Letter[],
  passages: FavouritePassage[],
  settings: AppSettings
): PostscriptBackup {
  return {
    app: 'postscript',
    version: 1,
    exportedAt: new Date().toISOString(),
    letters,
    passages,
    settings,
  };
}

export interface ParsedImportResult {
  ok: true;
  letters: Letter[];
  passages: FavouritePassage[];
  settings: AppSettings | null;
  skippedCount: number;
}

export interface ParsedImportError {
  ok: false;
  error: string;
}

export function parseAndValidateBackupJson(
  jsonText: string
): ParsedImportResult | ParsedImportError {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return {
      ok: false,
      error: 'The selected file is not valid JSON. Please choose an unmodified Postscript backup file.',
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      ok: false,
      error: 'Backup file structure is invalid (expected a JSON object).',
    };
  }

  const obj = parsed as Record<string, unknown>;
  if (obj.app !== undefined && obj.app !== 'postscript') {
    return {
      ok: false,
      error: 'This JSON file does not appear to be a Postscript backup.',
    };
  }

  if (!Array.isArray(obj.letters)) {
    return {
      ok: false,
      error: 'Backup file is missing a valid "letters" list.',
    };
  }

  let skippedCount = 0;
  const letters: Letter[] = [];
  for (const item of obj.letters) {
    const valid = validateAndNormalizeLetter(item);
    if (valid) {
      letters.push(valid);
    } else {
      skippedCount += 1;
    }
  }

  const passages: FavouritePassage[] = [];
  if (Array.isArray(obj.passages)) {
    for (const p of obj.passages) {
      const valid = validateAndNormalizePassage(p);
      if (valid) passages.push(valid);
    }
  }

  const settings =
    obj.settings && typeof obj.settings === 'object'
      ? validateAndNormalizeSettings(obj.settings)
      : null;

  return {
    ok: true,
    letters,
    passages,
    settings,
    skippedCount,
  };
}

export function computeWritingStats(letters: Letter[]): WritingStats {
  let totalWords = 0;
  let totalPublished = 0;
  let totalDrafts = 0;
  const tagCounts = new Map<string, number>();
  const dayKeys = new Set<string>();

  for (const letter of letters) {
    totalWords += countWords(letter.contentHtml, true);
    if (letter.status === 'published' || letter.status === 'updated') {
      totalPublished += 1;
    } else if (letter.status === 'draft' || letter.status === 'ready') {
      totalDrafts += 1;
    }
    for (const tag of letter.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
    const createdDay = letter.createdAt.slice(0, 10);
    const updatedDay = letter.updatedAt.slice(0, 10);
    if (createdDay) dayKeys.add(createdDay);
    if (updatedDay) dayKeys.add(updatedDay);
  }

  // Meaningful streak: consecutive days ending today or yesterday
  let streakDays = 0;
  const today = new Date();
  const checkDate = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
  const todayKey = checkDate.toISOString().slice(0, 10);
  if (!dayKeys.has(todayKey)) {
    checkDate.setUTCDate(checkDate.getUTCDate() - 1);
  }
  while (dayKeys.has(checkDate.toISOString().slice(0, 10))) {
    streakDays += 1;
    checkDate.setUTCDate(checkDate.getUTCDate() - 1);
  }

  const topCategories = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalLetters: letters.length,
    totalPublished,
    totalDrafts,
    totalWords,
    streakDays,
    topCategories,
  };
}
