'use client';

import React, { useMemo } from 'react';
import {
  Input,
  Textarea,
  Checkbox,
  FormLabel,
  FormDescription,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import type {
  AttributeDefinition,
  CustomFieldValue,
} from '../common/types';

interface CustomFieldsEditorProps {
  /** Attribute definitions from the selected PostType. */
  attributes: AttributeDefinition[];
  /** Current values, indexed by `fieldName` (== attribute.name). */
  value: CustomFieldValue[];
  /** Reports the next array of CustomFieldValue back to the parent. */
  onChange: (next: CustomFieldValue[]) => void;
}

/** Quick lookup so we don't scan the array on every cell update. */
function indexBy(values: CustomFieldValue[]): Map<string, unknown> {
  const m = new Map<string, unknown>();
  values.forEach((v) => m.set(v.fieldName, v.value));
  return m;
}

/**
 * Render the right input widget for a single attribute. Pure JSX — no
 * RHF coupling. The parent (CustomFieldsEditor) owns the array shape and
 * propagates changes by replacing the row with `fieldName === attr.name`.
 */
function DynamicFieldRenderer({
  attr,
  value,
  onChange,
}: {
  attr: AttributeDefinition;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const stringValue =
    value === null || value === undefined ? '' : String(value);

  switch (attr.type) {
    case 'text':
    case 'email':
    case 'url':
      return (
        <Input
          type={attr.type === 'text' ? 'text' : attr.type}
          value={stringValue}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder={(attr.defaultValue as string | undefined) ?? ''}
          minLength={attr.validation?.minLength}
          maxLength={attr.validation?.maxLength}
          pattern={attr.validation?.pattern}
        />
      );

    case 'textarea':
    case 'rich-text':
      return (
        <Textarea
          rows={attr.type === 'rich-text' ? 6 : 3}
          value={stringValue}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder={(attr.defaultValue as string | undefined) ?? ''}
        />
      );

    case 'number':
      return (
        <Input
          type="number"
          value={stringValue}
          onChange={(e) =>
            onChange(e.target.value === '' ? undefined : Number(e.target.value))
          }
          min={attr.validation?.min}
          max={attr.validation?.max}
        />
      );

    case 'date':
      return (
        <Input
          type="date"
          value={stringValue}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
      );

    case 'boolean':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={value === true}
            onCheckedChange={(c) => onChange(c === true)}
          />
          <span className="text-sm">{attr.label}</span>
        </label>
      );

    case 'select': {
      const opts = attr.options ?? [];
      // Radix Select disallows empty-string values — use a sentinel for "none".
      const SENTINEL = '__none__';
      return (
        <Select
          value={stringValue || SENTINEL}
          onValueChange={(v) => onChange(v === SENTINEL ? undefined : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {!attr.required && (
              <SelectItem value={SENTINEL}>
                <span className="text-muted-foreground">None</span>
              </SelectItem>
            )}
            {opts.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    default:
      // Defensive — backend may add new types ahead of the frontend.
      return (
        <Input
          value={stringValue}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder={`(unsupported type: ${attr.type})`}
        />
      );
  }
}

/**
 * Renders ALL custom attributes for the chosen PostType, with each one's
 * value bound to `customFields[fieldName].value`. Sorted by attribute
 * `order`. When the PostType changes (or the parent passes a different
 * `attributes` array), the form should reset `customFields` to defaults
 * — this component doesn't try to do that itself, since defaulting is a
 * caller decision.
 */
export function CustomFieldsEditor({
  attributes,
  value,
  onChange,
}: CustomFieldsEditorProps) {
  const sorted = useMemo(
    () =>
      [...(attributes ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [attributes],
  );
  const byName = useMemo(() => indexBy(value ?? []), [value]);

  const setField = (name: string, next: unknown) => {
    const arr = (value ?? []).slice();
    const idx = arr.findIndex((v) => v.fieldName === name);
    if (next === undefined || next === null || next === '') {
      // Remove entirely so the post document stays clean.
      if (idx >= 0) arr.splice(idx, 1);
    } else if (idx >= 0) {
      arr[idx] = { ...arr[idx], value: next };
    } else {
      arr.push({ fieldName: name, value: next });
    }
    onChange(arr);
  };

  if (sorted.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {sorted.map((attr) => {
        const current = byName.get(attr.name);
        return (
          <div key={attr.name} className="space-y-1.5">
            {/* Boolean shows its own inline label inside the renderer.
                For everything else we render the label here. */}
            {attr.type !== 'boolean' && (
              <FormLabel className="text-sm">
                {attr.label}
                {attr.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </FormLabel>
            )}
            <DynamicFieldRenderer
              attr={attr}
              value={current}
              onChange={(next) => setField(attr.name, next)}
            />
            {attr.validation?.pattern && attr.type !== 'boolean' && (
              <FormDescription className="text-[11px]">
                Must match pattern: <code>{attr.validation.pattern}</code>
              </FormDescription>
            )}
          </div>
        );
      })}
    </div>
  );
}
