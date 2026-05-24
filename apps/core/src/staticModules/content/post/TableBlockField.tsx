'use client';

import React, { useRef, useState } from 'react';
import {
  Input,
  Button,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  FormLabel,
  FormDescription,
} from '@repo/ui';
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Trash2,
  Upload,
  Table2,
  Loader2,
} from 'lucide-react';
import { toastError, toastSuccess } from '@repo/utils';
import type { TableBlock, TableColumn, TableColumnType } from '../common/types';

interface TableBlockFieldProps {
  value?: TableBlock;
  onChange: (next: TableBlock) => void;
}

const EMPTY: TableBlock = {
  columns: [],
  rows: [],
  settings: { pageSize: 10, searchable: true, sortable: true },
};

const COLUMN_TYPES: Array<{ value: TableColumnType; label: string }> = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'link', label: 'Link / URL' },
];

/** Best-effort slug — for auto-suggesting a column `key` from its label. */
function slugifyKey(label: string): string {
  const s = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!s || /^[0-9]/.test(s)) return `col_${s || Date.now()}`;
  return s;
}

/**
 * Tabular block editor. Three sections:
 *   1. Columns — key + label + type, add / remove / reorder
 *   2. Rows — input grid where each cell respects its column type
 *   3. Settings — page size, searchable, sortable
 *
 * CSV / XLSX import lives at the top of Rows. The first row is treated as
 * headers and matched against existing column keys (case-insensitive,
 * slugified). Unknown headers are added as new text columns.
 */
