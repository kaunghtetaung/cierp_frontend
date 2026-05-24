'use client';

import React from 'react';
import {
  Input,
  Button,
  Checkbox,
  FormLabel,
  FormDescription,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { ArrowDown, ArrowUp, Plus, Trash2, Settings2 } from 'lucide-react';
import type {
  AttributeDefinition,
  AttributeType,
} from '../common/types';

interface AttributeBuilderProps {
  value: AttributeDefinition[];
  onChange: (next: AttributeDefinition[]) => void;
}

const TYPE_OPTIONS: Array<{ value: AttributeType; label: string }> = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'rich-text', label: 'Rich text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Boolean (checkbox)' },
  { value: 'select', label: 'Select (dropdown)' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' },
];

function slugifyName(label: string): string {
  const s = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!s || /^[0-9]/.test(s)) return `attr_${s || Date.now()}`;
  return s;
}

/**
 * Editor for a PostType's `attributes[]` (== backend `customAttributes[]`).
 *
 * Each row exposes: name (slug-style key), label, type, required, options
 * (when type=select), validation (collapsed by default, only the fields
 * relevant to the type).
 *
 * Reorder ▲▼; remove via 🗑.
 */
export function AttributeBuilder({ value, onChange }: AttributeBuilderProps) {
  const items = value ?? [];

  const update = (idx: number, patch: Partial<AttributeDefinition>) => {
    const next = items.slice();
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const setLabel = (idx: number, label: string) => {
    const old = items[idx];
    const autoFromOld = slugifyName(old.label);
    const patch: Partial<AttributeDefinition> = { label };
    if (old.name === autoFromOld) {
      const next = slugifyName(label);
      const collision = items.some((a, i) => i !== idx && a.name === next);
      if (!collision && next) patch.name = next;
    }
    update(idx, patch);
  };

  const setName = (idx: number, name: string) => {
    if (items.some((a, i) => i !== idx && a.name === name)) return;
    update(idx, { name });
  };

  const add = () => {
    const idx = items.length;
    onChange([
      ...items,
      {
        name: `attr_${idx + 1}`,
        label: `Attribute ${idx + 1}`,
        type: 'text',
        required: false,
        order: idx,
      },
    ]);
  };

  const remove = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = items.slice();
    [next[idx], next[target]] = [next[target], next[idx]];
    // Re-stamp order to match index.
    next.forEach((a, i) => (a.order = i));
    onChange(next);
  };

  const setOptions = (idx: number, raw: string) => {
    // Comma-separated input → string array.
    const opts = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    update(idx, { options: opts.length > 0 ? opts : undefined });
  };

  const setValidation = (
    idx: number,
    key: keyof NonNullable<AttributeDefinition['validation']>,
    raw: string,
  ) => {
    const old = items[idx].validation ?? {};
    let val: any = raw === '' ? undefined : raw;
    if (key === 'min' || key === 'max' || key === 'minLength' || key === 'maxLength') {
      val = raw === '' ? undefined : Number(raw);
      if (val !== undefined && Number.isNaN(val)) val = undefined;
    }
    const nextVal = { ...old, [key]: val };
    const cleaned = Object.fromEntries(
      Object.entries(nextVal).filter(([, v]) => v !== undefined && v !== ''),
    );
    update(idx, {
      validation:
        Object.keys(cleaned).length > 0
          ? (cleaned as AttributeDefinition['validation'])
          : undefined,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <FormLabel className="text-sm">Custom attributes</FormLabel>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            ({items.length})
          </span>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-3 w-3 mr-1" /> Add attribute
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-3 text-center rounded-md border border-dashed">
          No custom attributes. Posts of this type will only have the standard
          fields (title, body, etc.). Click <em>Add attribute</em> to define
          extra fields like <em>Urgency</em>, <em>Event date</em>, etc.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((attr, idx) => (
            <li
              key={`${attr.name}-${idx}`}
              className="rounded-md border bg-background p-3 space-y-2"
            >
              {/* Top row: name, label, type, ordering */}
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-12 sm:col-span-3">
                  <FormLabel className="text-[10px] text-muted-foreground">
                    Name (key)
                  </FormLabel>
                  <Input
                    value={attr.name}
                    onChange={(e) => setName(idx, e.target.value)}
                    placeholder="e.g. urgency"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="col-span-12 sm:col-span-4">
                  <FormLabel className="text-[10px] text-muted-foreground">
                    Label
                  </FormLabel>
                  <Input
                    value={attr.label}
                    onChange={(e) => setLabel(idx, e.target.value)}
                    placeholder="e.g. Urgency Level"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-8 sm:col-span-3">
                  <FormLabel className="text-[10px] text-muted-foreground">
                    Type
                  </FormLabel>
                  <Select
                    value={attr.type}
                    onValueChange={(v) =>
                      update(idx, { type: v as AttributeType })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4 sm:col-span-2 flex items-center justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={idx === 0}
                    onClick={() => move(idx, -1)}
                    title="Move up"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={idx === items.length - 1}
                    onClick={() => move(idx, 1)}
                    title="Move down"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive"
                    onClick={() => remove(idx)}
                    title="Remove"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Required toggle + options (when select) */}
              <div className="grid grid-cols-12 gap-2 items-start">
                <label className="col-span-4 flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox
                    checked={attr.required}
                    onCheckedChange={(c) =>
                      update(idx, { required: c === true })
                    }
                  />
                  Required
                </label>
                {attr.type === 'select' && (
                  <div className="col-span-12 sm:col-span-8">
                    <FormLabel className="text-[10px] text-muted-foreground">
                      Options (comma-separated)
                    </FormLabel>
                    <Input
                      value={(attr.options ?? []).join(', ')}
                      onChange={(e) => setOptions(idx, e.target.value)}
                      placeholder="Low, Medium, High, Critical"
                      className="h-8 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Validation — show only fields that apply to the type */}
              {(attr.type === 'text' ||
                attr.type === 'textarea' ||
                attr.type === 'rich-text' ||
                attr.type === 'email' ||
                attr.type === 'url' ||
                attr.type === 'number') && (
                <div className="grid grid-cols-12 gap-2 pt-2 border-t">
                  {(attr.type === 'text' ||
                    attr.type === 'textarea' ||
                    attr.type === 'rich-text' ||
                    attr.type === 'email' ||
                    attr.type === 'url') && (
                    <>
                      <div className="col-span-6 sm:col-span-3">
                        <FormLabel className="text-[10px] text-muted-foreground">
                          Min length
                        </FormLabel>
                        <Input
                          type="number"
                          min={0}
                          value={attr.validation?.minLength ?? ''}
                          onChange={(e) =>
                            setValidation(idx, 'minLength', e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <FormLabel className="text-[10px] text-muted-foreground">
                          Max length
                        </FormLabel>
                        <Input
                          type="number"
                          min={0}
                          value={attr.validation?.maxLength ?? ''}
                          onChange={(e) =>
                            setValidation(idx, 'maxLength', e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-12 sm:col-span-6">
                        <FormLabel className="text-[10px] text-muted-foreground">
                          Pattern (regex)
                        </FormLabel>
                        <Input
                          value={attr.validation?.pattern ?? ''}
                          onChange={(e) =>
                            setValidation(idx, 'pattern', e.target.value)
                          }
                          placeholder="^[A-Z]{2,4}$"
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </>
                  )}
                  {attr.type === 'number' && (
                    <>
                      <div className="col-span-6">
                        <FormLabel className="text-[10px] text-muted-foreground">
                          Min
                        </FormLabel>
                        <Input
                          type="number"
                          value={attr.validation?.min ?? ''}
                          onChange={(e) =>
                            setValidation(idx, 'min', e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-6">
                        <FormLabel className="text-[10px] text-muted-foreground">
                          Max
                        </FormLabel>
                        <Input
                          type="number"
                          value={attr.validation?.max ?? ''}
                          onChange={(e) =>
                            setValidation(idx, 'max', e.target.value)
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <FormDescription className="text-[11px]">
        Attributes here become custom fields on every Post of this type. The
        post-creation form renders them based on the chosen <em>Post as</em>.
      </FormDescription>
    </div>
  );
}
