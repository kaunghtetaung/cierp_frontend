/**
 * Resolve a section's author-configured spacing into a CSS-in-JS
 * style object. Mirrors the admin spacing form's value vocabulary —
 * accepts both named tokens (none/sm/md/lg/xl) AND raw CSS values
 * (e.g. "1.5rem", "32px") so authors who type custom values get
 * them through verbatim.
 *
 * Returns `{}` when the section has no spacing configured at all,
 * so the calling renderer can fall back to its hardcoded defaults
 * (e.g. `className="py-12"`) — opt-in customisation rather than
 * a regression for sections that haven't been touched.
 *
 * Usage:
 *   const spacingStyles = getSectionSpacingStyles(section);
 *   const hasCustomSpacing = hasAnySpacing(section);
 *   <section
 *     className={hasCustomSpacing ? "" : "py-12"}
 *     style={spacingStyles}
 *   >
 *
 * Margin keys map to inline `margin*`; padding keys map to
 * `padding*`. Six axes total — top, right, bottom, left for
 * padding plus top + bottom for margin (matches the admin's
 * 6-axis spacing widget).
 */

const TOKEN_TO_VALUE: Record<string, string> = {
  none: '0',
  sm: '1rem',
  md: '2rem',
  lg: '4rem',
  xl: '6rem',
};

function resolveValue(raw: unknown): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  // Named token (none/sm/md/lg/xl)
  if (trimmed in TOKEN_TO_VALUE) return TOKEN_TO_VALUE[trimmed];
  // Raw CSS value — pass through (assumes the admin form
  // validates / sanitises). Accepts `12px`, `1.5rem`, `0`,
  // `auto`, `var(--token)`, etc.
  return trimmed;
}

export interface SectionSpacingShape {
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
  marginTop?: string;
  marginBottom?: string;
}

export function getSectionSpacingStyles(section: any): React.CSSProperties {
  const sp: SectionSpacingShape | undefined = section?.spacing;
  if (!sp) return {};
  const out: React.CSSProperties = {};
  const pt = resolveValue(sp.paddingTop);
  const pb = resolveValue(sp.paddingBottom);
  const pl = resolveValue(sp.paddingLeft);
  const pr = resolveValue(sp.paddingRight);
  const mt = resolveValue(sp.marginTop);
  const mb = resolveValue(sp.marginBottom);
  if (pt !== undefined) out.paddingTop = pt;
  if (pb !== undefined) out.paddingBottom = pb;
  if (pl !== undefined) out.paddingLeft = pl;
  if (pr !== undefined) out.paddingRight = pr;
  if (mt !== undefined) out.marginTop = mt;
  if (mb !== undefined) out.marginBottom = mb;
  return out;
}

/**
 * True when the author has set ANY spacing value on the section —
 * lets the renderer drop its default `py-12` / `py-16` className
 * so it doesn't collide with the inline override. (Without the
 * branch, `py-12` wins on the top axis when the author only set
 * `paddingBottom`, leaving asymmetric spacing.)
 */
export function hasAnySpacing(section: any): boolean {
  const sp = section?.spacing;
  if (!sp) return false;
  return Boolean(
    resolveValue(sp.paddingTop) !== undefined ||
      resolveValue(sp.paddingBottom) !== undefined ||
      resolveValue(sp.paddingLeft) !== undefined ||
      resolveValue(sp.paddingRight) !== undefined ||
      resolveValue(sp.marginTop) !== undefined ||
      resolveValue(sp.marginBottom) !== undefined,
  );
}