export function TableBlockField({ value, onChange }: TableBlockFieldProps) {
  const block: TableBlock = value ?? EMPTY;
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);

  const update = (next: Partial<TableBlock>) =>
    onChange({ ...block, ...next });

  // ---------- columns ----------

  const addColumn = () => {
    const idx = block.columns.length;
    const col: TableColumn = {
      key: `col_${idx + 1}`,
      label: `Column ${idx + 1}`,
      type: 'text',
    };
    update({ columns: [...block.columns, col] });
  };

  const removeColumn = (idx: number) => {
    const removed = block.columns[idx];
    const cols = block.columns.filter((_, i) => i !== idx);
    // Drop the value from each existing row.
    const rows = block.rows.map((r) => {
      const next = { ...r };
      delete next[removed.key];
      return next;
    });
    update({ columns: cols, rows });
  };

  const moveColumn = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= block.columns.length) return;
    const cols = [...block.columns];
    [cols[idx], cols[target]] = [cols[target], cols[idx]];
    update({ columns: cols });
  };

  const setColumnField = (
    idx: number,
    field: keyof TableColumn,
    val: string,
  ) => {
    const cols = [...block.columns];
    const old = cols[idx];

    if (field === 'label') {
      // If the user is editing label and key was auto-derived, keep them in
      // sync until the user edits the key directly.
      const autoFromOld = slugifyKey(old.label);
      const newCol: TableColumn = { ...old, label: val };
      if (old.key === autoFromOld) {
        const newKey = slugifyKey(val);
        const collision = cols.some((c, i) => i !== idx && c.key === newKey);
        if (!collision && newKey) newCol.key = newKey;
      }
      cols[idx] = newCol;
    } else if (field === 'key') {
      // Disallow collision with another column.
      if (cols.some((c, i) => i !== idx && c.key === val)) {
        toastError(`Column key "${val}" is already used.`);
        return;
      }
      // Rewrite each row's key.
      const rows = block.rows.map((r) => {
        const { [old.key]: prev, ...rest } = r;
        return { ...rest, [val]: prev } as Record<string, unknown>;
      });
      cols[idx] = { ...old, key: val };
      update({ columns: cols, rows });
      return;
    } else if (field === 'type') {
      cols[idx] = { ...old, type: val as TableColumnType };
    }
    update({ columns: cols });
  };

  // ---------- rows ----------

  const addRow = () => {
    const empty: Record<string, unknown> = {};
    for (const c of block.columns) empty[c.key] = '';
    update({ rows: [...block.rows, empty] });
  };

  const removeRow = (idx: number) => {
    update({ rows: block.rows.filter((_, i) => i !== idx) });
  };

  const moveRow = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= block.rows.length) return;
    const rows = [...block.rows];
    [rows[idx], rows[target]] = [rows[target], rows[idx]];
    update({ rows });
  };

  const setCell = (rowIdx: number, key: string, raw: string) => {
    const col = block.columns.find((c) => c.key === key);
    let val: unknown = raw;
    if (col?.type === 'number') {
      val = raw === '' ? '' : Number(raw);
      if (typeof val === 'number' && Number.isNaN(val)) val = raw; // keep raw on bad input
    }
    const rows = [...block.rows];
    rows[rowIdx] = { ...rows[rowIdx], [key]: val };
    update({ rows });
  };

  // ---------- import ----------

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again later
    if (!file) return;
    setImporting(true);
    try {
      // Dynamic import keeps the ~600KB xlsx out of the initial bundle.
      const xlsx = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = xlsx.read(buf, { type: 'array' });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) {
        toastError('No sheet found in file.');
        return;
      }
      const sheet = wb.Sheets[sheetName];
      const rows: any[][] = xlsx.utils.sheet_to_json(sheet, {
        header: 1,
        blankrows: false,
        defval: '',
      });
      if (rows.length === 0) {
        toastError('Empty file.');
        return;
      }

      const [headerRow, ...dataRows] = rows;
      const headers = headerRow.map((h) => String(h ?? '').trim());

      // Map each header to an existing column key (case-insensitive on label
      // or key, slugified). New headers create new text columns.
      const cols: TableColumn[] = [...block.columns];
      const headerToKey: string[] = headers.map((h) => {
        const slug = slugifyKey(h);
        const existing = cols.find(
          (c) =>
            c.key.toLowerCase() === slug ||
            c.label.toLowerCase() === h.toLowerCase(),
        );
        if (existing) return existing.key;
        // Avoid duplicate keys by suffixing.
        let key = slug;
        let i = 1;
        while (cols.some((c) => c.key === key)) {
          key = `${slug}_${i++}`;
        }
        cols.push({ key, label: h || `Column ${cols.length + 1}`, type: 'text' });
        return key;
      });

      const newRows: Array<Record<string, unknown>> = dataRows.map((r) => {
        const obj: Record<string, unknown> = {};
        for (let i = 0; i < headerToKey.length; i++) {
          obj[headerToKey[i]] = r[i] ?? '';
        }
        return obj;
      });

      update({ columns: cols, rows: [...block.rows, ...newRows] });
      toastSuccess(`Imported ${newRows.length} row(s) from ${file.name}`);
    } catch (err) {
      toastError(
        err instanceof Error ? err.message : 'Failed to import file',
      );
    } finally {
      setImporting(false);
    }
  };

  // ---------- settings ----------

  const setSetting = <K extends keyof TableBlock['settings']>(
    key: K,
    val: TableBlock['settings'][K],
  ) => update({ settings: { ...block.settings, [key]: val } });

  // ---------- render ----------

  return (
    <div className="space-y-4">
      {/* COLUMNS */}
      <div className="rounded-md border bg-background p-3 space-y-2">
        <div className="flex items-center justify-between">
          <FormLabel className="text-sm flex items-center gap-1">
            <Table2 className="h-3 w-3" /> Columns
          </FormLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addColumn}
          >
            <Plus className="h-3 w-3 mr-1" /> Add column
          </Button>
        </div>
        {block.columns.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center">
            No columns yet. Click <em>Add column</em> or import a CSV/XLSX.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {block.columns.map((c, idx) => (
              <li
                key={`${c.key}-${idx}`}
                className="grid grid-cols-12 gap-2 items-center"
              >
                <Input
                  value={c.label}
                  onChange={(e) =>
                    setColumnField(idx, 'label', e.target.value)
                  }
                  placeholder="Label"
                  className="col-span-4 h-8 text-xs"
                />
                <Input
                  value={c.key}
                  onChange={(e) =>
                    setColumnField(idx, 'key', e.target.value)
                  }
                  placeholder="key"
                  className="col-span-3 h-8 text-xs font-mono"
                />
                <div className="col-span-3">
                  <Select
                    value={c.type}
                    onValueChange={(v) => setColumnField(idx, 'type', v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMN_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={idx === 0}
                    onClick={() => moveColumn(idx, -1)}
                    title="Move left"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={idx === block.columns.length - 1}
                    onClick={() => moveColumn(idx, 1)}
                    title="Move right"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive"
                    onClick={() => removeColumn(idx)}
                    title="Remove"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ROWS */}
      <div className="rounded-md border bg-background p-3 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <FormLabel className="text-sm">
            Rows ({block.rows.length})
          </FormLabel>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.tsv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={onFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPickFile}
              disabled={importing}
            >
              {importing ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Upload className="h-3 w-3 mr-1" />
              )}
              Import CSV/XLSX
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRow}
              disabled={block.columns.length === 0}
            >
              <Plus className="h-3 w-3 mr-1" /> Add row
            </Button>
          </div>
        </div>
        {block.columns.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center">
            Define at least one column before adding rows.
          </p>
        ) : block.rows.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center">
            No rows yet. Use <em>Add row</em> for line-by-line entry, or{' '}
            <em>Import CSV/XLSX</em>.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/40">
                  {block.columns.map((c) => (
                    <th
                      key={c.key}
                      className="px-2 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap"
                    >
                      {c.label}
                      <span className="ml-1 text-[10px] opacity-60">
                        ({c.type})
                      </span>
                    </th>
                  ))}
                  <th className="px-2 py-1.5 w-20" />
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b last:border-b-0">
                    {block.columns.map((c) => {
                      const v = row[c.key];
                      const inputType =
                        c.type === 'number'
                          ? 'number'
                          : c.type === 'date'
                            ? 'date'
                            : c.type === 'link'
                              ? 'url'
                              : 'text';
                      return (
                        <td key={c.key} className="px-1 py-1">
                          <Input
                            type={inputType}
                            value={v == null ? '' : String(v)}
                            onChange={(e) =>
                              setCell(rIdx, c.key, e.target.value)
                            }
                            className="h-7 text-xs"
                          />
                        </td>
                      );
                    })}
                    <td className="px-1 py-1">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          disabled={rIdx === 0}
                          onClick={() => moveRow(rIdx, -1)}
                          title="Move up"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          disabled={rIdx === block.rows.length - 1}
                          onClick={() => moveRow(rIdx, 1)}
                          title="Move down"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive"
                          onClick={() => removeRow(rIdx)}
                          title="Remove row"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SETTINGS */}
      <div className="rounded-md border bg-muted/30 p-3 space-y-2">
        <FormLabel className="text-sm">Display settings</FormLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <FormLabel className="text-xs">Page size</FormLabel>
            <Input
              type="number"
              min={0}
              value={block.settings.pageSize}
              onChange={(e) =>
                setSetting(
                  'pageSize',
                  Math.max(0, Number(e.target.value) || 0),
                )
              }
              className="h-8 text-xs"
            />
            <FormDescription className="text-[10px]">
              0 = no pagination
            </FormDescription>
          </div>
          <label className="flex items-start gap-2 text-xs cursor-pointer pt-5">
            <Checkbox
              checked={block.settings.searchable}
              onCheckedChange={(c) =>
                setSetting('searchable', c === true)
              }
            />
            <div>
              <div>Show search box</div>
              <div className="text-[10px] text-muted-foreground">
                Public renderer adds a free-text filter above the table.
              </div>
            </div>
          </label>
          <label className="flex items-start gap-2 text-xs cursor-pointer pt-5">
            <Checkbox
              checked={block.settings.sortable}
              onCheckedChange={(c) => setSetting('sortable', c === true)}
            />
            <div>
              <div>Allow column sort</div>
              <div className="text-[10px] text-muted-foreground">
                Click a header on the public site to sort by that column.
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
