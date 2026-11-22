import type { Letter } from '../types/letter';

export function htmlToPlainText(html: string): string {
  if (!html) return '';
  if (typeof DOMParser === 'undefined') {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<\/(p|h1|h2|h3|blockquote|li|br)>/gi, '\n\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks: string[] = [];

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (tag === 'br') return '\n';

    let inner = '';
    el.childNodes.forEach((child) => {
      inner += walk(child);
    });

    if (['p', 'h1', 'h2', 'h3', 'blockquote', 'li'].includes(tag)) {
      const cleaned = inner.replace(/\s+/g, ' ').trim();
      if (cleaned) blocks.push(cleaned);
      return '';
    }
    return inner;
  };

  walk(doc.body);
  if (blocks.length > 0) {
    return blocks.join('\n\n');
  }
  return (doc.body.textContent || '').trim();
}

export function countWords(htmlOrText: string, isHtml = true): number {
  const text = isHtml ? htmlToPlainText(htmlOrText) : htmlOrText;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function countCharacters(htmlOrText: string, isHtml = true): number {
  const text = isHtml ? htmlToPlainText(htmlOrText) : htmlOrText;
  return text.replace(/\n\n/g, '\n').length;
}

export function estimateReadingTime(words: number): number {
  if (words <= 0) return 1;
  return Math.max(1, Math.ceil(words / 220));
}

export function createExcerpt(html: string, maxLength = 175): string {
  const plain = htmlToPlainText(html).replace(/\s+/g, ' ').trim();
  if (!plain) return 'An unwritten page waiting for words.';
  if (plain.length <= maxLength) return plain;
  const clipped = plain.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${(lastSpace > 80 ? clipped.slice(0, lastSpace) : clipped).trim()}…`;
}

export function slugify(input: string): string {
  const base = (input || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'untitled-letter';
}

export function ensureUniqueSlug(
  desiredSlug: string,
  allLetters: Letter[],
  currentLetterId?: string
): string {
  const base = slugify(desiredSlug);
  const used = new Set(
    allLetters
      .filter((l) => l.id !== currentLetterId)
      .map((l) => l.slug.toLowerCase())
  );
  if (!used.has(base)) return base;
  let counter = 2;
  while (used.has(`${base}-${counter}`)) {
    counter += 1;
  }
  return `${base}-${counter}`;
}

export function formatReadableDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 45) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatShortDate(iso);
}

export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const serializeInline = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const inner = Array.from(el.childNodes).map(serializeInline).join('');
    switch (tag) {
      case 'strong':
      case 'b':
        return `**${inner}**`;
      case 'em':
      case 'i':
        return `*${inner}*`;
      case 'u':
        return `<u>${inner}</u>`;
      case 'br':
        return '  \n';
      default:
        return inner;
    }
  };

  const lines: string[] = [];
  Array.from(doc.body.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const txt = (node.textContent || '').trim();
      if (txt) lines.push(txt, '');
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    switch (tag) {
      case 'h1':
        lines.push(`# ${serializeInline(el).trim()}`, '');
        break;
      case 'h2':
        lines.push(`## ${serializeInline(el).trim()}`, '');
        break;
      case 'h3':
        lines.push(`### ${serializeInline(el).trim()}`, '');
        break;
      case 'blockquote': {
        const quoted = htmlToPlainText(el.innerHTML)
          .split('\n')
          .map((line) => (line ? `> ${line}` : '>'))
          .join('\n');
        lines.push(quoted, '');
        break;
      }
      case 'ul':
        Array.from(el.children).forEach((li) => {
          lines.push(`- ${serializeInline(li).trim()}`);
        });
        lines.push('');
        break;
      case 'ol':
        Array.from(el.children).forEach((li, idx) => {
          lines.push(`${idx + 1}. ${serializeInline(li).trim()}`);
        });
        lines.push('');
        break;
      case 'hr':
        lines.push('---', '');
        break;
      default: {
        const p = serializeInline(el).trim();
        if (p) lines.push(p, '');
        break;
      }
    }
  });

  return lines.join('\n').trim();
}

