'use client';

import React, { useState } from 'react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui';
import { Input, Button, Textarea, Switch } from '@repo/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import {
  Plus,
  Trash2,
  Settings2,
  Type,
  Layout,
  Columns,
  Rows,
  TableProperties,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Upload,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { toastError, toastSuccess } from '@repo/utils';
import type { DataTableSectionFormData } from './data-table-types';
import { EditorSection } from './_shared/EditorSection';
import {
  parseSpreadsheetFile,
  inferColumnType,
  slugifyHeader,
  uniquifyKeys,
  type ParsedSpreadsheet,
} from './_shared/spreadsheet-import';

interface DataTableSectionFormProps {
  form: UseFormReturn<DataTableSectionFormData>;
  onSubmit: (data: DataTableSectionFormData) => void;
  onCancel: () => void;
  saving?: boolean;
  tenantId?: string;
}

function slugifyKey(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 32);
}

export function DataTableSectionForm({
  form,
  onSubmit,
}: DataTableSectionFormProps) {
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [importPreview, setImportPreview] = useState<ParsedSpreadsheet | null>(
    null,
  );
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [importBusy, setImportBusy] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    fields: columns,
    append: appendColumn,
    remove: removeColumn,
  } = useFieldArray({
    control: form.control,
    name: 'table.columns',
  });

  const {
    fields: rows,
    append: appendRow,
    remove: removeRow,
    move: moveRow,
  } = useFieldArray({
    control: form.control,
    // RHF's useFieldArray needs each row to be an object — rows are
    // `Record<string, any>` so we cast through `any` to satisfy the
    // generic. The runtime is unaffected.
    name: 'table.rows' as any,
  });

  const toggleRow = (idx: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // When a column is removed, prune its values from every existing row
  // so the form data stays consistent with the column list.
  const handleRemoveColumn = (idx: number) => {
    const colKey = form.getValues(`table.columns.${idx}.key`);
    removeColumn(idx);
    if (!colKey) return;
    const currentRows: Array<Record<string, unknown>> =
      form.getValues('table.rows') || [];
    currentRows.forEach((_, rIdx) => {
      const row = { ...(form.getValues(`table.rows.${rIdx}` as any) || {}) };
      if (colKey in row) {
        delete row[colKey];
        form.setValue(`table.rows.${rIdx}` as any, row, { shouldDirty: true });
      }
    });
  };

  // ── CSV / XLSX import ───────────────────────────────────────────────
  // Two-step UX: pick a file → parse + show inline preview → author
  // confirms with "Apply". Replace mode wipes columns + rows; append
  // mode keeps columns and only adds rows (header text → column key
  // matched case-insensitively; unmatched columns drop their cells).
  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so picking the same file again re-fires the event.
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    setImportBusy(true);
    try {
      const parsed = await parseSpreadsheetFile(file);
      if (parsed.headers.length === 0) {
        toastError('No headers detected in the spreadsheet');
        return;
      }
      setImportPreview(parsed);
      // If the form is empty default to replace; otherwise default to
      // append so authors don't accidentally nuke existing data.
      const existingRows = form.getValues('table.rows')?.length ?? 0;
      setImportMode(existingRows > 0 ? 'append' : 'replace');
    } catch (err: any) {
      toastError(err?.message || 'Failed to parse spreadsheet');
    } finally {
      setImportBusy(false);
    }
  };

  const applyImport = () => {
    if (!importPreview) return;
    const { headers, rows } = importPreview;

    if (importMode === 'replace') {
      // Drop existing columns + rows entirely. Type inference runs on
      // the first ~50 sample values per column to pick a default `type`
      // — author can change it afterwards in the column row.
      const keys = uniquifyKeys(headers.map((h) => slugifyHeader(h) || 'col'));
      const newColumns = headers.map((header, cIdx) => {
        const sampleValues = rows
          .slice(0, 50)
          .map((row) => row[cIdx] ?? '');
        return {
          key: keys[cIdx],
          label: { en: header, mm: '' },
          type: inferColumnType(sampleValues),
          sortable: true,
          filterable: true,
        };
      });
      const newRows = rows.map((row) => {
        const obj: Record<string, string> = {};
        keys.forEach((key, cIdx) => {
          obj[key] = row[cIdx] ?? '';
        });
        return obj;
      });

      form.setValue('table.columns', newColumns as any, { shouldDirty: true });
      form.setValue('table.rows', newRows as any, { shouldDirty: true });
      toastSuccess(
        `Imported ${rows.length} row${rows.length === 1 ? '' : 's'} × ${headers.length} column${headers.length === 1 ? '' : 's'}`,
      );
    } else {
      // Append: match by header label (EN, case-insensitive). Drop
      // unmatched columns. Existing column types/keys/order are
      // preserved so author work isn't undone.
      const existingCols = form.getValues('table.columns') || [];
      const labelToKey = new Map<string, string>();
      existingCols.forEach((c: any) => {
        const en = (c.label?.en || '').trim().toLowerCase();
        if (en && c.key) labelToKey.set(en, c.key);
      });

      const colMapping: Array<{ srcIdx: number; key: string } | null> =
        headers.map((h, idx) => {
          const k = labelToKey.get(h.trim().toLowerCase());
          return k ? { srcIdx: idx, key: k } : null;
        });

      const matched = colMapping.filter(Boolean).length;
      if (matched === 0) {
        toastError(
          'None of the spreadsheet headers match existing columns. Use Replace mode instead.',
        );
        return;
      }

      const appendedRows = rows.map((row) => {
        const obj: Record<string, string> = {};
        colMapping.forEach((m) => {
          if (m) obj[m.key] = row[m.srcIdx] ?? '';
        });
        return obj;
      });

      const existingRows = form.getValues('table.rows') || [];
      form.setValue(
        'table.rows',
        [...existingRows, ...appendedRows] as any,
        { shouldDirty: true },
      );
      const skipped = headers.length - matched;
      toastSuccess(
        `Appended ${appendedRows.length} row${appendedRows.length === 1 ? '' : 's'}` +
          (skipped > 0
            ? ` (${skipped} unmatched column${skipped === 1 ? '' : 's'} skipped)`
            : ''),
      );
    }

    setImportPreview(null);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 p-3">
        {/* ───────── Section settings ───────── */}
        <EditorSection
          title="Section settings"
          icon={<Settings2 className="h-3.5 w-3.5" />}
          defaultOpen={false}
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Internal name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., Tuition Fees · Schedule · Comparison"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isReusable"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-2">
                  <FormLabel className="text-xs">Reusable</FormLabel>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isVisible"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-2">
                  <FormLabel className="text-xs">Visible</FormLabel>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormItem>
              )}
            />
          </div>
        </EditorSection>

        {/* ───────── Section header ───────── */}
        <EditorSection
          title="Section header"
          icon={<Type className="h-3.5 w-3.5" />}
          defaultOpen={false}
        >
          <Tabs
            value={langTab}
            onValueChange={(v) => setLangTab(v as 'en' | 'mm')}
          >
            <TabsList className="h-8">
              <TabsTrigger value="en" className="text-xs px-3 py-1">
                EN
              </TabsTrigger>
              <TabsTrigger value="mm" className="text-xs px-3 py-1">
                MM
              </TabsTrigger>
            </TabsList>
            <TabsContent value="en" className="space-y-3 mt-3">
              <FormField
                control={form.control}
                name="headline.en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headline</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="At a glance" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description.en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="caption.en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caption (under table)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Prices effective from 2026 · USD"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </TabsContent>
            <TabsContent value="mm" className="space-y-3 mt-3">
              <FormField
                control={form.control}
                name="headline.mm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ခေါင်းစဥ် (မြန်မာ)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description.mm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ဖော်ပြချက် (မြန်မာ)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="caption.mm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ဇယားအောက်စာသား (မြန်မာ)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
        </EditorSection>

        {/* ───────── Import from CSV / Excel ─────────
            Two-step UX: pick file → inline preview → confirm with
            Apply. Replace mode (default when empty) wipes columns +
            rows. Append mode (default when rows exist) matches headers
            by EN label and adds new rows only. */}
        <EditorSection
          title="Import from CSV / Excel"
          icon={<FileSpreadsheet className="h-3.5 w-3.5" />}
          defaultOpen={false}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={handleFilePick}
          />
          {!importPreview ? (
            <>
              <p className="text-xs text-muted-foreground">
                Upload a spreadsheet to seed the table. The first row
                becomes column labels; remaining rows fill the data.
                Column types are auto-detected — you can fine-tune them
                below after import.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={importBusy}
                onClick={() => fileInputRef.current?.click()}
              >
                {importBusy ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    Parsing…
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    Choose CSV / Excel file
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">
                Detected{' '}
                <span className="font-semibold tabular-nums">
                  {importPreview.rows.length}
                </span>{' '}
                row
                {importPreview.rows.length === 1 ? '' : 's'} ×{' '}
                <span className="font-semibold tabular-nums">
                  {importPreview.headers.length}
                </span>{' '}
                column
                {importPreview.headers.length === 1 ? '' : 's'}
              </div>

              <div>
                <FormLabel className="text-xs">Mode</FormLabel>
                <Select
                  value={importMode}
                  onValueChange={(v) => setImportMode(v as 'replace' | 'append')}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="replace">
                      Replace — overwrite columns + rows
                    </SelectItem>
                    <SelectItem value="append">
                      Append — match headers, add rows only
                    </SelectItem>
                  </SelectContent>
                </Select>
                {importMode === 'append' &&
                  (form.getValues('table.columns')?.length ?? 0) === 0 && (
                    <p className="text-[11px] text-amber-600 mt-1">
                      No existing columns to match — switch to Replace.
                    </p>
                  )}
              </div>

              {/* Inline preview — first 5 rows × first 6 columns. Wide
                  imports overflow horizontally rather than wrapping. */}
              <div className="overflow-x-auto rounded border max-h-48">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      {importPreview.headers
                        .slice(0, 6)
                        .map((h, idx) => (
                          <th
                            key={idx}
                            className="text-left px-2 py-1 font-semibold whitespace-nowrap"
                          >
                            {h || <em className="text-muted-foreground">(blank)</em>}
                          </th>
                        ))}
                      {importPreview.headers.length > 6 && (
                        <th className="text-left px-2 py-1 font-semibold text-muted-foreground">
                          +{importPreview.headers.length - 6} more
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.rows.slice(0, 5).map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="border-b last:border-b-0 hover:bg-muted/30"
                      >
                        {row.slice(0, 6).map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="px-2 py-1 whitespace-nowrap truncate max-w-[120px]"
                            title={cell}
                          >
                            {cell || (
                              <span className="text-muted-foreground/50">
                                —
                              </span>
                            )}
                          </td>
                        ))}
                        {importPreview.headers.length > 6 && (
                          <td className="px-2 py-1 text-muted-foreground/50">
                            …
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importPreview.rows.length > 5 && (
                <div className="text-[11px] text-muted-foreground text-center">
                  …and {importPreview.rows.length - 5} more rows
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={applyImport}
                  disabled={
                    importMode === 'append' &&
                    (form.getValues('table.columns')?.length ?? 0) === 0
                  }
                >
                  <Upload className="h-3.5 w-3.5 mr-1" />
                  Apply ({importMode})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setImportPreview(null)}
                >
                  Discard
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importBusy}
                >
                  Re-upload
                </Button>
              </div>
            </div>
          )}
        </EditorSection>

        {/* ───────── Columns ───────── */}
        <EditorSection
          title="Columns"
          icon={<Columns className="h-3.5 w-3.5" />}
          badge={
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {columns.length}/10
            </span>
          }
          alwaysOpen
        >
          <div className="flex items-center justify-end -mt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={columns.length >= 10}
              onClick={() => {
                const next = columns.length + 1;
                appendColumn({
                  key: `col_${next}`,
                  label: { en: `Column ${next}`, mm: '' },
                  type: 'text',
                  sortable: true,
                  filterable: true,
                });
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add column
            </Button>
          </div>

          {columns.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              At least one column is required.
            </p>
          )}

          <div className="space-y-2">
            {columns.map((col, idx) => (
              <div
                key={col.id}
                className="rounded-md border p-2 space-y-2 bg-muted/20"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Column {idx + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-destructive"
                    disabled={columns.length <= 1}
                    onClick={() => handleRemoveColumn(idx)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name={`table.columns.${idx}.label.en`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Label (EN)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-8"
                            onChange={(e) => {
                              field.onChange(e);
                              const currentKey = form.getValues(
                                `table.columns.${idx}.key`,
                              );
                              if (
                                !currentKey ||
                                /^col_\d+$/.test(currentKey)
                              ) {
                                const slug = slugifyKey(e.target.value);
                                if (slug) {
                                  form.setValue(
                                    `table.columns.${idx}.key`,
                                    slug,
                                    { shouldDirty: true },
                                  );
                                }
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`table.columns.${idx}.label.mm`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Label (MM)</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-8" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <FormField
                    control={form.control}
                    name={`table.columns.${idx}.key`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Key</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-8 font-mono text-xs"
                            placeholder="auto"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`table.columns.${idx}.align`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Align</FormLabel>
                        <Select
                          value={field.value || 'left'}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`table.columns.${idx}.type`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Type</FormLabel>
                        <Select
                          value={field.value || 'text'}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="boolean">Yes/No</SelectItem>
                            <SelectItem value="currency">Currency</SelectItem>
                            <SelectItem value="percentage">
                              Percentage
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name={`table.columns.${idx}.sortable`}
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border p-2">
                        <FormLabel className="text-xs">Sortable</FormLabel>
                        <Switch
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`table.columns.${idx}.filterable`}
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border p-2">
                        <FormLabel className="text-xs">Filterable</FormLabel>
                        <Switch
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name={`table.columns.${idx}.width`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        Width (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8"
                          placeholder="e.g., 120px · 20% · auto"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </div>
        </EditorSection>

        {/* ───────── Rows ───────── */}
        <EditorSection
          title="Rows"
          icon={<Rows className="h-3.5 w-3.5" />}
          badge={
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {rows.length}
            </span>
          }
          alwaysOpen
        >
          <div className="flex items-center justify-end -mt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                appendRow({} as any);
                setExpandedRows((prev) => new Set(prev).add(rows.length));
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add row
            </Button>
          </div>

          {rows.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              No rows yet. Add columns first, then start adding rows.
            </p>
          )}

          <div className="space-y-2">
            {rows.map((row, rIdx) => {
              const isOpen = expandedRows.has(rIdx);
              const cells: Record<string, unknown> =
                form.watch(`table.rows.${rIdx}` as any) || {};
              const firstCol = columns[0];
              const firstVal = firstCol ? cells[firstCol.key] : undefined;
              const title =
                typeof firstVal === 'string'
                  ? firstVal
                  : (firstVal as any)?.en ||
                    (firstVal as any)?.mm ||
                    `Row ${rIdx + 1}`;

              return (
                <div
                  key={(row as any).id ?? rIdx}
                  className="rounded-md border bg-background"
                >
                  <div className="flex items-center gap-2 p-2 bg-muted/40">
                    <button
                      type="button"
                      onClick={() => toggleRow(rIdx)}
                      className="flex-1 flex items-center gap-2 text-left min-w-0"
                    >
                      {isOpen ? (
                        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span className="text-xs font-medium truncate">
                        {title}
                      </span>
                    </button>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        disabled={rIdx === 0}
                        onClick={() => moveRow(rIdx, rIdx - 1)}
                        title="Move up"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        disabled={rIdx === rows.length - 1}
                        onClick={() => moveRow(rIdx, rIdx + 1)}
                        title="Move down"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-destructive"
                        onClick={() => removeRow(rIdx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="p-3 border-t space-y-3">
                      <Tabs
                        value={langTab}
                        onValueChange={(v) => setLangTab(v as 'en' | 'mm')}
                      >
                        <TabsList className="h-8">
                          <TabsTrigger value="en" className="text-xs px-3 py-1">
                            EN
                          </TabsTrigger>
                          <TabsTrigger value="mm" className="text-xs px-3 py-1">
                            MM
                          </TabsTrigger>
                        </TabsList>
                        {(['en', 'mm'] as const).map((lang) => (
                          <TabsContent
                            key={lang}
                            value={lang}
                            className="space-y-2 mt-3"
                          >
                            {columns.map((col, cIdx) => {
                              const colKey = form.watch(
                                `table.columns.${cIdx}.key`,
                              );
                              const headerLabel =
                                form.watch(
                                  `table.columns.${cIdx}.label.${lang}`,
                                ) ||
                                form.watch(`table.columns.${cIdx}.label.en`) ||
                                colKey;
                              const colType = form.watch(
                                `table.columns.${cIdx}.type`,
                              );
                              return (
                                <FormField
                                  key={(col as any).id ?? cIdx}
                                  control={form.control}
                                  name={
                                    `table.rows.${rIdx}.${colKey}.${lang}` as any
                                  }
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs flex items-center gap-1">
                                        {headerLabel}
                                        <span className="text-muted-foreground/60 font-normal">
                                          ({colType})
                                        </span>
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          value={
                                            typeof field.value === 'string'
                                              ? field.value
                                              : ''
                                          }
                                          className="h-8"
                                          placeholder={
                                            colType === 'boolean'
                                              ? 'true / false'
                                              : colType === 'date'
                                                ? 'YYYY-MM-DD'
                                                : colType === 'currency'
                                                  ? '1,200'
                                                  : ''
                                          }
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              );
                            })}
                          </TabsContent>
                        ))}
                      </Tabs>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </EditorSection>

        {/* ───────── Features (runtime widget toggles) ───────── */}
        <EditorSection
          title="Table features"
          icon={<Sparkles className="h-3.5 w-3.5" />}
          defaultOpen={false}
        >
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="features.search"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-2">
                  <FormLabel className="text-xs">Search</FormLabel>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="features.sort"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-2">
                  <FormLabel className="text-xs">Sort</FormLabel>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="features.filter"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-2">
                  <FormLabel className="text-xs">Filter</FormLabel>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="features.pagination"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-2">
                  <FormLabel className="text-xs">Pagination</FormLabel>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="features.export"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-2 col-span-2">
                  <FormLabel className="text-xs">Export</FormLabel>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="rowsPerPage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Rows per page</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : 10,
                      )
                    }
                    className="h-8"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </EditorSection>

        {/* ───────── Styling ───────── */}
        <EditorSection
          title="Table styling"
          icon={<TableProperties className="h-3.5 w-3.5" />}
          defaultOpen={false}
        >
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="styling.striped"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-2">
                  <FormLabel className="text-xs">Zebra stripes</FormLabel>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="styling.bordered"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-2">
                  <FormLabel className="text-xs">Bordered</FormLabel>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="styling.hover"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-2">
                  <FormLabel className="text-xs">Highlight on hover</FormLabel>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="styling.compact"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-2">
                  <FormLabel className="text-xs">Compact rows</FormLabel>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormItem>
              )}
            />
          </div>
        </EditorSection>

        {/* ───────── Layout & visuals ───────── */}
        <EditorSection
          title="Layout & visuals"
          icon={<Layout className="h-3.5 w-3.5" />}
          defaultOpen={false}
        >
          <FormField
            control={form.control}
            name="containerSettings.width"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Container width</FormLabel>
                <Select
                  value={field.value || 'contained'}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="contained">Contained</SelectItem>
                    <SelectItem value="fullWidth">Full width</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="containerSettings.maxWidth"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">
                  Custom max width (used when container = custom)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="h-8"
                    placeholder="e.g., 1100px"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="textColors.headline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Headline color</FormLabel>
                  <FormControl>
                    <Input {...field} type="color" className="h-8 p-1" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="textColors.body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Body text color</FormLabel>
                  <FormControl>
                    <Input {...field} type="color" className="h-8 p-1" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="headlineSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Headline size (px)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={16}
                    max={72}
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    className="h-8"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </EditorSection>

        {/* Hidden submit so Cmd+S still triggers form submit when focus is in
            an input — top-bar Save button is the primary affordance. */}
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Form>
  );
}
