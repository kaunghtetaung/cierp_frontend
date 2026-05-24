/**
 * Minimal ProseMirror-JSON → HTML walker.
 *
 * `@tiptap/html`'s `generateHTML(json, extensions)` would be the
 * official path, but it isn't in `node_modules` for this monorepo
 * yet. To avoid adding a runtime dep before the user has reviewed
 * it, we walk the JSON tree by hand and emit the StarterKit-shaped
 * HTML the page editor produces.
 *
 * Covered nodes:
 *   doc · paragraph · heading · text (with marks) · bulletList ·
 *   orderedList · listItem · codeBlock · blockquote · horizontalRule
 *   · hardBreak · image · table · tableRow · tableCell · tableHeader
 *
 * Covered marks:
 *   bold · italic · underline · strike · code · link
 *
 * Anything outside this set is rendered as inner content only,
 * so the surrounding paragraph still appears (i.e. unsupported
 * nodes degrade to plain text rather than disappearing).
 *
 * Output is intentionally NOT sanitized — the input comes from a
 * trusted Tiptap editor under the same admin app's CSRF context.
 * If we ever accept Tiptap JSON from untrusted sources, run it
 * through `dompurify` BEFORE rendering.
 */

type Json = any;

const escapeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => escapeMap[c]!);
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

function applyMarks(text: string, marks: Json[] | undefined): string {
  if (!marks || marks.length === 0) return escapeHtml(text);
  let html = escapeHtml(text);
  for (const m of marks) {
    switch (m.type) {
      case 'bold':
      case 'strong':
        html = `<strong>${html}</strong>`;
        break;
      case 'italic':
      case 'em':
        html = `<em>${html}</em>`;
        break;
      case 'underline':
        html = `<u>${html}</u>`;
        break;
      case 'strike':
      case 'strikethrough':
        html = `<s>${html}</s>`;
        break;
      case 'code':
        html = `<code>${html}</code>`;
        break;
      case 'link': {
        const href = escapeAttr(m.attrs?.href ?? '#');
        const target = m.attrs?.target
          ? ` target="${escapeAttr(m.attrs.target)}"`
          : '';
        const rel =
          m.attrs?.target === '_blank'
            ? ' rel="noopener noreferrer"'
            : '';
        html = `<a href="${href}"${target}${rel}>${html}</a>`;
        break;
      }
      // Unknown marks ignored.
    }
  }
  return html;
}

function renderInline(nodes: Json[] | undefined): string {
  if (!nodes) return '';
  return nodes.map(renderNode).join('');
}

function renderChildren(nodes: Json[] | undefined): string {
  if (!nodes) return '';
  return nodes.map(renderNode).join('');
}

