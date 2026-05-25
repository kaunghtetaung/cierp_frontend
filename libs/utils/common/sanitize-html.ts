/**
 * Lightweight HTML sanitizer + URL guard for server-side rendering.
 *
 * Why custom code (vs sanitize-html / DOMPurify)?
 *  - Avoid a new runtime dependency until the team chooses one.
 *  - We only need to block the high-impact vectors landing in our
 *    public pages: script tags, on*-event attribute handlers, and
 *    javascript:/data:/vbscript: URLs in href/src.
 *
 * Coverage:
 *  - Strips <script>, <iframe>, <object>, <embed>, <style>, <link>,
 *    <meta>, <form>, <noscript>, <svg> (the last because SVG can
 *    embed scripts via <script> or onload).
 *  - Strips event-handler attributes (anything starting with `on`).
 *  - Replaces `href`/`src` URLs that use a dangerous scheme with `#`.
 *
 * What this does NOT do:
 *  - Full DOM-tree parse (regex-based — adversarial input may slip).
 *  - Allowlist tags. Tags not in the explicit denylist pass through.
 *
 * If you need stricter guarantees (untrusted user-authored HTML),
 * swap this for `sanitize-html` / `isomorphic-dompurify` later.
 * The function signatures here are forward-compatible.
 */

/**
 * URL schemes that are SAFE to use in href/src attributes.
 * Everything else (including `javascript:`, `data:`, `vbscript:`,
 * `file:`, `blob:`) is replaced with `#`.
 *
 * Note: `mailto:` and `tel:` are intentionally allowed — they're
 * harmless and commonly needed in content.
 */
const SAFE_URL_SCHEMES = new Set([
  'http:',
  'https:',
  'mailto:',
  'tel:',
]);

/**
 * Returns true when `url` is safe to use as an `href` or `src`.
 * Relative URLs (start with `/`, `./`, `../`, `#`, or `?`) are
 * always safe. Bare schemes (e.g. `javascript:`) are blocked.
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = String(url).trim();
  if (!trimmed) return false;
  // Relative or anchor — safe.
  if (/^[/#?]/.test(trimmed) || /^\.\.?\//.test(trimmed)) return true;
  // Has a scheme — must be in allowlist.
  const colon = trimmed.indexOf(':');
  if (colon === -1) {
    // No scheme, not relative → treat as relative-style safe link.
    return true;
  }
  const scheme = trimmed.slice(0, colon + 1).toLowerCase();
  return SAFE_URL_SCHEMES.has(scheme);
}

/**
 * Returns the URL when safe, otherwise `'#'`. Convenience wrapper
 * around {@link isSafeUrl} for the common "use this or fallback"
 * pattern in JSX/template code.
 */
export function safeUrl(url: string | null | undefined): string {
  return isSafeUrl(url) ? String(url).trim() : '#';
}

/**
 * Returns true when `url` is safe to use as an image `src`.
 * Stricter than {@link isSafeUrl}: blocks `data:` URLs (which can
 * smuggle SVG-with-script) and limits to http/https/relative.
 */
export function isSafeImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = String(url).trim();
  if (!trimmed) return false;
  if (/^[/#?]/.test(trimmed) || /^\.\.?\//.test(trimmed)) return true;
  const colon = trimmed.indexOf(':');
  if (colon === -1) return true;
  const scheme = trimmed.slice(0, colon + 1).toLowerCase();
  return scheme === 'http:' || scheme === 'https:';
}

/**
 * Returns the image src when safe, otherwise empty string (so the
 * `<img>` renders broken instead of executing a payload).
 */
export function safeImageUrl(url: string | null | undefined): string {
  return isSafeImageUrl(url) ? String(url).trim() : '';
}

// ─── HTML sanitizer ───────────────────────────────────────────────

// Tags that always execute or attach behavior. They're stripped
// outright (open tag + matching close tag + everything in between).
const DENYLIST_BLOCK_TAGS = [
  'script',
  'iframe',
  'object',
  'embed',
  'style',
  'link',
  'meta',
  'form',
  'noscript',
  'svg',
];

const BLOCK_TAG_RE = new RegExp(
  // Match `<tag ...>` ... `</tag>` (greedy across the block,
  // case-insensitive). Self-closing is also stripped via the
  // separate empty-tag regex below.
  `<(${DENYLIST_BLOCK_TAGS.join('|')})\\b[^>]*>([\\s\\S]*?)</\\1\\s*>`,
  'gi',
);
const BLOCK_TAG_SELFCLOSE_RE = new RegExp(
  `<(${DENYLIST_BLOCK_TAGS.join('|')})\\b[^>]*/?>`,
  'gi',
);

// Event-handler attributes: `onclick="..."`, `onerror='...'`,
// `onmouseover=...`. Strip the attribute (and its value) entirely.
const EVENT_HANDLER_RE = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;

// Dangerous URL schemes inside an `href` or `src` attribute. The
// regex matches the WHOLE attribute (so we can replace the value
// with `#`). It must match BEFORE the event-handler strip to avoid
// emitting `<a href="javascript:">` style strings.
const DANGEROUS_URL_RE =
  /\b(href|src|formaction|action|xlink:href)\s*=\s*(?:"\s*(?:javascript|data|vbscript|file)\s*:[^"]*"|'\s*(?:javascript|data|vbscript|file)\s*:[^']*'|\s*(?:javascript|data|vbscript|file)\s*:[^\s>]+)/gi;

/**
 * Sanitize an HTML string by removing scripts, event handlers, and
 * dangerous URL schemes. Returns a string still suitable for
 * `dangerouslySetInnerHTML`. **Run server-side**; do not skip on
 * the client side just because you "trust the source" — backend
 * compromise becomes site-wide XSS.
 *
 * Returns the input unchanged when it's `null` / `undefined` / not
 * a string (caller should defensively coalesce).
 */
export function sanitizeHtml(input: unknown): string {
  if (input == null) return '';
  if (typeof input !== 'string') return '';
  let s = input;
  // Order matters: neutralize dangerous URLs first (so we don't
  // accidentally re-emit them after attribute-strip), then strip
  // block tags, then events.
  s = s.replace(DANGEROUS_URL_RE, '$1="#"');
  s = s.replace(BLOCK_TAG_RE, '');
  s = s.replace(BLOCK_TAG_SELFCLOSE_RE, '');
  s = s.replace(EVENT_HANDLER_RE, '');
  return s;
}
