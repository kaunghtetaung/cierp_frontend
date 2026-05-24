'use client';

import React, { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@repo/ui';
import { Layout } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { getTemplateReference } from '../common/actions';
import type { TemplateRefItem } from '../common/types';

interface TemplatePickerProps {
  form: UseFormReturn<any>;
  /**
   * Optional label override — useful when this picker shows up in
   * multiple places (post settings panel, lesson sequencing panel).
   */
  label?: string;
  /**
   * Helper hint shown beneath the dropdown. Defaults explain how the
   * template gets used at render time.
   */
  helperText?: string;
}

/**
 * Reference-only template picker.
 *
 * Sets `templateId` on the form to one of the tenant's authored
 * templates (or `null` for "no template — render the post body
 * standalone"). Unlike `PageSettingsForm`'s template picker, this
 * does NOT copy the template's layout into the post — the public
 * renderer resolves the template at request time and slots the
 * post's Tiptap body into any `postBody` section the template
 * carries.
 *
 * Use this in non-page post types (announcement / news / event /
 * lesson / article). Pages use the apply-on-select picker in
 * `PageSettingsForm` because they support per-page layout overrides.
 */
export function TemplatePicker({
  form,
  label = 'Template',
  helperText = `Pick a template to wrap this post. The template's layout (sidebar widgets, hero band, etc.) renders around the post body. "None" renders the body standalone.`,
}: TemplatePickerProps) {
  const [templates, setTemplates] = useState<TemplateRefItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const result = await getTemplateReference();
        if (cancelled) return;
        if (result.success && Array.isArray(result.data)) {
          setTemplates(result.data);
        }
      } catch (err) {
        console.warn('Failed to load template references', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <FormField
      control={form.control}
      name="templateId"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-1.5 text-sm">
            <Layout className="h-3.5 w-3.5 text-muted-foreground" />
            {label}
          </FormLabel>
          <Select
            value={field.value ?? '__none__'}
            onValueChange={(v) =>
              field.onChange(v === '__none__' ? null : v)
            }
            disabled={loading}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loading ? 'Loading templates…' : 'No template'
                  }
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="__none__">
                <span className="text-muted-foreground">
                  None — render body standalone
                </span>
              </SelectItem>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                  {t.category ? (
                    <span className="text-muted-foreground ml-2 text-xs">
                      · {t.category}
                    </span>
                  ) : null}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription className="text-[11px]">
            {helperText}
          </FormDescription>
        </FormItem>
      )}
    />
  );
}

export default TemplatePicker;