function renderNode(node: Json): string {
  if (!node || typeof node !== 'object') return '';
  switch (node.type) {
    case 'doc':
      return renderChildren(node.content);
    case 'paragraph': {
      const inner = renderInline(node.content);
      return `<p>${inner || '<br />'}</p>`;
    }
    case 'heading': {
      const lvl = Math.max(1, Math.min(6, Number(node.attrs?.level) || 1));
      return `<h${lvl}>${renderInline(node.content)}</h${lvl}>`;
    }
    case 'text': {
      return applyMarks(node.text ?? '', node.marks);
    }
    case 'bulletList':
      return `<ul>${renderChildren(node.content)}</ul>`;
    case 'orderedList': {
      const start = node.attrs?.start ? ` start="${node.attrs.start}"` : '';
      return `<ol${start}>${renderChildren(node.content)}</ol>`;
    }
    case 'listItem':
      return `<li>${renderChildren(node.content)}</li>`;
    case 'codeBlock': {
      const lang = node.attrs?.language
        ? ` class="language-${escapeAttr(node.attrs.language)}"`
        : '';
      // codeBlock children are usually a single text node; pass
      // through `applyMarks` so `<code>` text is escaped properly.
      const code = node.content
        ? node.content
            .map((c: any) => escapeHtml(c.text ?? ''))
            .join('')
        : '';
      return `<pre><code${lang}>${code}</code></pre>`;
    }
    case 'blockquote':
      return `<blockquote>${renderChildren(node.content)}</blockquote>`;
    case 'horizontalRule':
    case 'horizontal_rule':
      return '<hr />';
    case 'hardBreak':
    case 'hard_break':
      return '<br />';
    case 'image': {
      const src = escapeAttr(node.attrs?.src ?? '');
      const alt = escapeAttr(node.attrs?.alt ?? '');
      const title = node.attrs?.title
        ? ` title="${escapeAttr(node.attrs.title)}"`
        : '';
      const mediaId = node.attrs?.mediaId
        ? ` data-media-id="${escapeAttr(String(node.attrs.mediaId))}"`
        : '';

      // Presentation attrs (added in MediaAwareImage). Authors set
      // these from the admin's floating image toolbar; the public
      // renderer mirrors them via inline styles + data-attrs the
      // client-side Lightbox component can pick up.
      const align = ['left', 'center', 'right'].includes(node.attrs?.align)
        ? node.attrs.align
        : 'center';
      const bordered = !!node.attrs?.bordered;
      const padded = !!node.attrs?.padded;
      const lightbox = node.attrs?.lightbox !== false; // default true
      const widthRaw = Number(node.attrs?.width);
      const widthPct =
        Number.isFinite(widthRaw) && widthRaw > 0 && widthRaw <= 100
          ? widthRaw
          : 100;
      const caption = node.attrs?.caption
        ? escapeHtml(String(node.attrs.caption))
        : '';

      const figureStyle: string[] = [];
      if (align === 'left') {
        figureStyle.push('text-align:left', 'margin-left:0', 'margin-right:auto');
      } else if (align === 'right') {
        figureStyle.push('text-align:right', 'margin-left:auto', 'margin-right:0');
      } else {
        figureStyle.push('text-align:center', 'margin-left:auto', 'margin-right:auto');
      }
      figureStyle.push(`max-width:${widthPct}%`);

      const imgStyle: string[] = ['width:100%', 'height:auto'];
      if (bordered) {
        imgStyle.push('border:1px solid #d4d4d8', 'border-radius:4px');
      }
      if (padded) {
        imgStyle.push('padding:8px', 'background:#f4f4f5', 'box-sizing:border-box');
      }
      if (lightbox) {
        imgStyle.push('cursor:zoom-in');
      }

      const imgAttrs: string[] = [
        `src="${src}"`,
        `alt="${alt}"`,
        `loading="lazy"`,
        `decoding="async"`,
        `style="${imgStyle.join(';')}"`,
      ];
      if (lightbox) imgAttrs.push('data-lightbox="true"');
      if (title) imgAttrs.push(title.trim());
      if (mediaId) imgAttrs.push(mediaId.trim());

      const capHtml = caption
        ? `<figcaption style="font-size:0.875rem;color:#71717a;margin-top:6px;text-align:${align}">${caption}</figcaption>`
        : '';

      return (
        `<figure data-tiptap-image="true" data-align="${align}" data-width="${widthPct}"` +
        (bordered ? ' data-bordered="true"' : '') +
        (padded ? ' data-padded="true"' : '') +
        (lightbox ? '' : ' data-lightbox="false"') +
        ` style="${figureStyle.join(';')}">` +
        `<img ${imgAttrs.join(' ')} />` +
        capHtml +
        `</figure>`
      );
    }
    // ── Tables (StarterKit + extension-table) ──────────────────
    // Tiptap stores tables as `table > tableRow > (tableCell |
    // tableHeader) > <block content>`. Cells may carry `colspan` /
    // `rowspan` / `colwidth` attrs; we pass colspan + rowspan
    // through and translate colwidth (an array of px widths) onto
    // the cell's inline style so column sizing survives. Without
    // this case the entire table was silently dropped on the
    // public site even though the editor preserved it.
    case 'table':
      // Wrap in a scroll container so the table fills the article
      // width AND wide tables can horizontally scroll on narrow
      // viewports without forcing the table itself to `display:
      // block` (which collapses it to content width). Pair with
      // the `.rich-table-wrap` rule in globals.css.
      return `<div class="rich-table-wrap"><table>${renderChildren(node.content)}</table></div>`;
    case 'tableRow':
      return `<tr>${renderChildren(node.content)}</tr>`;
    case 'tableCell':
    case 'tableHeader': {
      const tag = node.type === 'tableHeader' ? 'th' : 'td';
      const attrs: string[] = [];
      const cs = Number(node.attrs?.colspan);
      const rs = Number(node.attrs?.rowspan);
      if (cs && cs > 1) attrs.push(`colspan="${cs}"`);
      if (rs && rs > 1) attrs.push(`rowspan="${rs}"`);
      const cw = node.attrs?.colwidth;
      if (Array.isArray(cw) && cw[0] && Number(cw[0]) > 0) {
        attrs.push(`style="width:${Number(cw[0])}px"`);
      }
      const open = attrs.length ? `<${tag} ${attrs.join(' ')}>` : `<${tag}>`;
      return `${open}${renderChildren(node.content)}</${tag}>`;
    }
    default:
      // Unknown — render any children inline so we don't lose text.
      return renderChildren(node.content);
  }
}

/**
 * Convert a Tiptap ProseMirror JSON document to HTML. Returns ''
 * for null / non-object input.
 */
export function tiptapJsonToHtml(json: unknown): string {
  if (!json || typeof json !== 'object') return '';
  return renderNode(json);
}
