'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@repo/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import {
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Layout as LayoutIcon,
  Maximize2,
  Split,
  CornerUpLeft,
  Pencil,
} from 'lucide-react';
import { LayoutPickerModal, type RowPreset } from './LayoutPickerModal';
import { SectionPickerModal } from './SectionPickerModal';
import { getSections } from '../../common/actions';
import type {
  PageLayout,
  PageLayoutContainer,
  PageLayoutRow,
  PageLayoutColumn,
  PageLayoutColumnRef,
} from '../../common/types';

// Light-weight section summary used to label leaf cells in the layout
// tree. We only care about display-time fields — the canonical Section
// shape is bigger than this. Resolved by id from a one-shot fetch.
interface SectionLabel {
  name: string;
  type: string;
  title?: { en?: string; mm?: string };
}

// Context — passes the resolved section labels through the recursive
// RowView/ColumnView render tree so we don't have to prop-drill the
// map through every level. Defaults to an empty Map; the provider in
// PageLayoutBuilder fills it once sections load.
const SectionLabelsContext = React.createContext<Map<string, SectionLabel>>(
  new Map(),
);

interface PageLayoutBuilderProps {
  value?: PageLayout;
  onChange: (next: PageLayout) => void;
  /** Tenant scope for the section picker. */
  tenantId?: string;
}

/**
 * Step in a column-tree path. Each step says "go into row R, then
 * column C of that row". A row-container path is a sequence of these
 * steps that drills into a column's sub-rows; an empty path is the
 * root container's rows. A column path appends a final step.
 */
type PathStep = { r: number; c: number };

/**
 * Page-builder editor for the `layout` tree on a Post (used when
 * `layoutMode === 'sections'`). Renders containers > rows > columns
 * recursively — a column either holds `sectionRefs` (leaf) or
 * `rows[]` (branch with sub-rows). Operations target a path so the
 * same UI works at every depth.
 */
