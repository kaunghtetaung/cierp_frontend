/**
 * Post-form helpers — compute-only, no React.
 *
 * - extractPlainText: walk a Tiptap ProseMirror document and return concatenated text.
 * - countWords: split plain text on whitespace, exclude empty tokens.
 * - estimateReadingMinutes: assume 200 words/minute (industry default for English;
 *   Myanmar reading speed is similar enough for a rough estimate).
 */

export type ProseMirrorNode = {
  type: string;
  text?: string;
  content?: ProseMirrorNode[];
} & Record<string, unknown>;

export function extractPlainText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as ProseMirrorNode;
  if (typeof n.text === 'string') return n.text;
  if (!Array.isArray(n.content)) return '';
  // Insert a space between blocks (paragraph, heading, etc.) so words from
  // adjacent blocks don't merge in word count.
  return n.content.map(extractPlainText).join(' ');
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter((t) => t.length > 0).length;
}

const WORDS_PER_MINUTE = 200;

export function estimateReadingMinutes(words: number): number {
  if (words <= 0) return 0;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/**
 * SEO meta sensible defaults — used in the live preview when the user hasn't
 * filled in the explicit meta fields.
 */
export function previewMetaTitle(opts: {
  metaTitle?: string;
  titleEn?: string;
}): string {
  return opts.metaTitle?.trim() || opts.titleEn?.trim() || 'Untitled post';
}

export function previewMetaDescription(opts: {
  metaDescription?: string;
  excerptEn?: string;
  bodyText?: string;
}): string {
  if (opts.metaDescription?.trim()) return opts.metaDescription.trim();
  if (opts.excerptEn?.trim()) return opts.excerptEn.trim();
  if (opts.bodyText?.trim()) return opts.bodyText.trim().slice(0, 160);
  return '';
}