export function exportLetterAsMarkdown(letter: Letter): string {
  const parts: string[] = [];
  parts.push(`# ${letter.title || 'Untitled Letter'}`);
  if (letter.subtitle) {
    parts.push(`*${letter.subtitle}*`);
  }
  parts.push('');
  parts.push(`- Created: ${formatReadableDate(letter.createdAt)}`);
  parts.push(`- Last edited: ${formatReadableDate(letter.updatedAt)}`);
  if (letter.tags.length > 0) {
    parts.push(`- Categories: ${letter.tags.join(', ')}`);
  }
  if (letter.redditPost.title || letter.redditPost.content) {
    parts.push('', '---', '', '## In response to', '');
    if (letter.redditPost.title) parts.push(`**${letter.redditPost.title}**`);
    const meta = [
      letter.redditPost.subreddit ? `r/${letter.redditPost.subreddit.replace(/^r\//i, '')}` : '',
      letter.redditPost.username ? `u/${letter.redditPost.username.replace(/^u\//i, '')}` : '',
      letter.redditPost.postDate || '',
    ].filter(Boolean);
    if (meta.length > 0) parts.push(`*${meta.join(' · ')}*`);
    if (letter.redditPost.url) parts.push(`Original link: ${letter.redditPost.url}`);
    if (letter.redditPost.content) {
      parts.push('', ...letter.redditPost.content.split('\n').map((l) => `> ${l}`));
    }
  }
  parts.push('', '---', '', htmlToMarkdown(letter.contentHtml), '', '*End of letter.*');
  return parts.join('\n');
}

export function exportLetterAsTxt(letter: Letter): string {
  const lines: string[] = [];
  lines.push((letter.title || 'Untitled Letter').toUpperCase());
  if (letter.subtitle) lines.push(letter.subtitle);
  lines.push(`Written on ${formatReadableDate(letter.createdAt)}`);
  if (letter.tags.length > 0) {
    lines.push(`Categories: ${letter.tags.join(', ')}`);
  }
  lines.push('');
  if (letter.redditPost.title || letter.redditPost.content) {
    lines.push('----------------------------------------');
    lines.push('IN RESPONSE TO:');
    if (letter.redditPost.title) lines.push(letter.redditPost.title);
    const meta = [
      letter.redditPost.subreddit ? `r/${letter.redditPost.subreddit.replace(/^r\//i, '')}` : '',
      letter.redditPost.username ? `u/${letter.redditPost.username.replace(/^u\//i, '')}` : '',
      letter.redditPost.postDate || '',
    ].filter(Boolean);
    if (meta.length > 0) lines.push(meta.join(' · '));
    if (letter.redditPost.url) lines.push(letter.redditPost.url);
    if (letter.redditPost.content) {
      lines.push('', letter.redditPost.content);
    }
    lines.push('----------------------------------------', '');
  }
  lines.push(htmlToPlainText(letter.contentHtml));
  lines.push('', 'End of letter.');
  return lines.join('\n');
}

export function statusLabel(status: Letter['status']): string {
  switch (status) {
    case 'draft':
      return 'Draft (saved locally)';
    case 'ready':
      return 'Ready to publish';
    case 'pending':
      return 'Publishing pending';
    case 'published':
      return 'Published';
    case 'updated':
      return 'Updated (pending re-publish)';
    case 'unpublished':
      return 'Unpublished';
    default:
      return 'Draft';
  }
}

export function shortStatusLabel(status: Letter['status']): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'ready':
      return 'Ready';
    case 'pending':
      return 'Pending deploy';
    case 'published':
      return 'Published';
    case 'updated':
      return 'Updated';
    case 'unpublished':
      return 'Unpublished';
    default:
      return 'Draft';
  }
}