export function PageLayoutBuilder({
  value,
  onChange,
  tenantId,
}: PageLayoutBuilderProps) {
  // Normalise — collapse to a single container so the UI is always
  // working with one root container.
  const layout: PageLayout = useMemo(() => {
    if (!value || !value.containers || value.containers.length === 0) {
      return {
        containers: [
          {
            id: makeId('container'),
            settings: {},
            rows: [],
          },
        ],
      };
    }
    return value;
  }, [value]);

  const container = layout.containers[0];

  // ───────── Section label resolver
  // Layout cells store only `sectionId` (ObjectId); the leaf render
  // needs the section's `name` + `type` to be human-readable. Fetch
  // the org's sections once on mount and build an id → label map.
  // Same source as the SectionPickerModal — keeps both in sync.
  const [sectionLabels, setSectionLabels] = useState<
    Map<string, SectionLabel>
  >(new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await getSections({
          limit: 200,
          sortBy: 'name',
          sortOrder: 'asc',
        });
        if (cancelled || !r.success || !r.data) return;
        const list = Array.isArray(r.data)
          ? (r.data as any[])
          : ((r.data as any)?.data ?? []);
        const next = new Map<string, SectionLabel>();
        for (const s of list) {
          if (s?._id) {
            next.set(String(s._id), {
              name: s.name ?? '',
              type: s.type ?? '',
              title: s.title,
            });
          }
        }
        setSectionLabels(next);
      } catch {
        // non-fatal — leaf cells fall back to the id slice
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ───────── Modal context
  // Picking a row preset can target one of three things:
  //   - 'append'      : append a new row at `path` (root or sub).
  //   - 'split'       : convert a column at `path` (col path) into a
  //                     branch with one initial sub-row from the preset.
  type RowPickerCtx =
    | { kind: 'append'; rowPath: PathStep[] }
    | { kind: 'split'; colPath: PathStep[] };

  const [rowPickerCtx, setRowPickerCtx] = useState<RowPickerCtx | null>(null);
  const [sectionPickerCtx, setSectionPickerCtx] = useState<{
    colPath: PathStep[];
  } | null>(null);

  const update = useCallback(
    (next: PageLayoutContainer) => {
      onChange({ containers: [next, ...layout.containers.slice(1)] });
    },
    [layout, onChange],
  );

  // Container-level settings — currently just maxWidth. The renderer
  // (`PageLayoutRenderer`) defaults to 'full' (edge-to-edge) when this
  // is unset, which is the right call for marketing pages with hero
  // bands but wrong for content pages (about, faculty) that read
  // better at a constrained width. Authors pick per template.
  const setContainerWidth = (
    width: 'screen-sm' | 'screen-md' | 'screen-lg' | 'screen-xl' | 'full',
  ) => {
    update({
      ...container,
      settings: {
        ...(container.settings ?? {}),
        maxWidth: width,
      },
    });
  };
  const currentWidth =
    (container.settings?.maxWidth as
      | 'screen-sm'
      | 'screen-md'
      | 'screen-lg'
      | 'screen-xl'
      | 'full'
      | undefined) ?? 'full';

  // ───────── Mutation helpers (path-based, immutable)

  // Apply `mutator` to the rows-array at the given path. Empty path =
  // root container rows. Each step drills into row R, column C, then
  // descends into that column's `rows`.
  const updateRowsAt = (
    c: PageLayoutContainer,
    path: PathStep[],
    mutator: (rows: PageLayoutRow[]) => PageLayoutRow[],
  ): PageLayoutContainer => {
    if (path.length === 0) {
      return { ...c, rows: mutator(c.rows) };
    }
    const [head, ...rest] = path;
    const rows = c.rows.map((row, ri) => {
      if (ri !== head.r) return row;
      const columns = row.columns.map((col, ci) => {
        if (ci !== head.c) return col;
        const inner: PageLayoutContainer = { ...c, rows: col.rows ?? [] };
        const updated = updateRowsAt(inner, rest, mutator);
        return { ...col, rows: updated.rows };
      });
      return { ...row, columns };
    });
    return { ...c, rows };
  };

  // Apply `mutator` to the column at the given column-path. Path's
  // last step targets the column itself.
  const updateColumnAt = (
    c: PageLayoutContainer,
    path: PathStep[],
    mutator: (col: PageLayoutColumn) => PageLayoutColumn,
  ): PageLayoutContainer => {
    if (path.length === 0) return c;
    const [head, ...rest] = path;
    if (rest.length === 0) {
      const rows = c.rows.map((row, ri) => {
        if (ri !== head.r) return row;
        const columns = row.columns.map((col, ci) =>
          ci === head.c ? mutator(col) : col,
        );
        return { ...row, columns };
      });
      return { ...c, rows };
    }
    const rows = c.rows.map((row, ri) => {
      if (ri !== head.r) return row;
      const columns = row.columns.map((col, ci) => {
        if (ci !== head.c) return col;
        const inner: PageLayoutContainer = { ...c, rows: col.rows ?? [] };
        const updated = updateColumnAt(inner, rest, mutator);
        return { ...col, rows: updated.rows };
      });
      return { ...row, columns };
    });
    return { ...c, rows };
  };

  const buildRow = (preset: RowPreset): PageLayoutRow => ({
    id: makeId('row'),
    settings: { mobileStack: true, gap: 'gap-6' },
    columns: preset.columns.map((width) => ({
      id: makeId('col'),
      width,
      sectionRefs: [],
    })),
  });

  // ───────── Row CRUD (works at any depth)
  const appendRow = (rowPath: PathStep[], preset: RowPreset) => {
    const newRow = buildRow(preset);
    update(
      updateRowsAt(container, rowPath, (rows) => [...rows, newRow]),
    );
  };

  const removeRow = (rowPath: PathStep[], idx: number) => {
    update(
      updateRowsAt(container, rowPath, (rows) =>
        rows.filter((_, i) => i !== idx),
      ),
    );
  };

  const moveRow = (rowPath: PathStep[], idx: number, dir: -1 | 1) => {
    update(
      updateRowsAt(container, rowPath, (rows) => {
        const target = idx + dir;
        if (target < 0 || target >= rows.length) return rows;
        const next = [...rows];
        [next[idx], next[target]] = [next[target], next[idx]];
        return next;
      }),
    );
  };

  // ───────── Column ops
  const setColumnSection = (
    colPath: PathStep[],
    ref: PageLayoutColumnRef | null,
  ) => {
    update(
      updateColumnAt(container, colPath, (col) => ({
        ...col,
        sectionRefs: ref ? [ref] : [],
        // Clearing section keeps it as a leaf — drop any nested rows.
        rows: undefined,
      })),
    );
    setSectionPickerCtx(null);
  };

  // Convert a leaf column into a branch with one initial sub-row from
  // the picked preset. `sectionRefs` is dropped — a column is either
  // leaf or branch, never both.
  const splitColumnIntoSubRows = (
    colPath: PathStep[],
    preset: RowPreset,
  ) => {
    update(
      updateColumnAt(container, colPath, (col) => ({
        ...col,
        sectionRefs: undefined,
        rows: [buildRow(preset)],
      })),
    );
  };

  // Collapse a branch column back to a leaf (drops all nested rows).
  const collapseColumnToLeaf = (colPath: PathStep[]) => {
    update(
      updateColumnAt(container, colPath, (col) => ({
        ...col,
        rows: undefined,
        sectionRefs: [],
      })),
    );
  };

  // ───────── Render
  return (
    <SectionLabelsContext.Provider value={sectionLabels}>
    <div className="space-y-3">
      {/* Container settings — width selector. Edge-to-edge by default
           so existing marketing/home templates keep rendering full-bleed;
           content pages should switch this to a constrained width. */}
      <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Maximize2 className="h-3.5 w-3.5" />
          <span>Container width</span>
        </div>
        <Select
          value={currentWidth}
          onValueChange={(v) => setContainerWidth(v as any)}
        >
          <SelectTrigger className="h-7 w-44 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Full (edge-to-edge)</SelectItem>
            <SelectItem value="screen-xl">Wide (1280px)</SelectItem>
            <SelectItem value="screen-lg">Standard (1024px)</SelectItem>
            <SelectItem value="screen-md">Narrow (768px)</SelectItem>
            <SelectItem value="screen-sm">Reading (640px)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {container.rows.length === 0 ? (
        <button
          type="button"
          onClick={() =>
            setRowPickerCtx({ kind: 'append', rowPath: [] })
          }
          className="w-full rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/20 hover:bg-muted/40 transition-colors p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2"
        >
          <LayoutIcon className="h-6 w-6 text-muted-foreground/60" />
          <span className="font-medium">Add a layout</span>
          <span className="text-[11px]">
            Pick a row layout (1 / 2 / 3 / 4 columns) — sections drop in next.
          </span>
        </button>
      ) : (
        <>
          {container.rows.map((row, rowIdx) => (
            <RowView
              key={row.id}
              row={row}
              rowIdx={rowIdx}
              rowPath={[]}
              depth={0}
              isFirst={rowIdx === 0}
              isLast={rowIdx === container.rows.length - 1}
              onMoveRow={moveRow}
              onRemoveRow={removeRow}
              onPickSection={(colPath) =>
                setSectionPickerCtx({ colPath })
              }
              onClearSection={(colPath) =>
                setColumnSection(colPath, null)
              }
              onSplitColumn={(colPath) =>
                setRowPickerCtx({ kind: 'split', colPath })
              }
              onAppendSubRow={(rowPath) =>
                setRowPickerCtx({ kind: 'append', rowPath })
              }
              onCollapseColumn={collapseColumnToLeaf}
            />
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() =>
              setRowPickerCtx({ kind: 'append', rowPath: [] })
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            Add another row
          </Button>
        </>
      )}

      <LayoutPickerModal
        open={rowPickerCtx !== null}
        onClose={() => setRowPickerCtx(null)}
        onPick={(preset) => {
          if (!rowPickerCtx) return;
          if (rowPickerCtx.kind === 'append') {
            appendRow(rowPickerCtx.rowPath, preset);
          } else {
            splitColumnIntoSubRows(rowPickerCtx.colPath, preset);
          }
          setRowPickerCtx(null);
        }}
      />

      <SectionPickerModal
        open={sectionPickerCtx !== null}
        onClose={() => setSectionPickerCtx(null)}
        onPick={(ref) => {
          if (sectionPickerCtx) {
            setColumnSection(sectionPickerCtx.colPath, ref);
          }
        }}
        tenantId={tenantId}
      />
    </div>
    </SectionLabelsContext.Provider>
  );
}

// ───────────────────────────────────────────────────────────────────
// Recursive views
// ───────────────────────────────────────────────────────────────────

interface RowViewProps {
  row: PageLayoutRow;
  rowIdx: number;
  /** Path of the row container this row lives in (empty = root). */
  rowPath: PathStep[];
  /** Nesting depth (0 = top-level). Drives subtle styling cues. */
  depth: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveRow: (rowPath: PathStep[], idx: number, dir: -1 | 1) => void;
  onRemoveRow: (rowPath: PathStep[], idx: number) => void;
  onPickSection: (colPath: PathStep[]) => void;
  onClearSection: (colPath: PathStep[]) => void;
  onSplitColumn: (colPath: PathStep[]) => void;
  onAppendSubRow: (rowPath: PathStep[]) => void;
  onCollapseColumn: (colPath: PathStep[]) => void;
}

function RowView({
  row,
  rowIdx,
  rowPath,
  depth,
  isFirst,
  isLast,
  onMoveRow,
  onRemoveRow,
  onPickSection,
  onClearSection,
  onSplitColumn,
  onAppendSubRow,
  onCollapseColumn,
}: RowViewProps) {
  return (
    <div className="rounded-md border bg-card">
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b bg-muted/30">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {depth === 0 ? 'Row' : `Sub-row L${depth}`} {rowIdx + 1} ·{' '}
          {row.columns.map((c) => c.width).join(' + ')}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => onMoveRow(rowPath, rowIdx, -1)}
            className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move up"
          >
            <MoveUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={() => onMoveRow(rowPath, rowIdx, 1)}
            className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move down"
          >
            <MoveDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onRemoveRow(rowPath, rowIdx)}
            className="p-1 rounded hover:bg-destructive/10 hover:text-destructive"
            title="Remove row"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-2 p-2">
        {row.columns.map((col, colIdx) => (
          <ColumnView
            key={col.id}
            col={col}
            colPath={[...rowPath, { r: rowIdx, c: colIdx }]}
            depth={depth}
            onPickSection={onPickSection}
            onClearSection={onClearSection}
            onSplitColumn={onSplitColumn}
            onAppendSubRow={onAppendSubRow}
            onCollapseColumn={onCollapseColumn}
            onMoveRow={onMoveRow}
            onRemoveRow={onRemoveRow}
          />
        ))}
      </div>
    </div>
  );
}

interface ColumnViewProps {
  col: PageLayoutColumn;
  colPath: PathStep[];
  depth: number;
  onPickSection: (colPath: PathStep[]) => void;
  onClearSection: (colPath: PathStep[]) => void;
  onSplitColumn: (colPath: PathStep[]) => void;
  onAppendSubRow: (rowPath: PathStep[]) => void;
  onCollapseColumn: (colPath: PathStep[]) => void;
  onMoveRow: (rowPath: PathStep[], idx: number, dir: -1 | 1) => void;
  onRemoveRow: (rowPath: PathStep[], idx: number) => void;
}

const COL_SPAN_CLASS: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
};

function ColumnView({
  col,
  colPath,
  depth,
  onPickSection,
  onClearSection,
  onSplitColumn,
  onAppendSubRow,
  onCollapseColumn,
  onMoveRow,
  onRemoveRow,
}: ColumnViewProps) {
  const sectionLabels = React.useContext(SectionLabelsContext);
  const span = COL_SPAN_CLASS[col.width] ?? 'col-span-12';
  const isBranch = !!(col.rows && col.rows.length > 0);

  // Branch — render nested sub-rows recursively. The column's `colPath`
  // becomes the row-container path for its sub-rows.
  if (isBranch) {
    return (
      <div className={span}>
        <div className="rounded-md border-2 border-dashed border-primary/30 bg-primary/5 p-2 space-y-2">
          <div className="flex items-center justify-between gap-2 text-[10px]">
            <span className="font-medium uppercase tracking-wider text-primary/70">
              Sub-rows · column {col.width}/12
            </span>
            <button
              type="button"
              onClick={() => onCollapseColumn(colPath)}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-destructive"
              title="Collapse back to a single section cell"
            >
              <CornerUpLeft className="h-3 w-3" />
              Collapse
            </button>
          </div>
          {col.rows!.map((subRow, subIdx) => (
            <RowView
              key={subRow.id}
              row={subRow}
              rowIdx={subIdx}
              rowPath={colPath}
              depth={depth + 1}
              isFirst={subIdx === 0}
              isLast={subIdx === col.rows!.length - 1}
              onMoveRow={onMoveRow}
              onRemoveRow={onRemoveRow}
              onPickSection={onPickSection}
              onClearSection={onClearSection}
              onSplitColumn={onSplitColumn}
              onAppendSubRow={onAppendSubRow}
              onCollapseColumn={onCollapseColumn}
            />
          ))}
          <button
            type="button"
            onClick={() => onAppendSubRow(colPath)}
            className="w-full rounded-md border border-dashed border-primary/40 hover:border-primary/70 hover:bg-primary/10 transition-colors px-3 py-1.5 text-[11px] text-primary inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="h-3 w-3" />
            Add sub-row
          </button>
        </div>
      </div>
    );
  }

  // Leaf — sectionRefs (or empty cell with two options)
  const ref = (col.sectionRefs ?? [])[0];
  if (ref && (ref.sectionId || ref.sectionData)) {
    // Resolve display label from the section cache; fall back to a
    // dim id-slice when the section hasn't loaded yet (or was deleted).
    const label = ref.sectionId
      ? sectionLabels.get(String(ref.sectionId))
      : undefined;
    return (
      <div className={span}>
        <div className="rounded-md border bg-background px-3 py-2 text-xs flex items-center justify-between gap-2 min-h-[60px]">
          <span className="truncate min-w-0 flex-1">
            {ref.sectionId ? (
              label ? (
                <>
                  <span className="font-medium truncate">{label.name}</span>
                  {label.type && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {label.type}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="text-muted-foreground">Section:</span>{' '}
                  <span className="font-mono text-[10px]">
                    {String(ref.sectionId).slice(-8)}
                  </span>
                </>
              )
            ) : (
              <span className="text-muted-foreground">Inline section</span>
            )}
          </span>
          <div className="flex items-center gap-0.5 shrink-0">
            {ref.sectionId && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  // Open the section editor in a new tab so the
                  // page-builder draft stays intact. App-id is the
                  // first non-empty path segment (e.g. `/cms/...`);
                  // `?editId=<id>` is the cue the sections list
                  // page reads to auto-open the editor on mount.
                  const segs = window.location.pathname
                    .split('/')
                    .filter(Boolean);
                  const appId = segs[0] || '';
                  const url = `/${appId}/sections?editId=${ref.sectionId}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                className="p-1 rounded hover:bg-muted hover:text-foreground"
                title="Edit section (opens in new tab)"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onPickSection(colPath)}
              className="text-[10px] underline text-muted-foreground hover:text-foreground"
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => onClearSection(colPath)}
              className="p-1 rounded hover:bg-destructive/10 hover:text-destructive"
              title="Clear section"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty cell — choose: add a section, or split into sub-rows.
  return (
    <div className={span}>
      <div className="rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/10 hover:bg-muted/20 transition-colors p-2 min-h-[60px] flex flex-col justify-center gap-1.5">
        <button
          type="button"
          onClick={() => onPickSection(colPath)}
          className="rounded-sm border border-transparent hover:border-muted-foreground/40 hover:bg-background px-2 py-1.5 text-[11px] text-muted-foreground inline-flex items-center justify-center gap-1.5"
        >
          <Plus className="h-3 w-3" />
          Add section
        </button>
        <button
          type="button"
          onClick={() => onSplitColumn(colPath)}
          className="rounded-sm border border-transparent hover:border-primary/40 hover:bg-background px-2 py-1.5 text-[11px] text-muted-foreground inline-flex items-center justify-center gap-1.5"
        >
          <Split className="h-3 w-3" />
          Split into sub-rows
        </button>
      </div>
    </div>
  );
}

// Stable-ish ID for layout nodes. Layout tree lives inside the form's
// state, so collisions are local; a short timestamp+random tail is
// fine and keeps server payloads small.
function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}
