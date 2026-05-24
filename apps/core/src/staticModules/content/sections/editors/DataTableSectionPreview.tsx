'use client';

import React from 'react';
import { Check, X as XIcon } from 'lucide-react';
import { cn } from '@repo/ui';
import type {
  DataTableSectionFormData,
  DataTableColumnFormData,
} from './data-table-types';

interface DataTableSectionPreviewProps {
  data: DataTableSectionFormData;
  language?: 'en' | 'mm';
}

function getSpacingValue(value: string): string {
  const map: Record<string, string> = {
    none: '0',
    sm: '1rem',
    md: '2rem',
    lg: '4rem',
    xl: '6rem',
  };
  return map[value] || value;
}

function alignClass(align?: string): string {
  switch (align) {
    case 'center':
      return 'text-center';
    case 'right':
      return 'text-right';
    case 'left':
    default:
      return 'text-left';
  }
}

function isTruthy(raw: unknown): boolean {
  if (raw == null) return false;
  if (typeof raw === 'boolean') return raw;
  const v = String(raw).trim().toLowerCase();
  return v === 'true' || v === 'yes' || v === '1' || v === 'y';
}

// Pull the displayable string from a cell value — supports plain
// strings, numbers, booleans, or `{ en, mm? }` multi-lang objects.
function getCellString(
  raw: unknown,
  language: 'en' | 'mm',
): string {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
  if (typeof raw === 'object') {
    const obj = raw as { en?: string; mm?: string };
    return (
      (language === 'mm' && obj.mm) || obj.en || obj.mm || ''
    );
  }
  return String(raw);
}

function renderCell(
  raw: unknown,
  language: 'en' | 'mm',
  type: DataTableColumnFormData['type'] | undefined,
): React.ReactNode {
  const text = getCellString(raw, language);
  if (!text) return <span className="text-muted-foreground/50">—</span>;
  switch (type) {
    case 'boolean':
      return isTruthy(raw) ? (
        <Check className="h-4 w-4 mx-auto text-green-600" />
      ) : (
        <XIcon className="h-4 w-4 mx-auto text-muted-foreground/40" />
      );
    case 'number':
    case 'currency':
    case 'percentage':
      return <span className="tabular-nums">{text}</span>;
    case 'date':
      return <span>{text}</span>;
    case 'text':
    default:
      return <span>{text}</span>;
  }
}

export function DataTableSectionPreview({
  data,
  language = 'en',
}: DataTableSectionPreviewProps) {
  const headline = data.headline?.[language] || data.headline?.en || '';
  const description =
    data.description?.[language] || data.description?.en || '';
  const caption = data.caption?.[language] || data.caption?.en || '';

  const spacingStyles: React.CSSProperties = {
    paddingTop: data.spacing?.paddingTop
      ? getSpacingValue(data.spacing.paddingTop)
      : undefined,
    paddingBottom: data.spacing?.paddingBottom
      ? getSpacingValue(data.spacing.paddingBottom)
      : undefined,
    paddingLeft: data.spacing?.paddingLeft
      ? getSpacingValue(data.spacing.paddingLeft)
      : undefined,
    paddingRight: data.spacing?.paddingRight
      ? getSpacingValue(data.spacing.paddingRight)
      : undefined,
    marginTop: data.spacing?.marginTop
      ? getSpacingValue(data.spacing.marginTop)
      : undefined,
    marginBottom: data.spacing?.marginBottom
      ? getSpacingValue(data.spacing.marginBottom)
      : undefined,
  };

  const containerClasses = cn(
    'bg-background rounded shadow-lg p-6 md:p-10',
    data.containerSettings?.width === 'fullWidth' ? 'w-full' : '',
    data.containerSettings?.width === 'contained' ? 'max-w-6xl mx-auto' : '',
  );

  const responsiveClasses = cn(
    data.responsiveSettings?.hideOnMobile ? 'hidden md:block' : '',
    data.responsiveSettings?.hideOnTablet ? 'md:hidden lg:block' : '',
    data.responsiveSettings?.hideOnDesktop ? 'lg:hidden' : '',
  );

  const columns = data.table?.columns || [];
  const rows = data.table?.rows || [];
  const styling = (data.styling || {}) as {
    striped?: boolean;
    bordered?: boolean;
    hover?: boolean;
    compact?: boolean;
  };
  const cellPadding = styling.compact ? 'px-2 py-1.5' : 'px-3 py-2.5';

  return (
    <div
      className={cn(containerClasses, responsiveClasses)}
      style={{
        ...spacingStyles,
        maxWidth:
          data.containerSettings?.width === 'custom'
            ? data.containerSettings.maxWidth
            : undefined,
      }}
    >
      {(headline || description) && (
        <div className="mb-6">
          {headline && (
            <h2
              className="text-2xl md:text-3xl font-bold leading-tight"
              style={{
                color: data.textColors?.headline || undefined,
                fontSize: data.headlineSize
                  ? `${data.headlineSize}px`
                  : undefined,
              }}
            >
              {headline}
            </h2>
          )}
          {description && (
            <p
              className="mt-2 text-sm md:text-base text-muted-foreground"
              style={{ color: data.textColors?.description || undefined }}
            >
              {description}
            </p>
          )}
        </div>
      )}

      {columns.length === 0 ? (
        <div className="text-sm italic text-muted-foreground text-center py-8">
          Add at least one column in the editor.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table
            className={cn(
              'w-full text-sm',
              styling.bordered && 'border border-border',
            )}
            style={{ color: data.textColors?.body || undefined }}
          >
            <thead>
              <tr
                className={cn(
                  'bg-muted/40',
                  styling.bordered && 'border-b border-border',
                )}
              >
                {columns.map((col, idx) => {
                  const headerText =
                    col.label?.[language] || col.label?.en || col.key;
                  return (
                    <th
                      key={idx}
                      className={cn(
                        cellPadding,
                        'font-semibold',
                        alignClass(col.align),
                        styling.bordered &&
                          'border-r border-border last:border-r-0',
                      )}
                      style={{
                        width: col.width || undefined,
                        color: data.textColors?.header || undefined,
                      }}
                    >
                      {headerText}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-6 text-center text-muted-foreground italic"
                  >
                    No rows yet — add rows in the editor.
                  </td>
                </tr>
              ) : (
                rows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className={cn(
                      styling.bordered &&
                        'border-b border-border last:border-b-0',
                      styling.striped && rIdx % 2 === 1 && 'bg-muted/20',
                      styling.hover && 'hover:bg-muted/40',
                    )}
                  >
                    {columns.map((col, cIdx) => {
                      const value = (row as Record<string, unknown>)[col.key];
                      return (
                        <td
                          key={cIdx}
                          className={cn(
                            cellPadding,
                            alignClass(col.align),
                            styling.bordered &&
                              'border-r border-border last:border-r-0',
                          )}
                        >
                          {renderCell(value, language, col.type)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
            {caption && (
              <caption className="caption-bottom text-xs text-muted-foreground italic mt-2 px-1">
                {caption}
              </caption>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
