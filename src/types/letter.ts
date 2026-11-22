export type PublicationStatus =
  | 'draft'
  | 'ready'
  | 'pending'
  | 'published'
  | 'updated'
  | 'unpublished';

export interface RedditPostRef {
  title: string;
  username: string;
  subreddit: string;
  url: string;
  postDate: string;
  content: string;
  imageUrl: string;
}

export interface PublicationMeta {
  publishedAt: string | null;
  lastPackagedAt: string | null;
  verifiedLiveAt: string | null;
  previouslyPublishedSlug: string | null;
}

export interface Letter {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  contentHtml: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  status: PublicationStatus;
  redditPost: RedditPostRef;
  publication: PublicationMeta;
}

export interface PublicLetter {
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  contentHtml: string;
  wordCount: number;
  readingTimeMinutes: number;
  publishedAt: string;
  updatedAt: string;
  redditPost: {
    title: string;
    username: string;
    subreddit: string;
    url: string;
    postDate: string;
    content: string;
    imageUrl: string;
  };
}

export interface PublicLettersIndex {
  version: number;
  updatedAt: string | null;
  letters: PublicLetter[];
}

export interface FavouritePassage {
  id: string;
  letterId: string;
  letterTitle: string;
  passageText: string;
  note: string;
  savedAt: string;
}

export type ThemeMode = 'dark' | 'light';
export type PaperStyleOption = 'cream' | 'dark';
export type FontSizeOption = 'small' | 'medium' | 'large';
export type EditorFontOption = 'serif' | 'sans' | 'mono';

export interface AppSettings {
  theme: ThemeMode;
  paperStyle: PaperStyleOption;
  fontSize: FontSizeOption;
  editorFont: EditorFontOption;
  showDropCaps: boolean;
  showWordCountInEditor: boolean;
  githubRepoUrl: string;
  siteBaseUrl: string;
  recipientLabel: string;
  tags: string[];
}

export interface PostscriptBackup {
  app: 'postscript';
  version: number;
  exportedAt: string;
  letters: Letter[];
  passages: FavouritePassage[];
  settings: AppSettings;
}

export interface WritingStats {
  totalLetters: number;
  totalPublished: number;
  totalDrafts: number;
  totalWords: number;
  streakDays: number;
  topCategories: Array<{ tag: string; count: number }>;
}
