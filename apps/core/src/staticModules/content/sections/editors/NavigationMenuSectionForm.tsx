'use client';

import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui';
import { Input, Button, Switch } from '@repo/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { Save, Loader2 } from 'lucide-react';
import type { NavigationMenuSectionFormData } from './navigation-menu-types';
import { getMenuTypes } from '../../common/actions';

interface Props {
  form: UseFormReturn<NavigationMenuSectionFormData>;
  onSubmit: (data: NavigationMenuSectionFormData) => void;
  onCancel: () => void;
  saving?: boolean;
}

// Predefined values match the Navigation admin's list — authors who've
// never created a custom menu type at least see these. We MERGE these
// with whatever distinct `menuType` values the API returns so any
// custom menu (e.g. 'course-sidebar') also shows up.
const PREDEFINED_MENU_TYPES = [
  { value: 'header', label: 'Header Menu' },
  { value: 'footer', label: 'Footer Menu' },
  { value: 'sidebar', label: 'Sidebar Menu' },
  { value: 'mobile', label: 'Mobile Menu' },
];

export function NavigationMenuSectionForm({
  form,
  onSubmit,
  onCancel,
  saving = false,
}: Props) {
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');
  const [menuTypes, setMenuTypes] = useState<{ value: string; label: string }[]>(
    PREDEFINED_MENU_TYPES,
  );
  const [loadingTypes, setLoadingTypes] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await getMenuTypes();
        if (!mounted) return;
        const fetched: string[] = Array.isArray(result?.data) ? result.data : [];
        // Merge predefined + fetched (dedupe by value). The fetched
        // list reflects what's actually populated in the Navigation
        // collection, so a custom menuType authors created in the
        // Nav editor (e.g. 'course-sidebar') shows up here too.
        const merged = new Map<string, { value: string; label: string }>();
        for (const p of PREDEFINED_MENU_TYPES) merged.set(p.value, p);
        for (const v of fetched) {
          if (!merged.has(v)) {
            merged.set(v, {
              value: v,
              label: v
                .split(/[-_]/)
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' '),
            });
          }
        }
        setMenuTypes(Array.from(merged.values()));
      } catch (e) {
        console.warn('Failed to load menu types', e);
      } finally {
        if (mounted) setLoadingTypes(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Internal name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Section Name *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Internal reference name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* menuType dropdown — primary control. Selects which
            Navigation tree to render. */}
        <FormField
          control={form.control}
          name="menuType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Navigation Menu *</FormLabel>
              <Select
                value={field.value || ''}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingTypes ? 'Loading menus…' : 'Pick a menu'
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {menuTypes.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}{' '}
                      <span className="text-muted-foreground text-xs">
                        ({m.value})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Create / edit menu trees under <strong>Navigations</strong> in
                the sidebar. New menu types you add there will appear here.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Optional sidebar heading */}
        <div className="space-y-2">
          <FormLabel>Headline (optional)</FormLabel>
          <Tabs value={langTab} onValueChange={(v) => setLangTab(v as 'en' | 'mm')}>
            <TabsList className="h-8 w-full">
              <TabsTrigger value="en" className="flex-1">EN</TabsTrigger>
              <TabsTrigger value="mm" className="flex-1">MM</TabsTrigger>
            </TabsList>
            <TabsContent value="en" className="mt-2">
              <FormField
                control={form.control}
                name="headline.en"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="e.g. In this section"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
            <TabsContent value="mm" className="mt-2">
              <FormField
                control={form.control}
                name="headline.mm"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Display options */}
        <FormField
          control={form.control}
          name="displayMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Mode</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="tree">Tree (nested children)</SelectItem>
                  <SelectItem value="flat">Flat (top-level only)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="showIcons"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <FormLabel className="text-sm font-normal">Show item icons</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expandActive"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <FormLabel className="text-sm font-normal">
                Auto-expand current page's branch
              </FormLabel>
              <FormControl>
                <Switch
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> Save
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default NavigationMenuSectionForm;
