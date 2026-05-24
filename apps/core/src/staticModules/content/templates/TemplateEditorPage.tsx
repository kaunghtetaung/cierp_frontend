'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  Layers,
  Save,
  Loader2,
  PanelLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { toastSuccess, toastError } from '@repo/utils';
import {
  createTemplate,
  updateTemplate,
} from '../common/actions';
import {
  createTemplateSchema,
  type CreateTemplateFormData,
} from '../common/schemas';
import type { Template, TemplateLayout } from '../common/types';
import { PageLayoutBuilder } from '../post/PageLayoutBuilder/PageLayoutBuilder';

interface TemplateEditorPageProps {
  mode: 'create' | 'edit';
  initialData?: Partial<Template>;
  onClose: () => void;
  onSuccess: () => void;
  tenantId?: string;
}

const CATEGORIES = [
  { value: 'home', label: 'Home' },
  { value: 'about', label: 'About' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'program', label: 'Program' },
  { value: 'contact', label: 'Contact' },
  { value: 'landing', label: 'Landing' },
  { value: 'generic', label: 'Generic' },
];

/**
 * Template Editor — full-screen Dialog that reuses `PageLayoutBuilder`
 * for the layout tree authoring. Identity / metadata fields (name,
 * title, description, category, preview image, status) live in a
 * sticky sidebar; the canvas hosts the page-builder UI.
 *
 * Saves via Server Action; the dialog closes and the parent list
 * reloads on success.
 */
export function TemplateEditorPage({
  mode,
  initialData,
  onClose,
  onSuccess,
  tenantId,
}: TemplateEditorPageProps) {
  const [dialogOpen, setDialogOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewLang, setPreviewLang] = useState<'en' | 'mm'>('en');
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateTemplateFormData>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      name: (initialData as any)?.name || '',
      slug: (initialData as any)?.slug || '',
      title: (initialData as any)?.title || { en: '', mm: '' },
      description: (initialData as any)?.description || { en: '', mm: '' },
      previewImage: (initialData as any)?.previewImage || '',
      category: (initialData as any)?.category || 'generic',
      layout: (initialData as any)?.layout,
      status: (initialData as any)?.status || 'Active',
    },
  });

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setDialogOpen(false);
      onClose();
    }
  };

  const onSubmit = (data: CreateTemplateFormData) => {
    startTransition(async () => {
      try {
        // Strip empty multi-language sub-docs so backend skips them.
        const payload: any = { ...data };
        if (
          payload.title &&
          !payload.title.en?.trim() &&
          !payload.title.mm?.trim()
        ) {
          delete payload.title;
        }
        if (
          payload.description &&
          !payload.description.en?.trim() &&
          !payload.description.mm?.trim()
        ) {
          delete payload.description;
        }

        const result =
          mode === 'create'
            ? await createTemplate(payload)
            : await updateTemplate(initialData!._id!, payload);

        if (result.success && result.data) {
          toastSuccess(
            mode === 'create'
              ? 'Template created successfully'
              : 'Template updated successfully',
          );
          onSuccess();
        } else {
          toastError(result.error || 'Failed to save template');
        }
      } catch (error) {
        console.error('Save template error:', error);
        toastError('An unexpected error occurred');
      }
    });
  };

  // Cmd/Ctrl + S to save from anywhere in the editor.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        form.handleSubmit(onSubmit)();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const watchedLayout = form.watch('layout') as TemplateLayout | undefined;

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[100vw] h-[100vh] p-0 rounded-none !flex !flex-col gap-0"
        style={{
          top: 0,
          left: 0,
          transform: 'none',
          width: '100vw',
          height: '100vh',
          zIndex: 1050,
        }}
      >
        <div className="flex-1 min-h-0 flex flex-col">
          {/* ───────── Header */}
          <div className="h-14 border-b flex items-center justify-between px-4 flex-shrink-0 bg-background gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Layers className="h-5 w-5 text-muted-foreground shrink-0" />
              <h2 className="text-base md:text-lg font-semibold truncate">
                {mode === 'create' ? 'Create Template' : 'Edit Template'}
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Tabs
                value={previewLang}
                onValueChange={(v) => setPreviewLang(v as 'en' | 'mm')}
              >
                <TabsList className="h-8">
                  <TabsTrigger value="en" className="text-xs px-3">
                    EN
                  </TabsTrigger>
                  <TabsTrigger value="mm" className="text-xs px-3">
                    MM
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="h-9"
                title={sidebarOpen ? 'Hide settings' : 'Show settings'}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isPending}
                className="h-9"
                title="Save (Cmd/Ctrl+S)"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save template
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                title="Close editor"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* ───────── Body — split pane: settings + canvas */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {sidebarOpen && (
              <aside
                className="w-full md:w-[420px] lg:w-[460px] xl:w-[500px] shrink-0 border-r bg-background overflow-y-auto"
                aria-label="Template settings"
              >
                <Form {...form}>
                  <form className="space-y-4 p-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">
                            Internal name *
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g. UM1 Home Layout"
                            />
                          </FormControl>
                          <FormDescription className="text-[11px]">
                            Reference name shown in the admin and template
                            picker. Not displayed publicly.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Slug</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ''}
                              placeholder="auto-generated from name"
                            />
                          </FormControl>
                          <FormDescription className="text-[11px]">
                            URL-safe identifier. Leave blank to derive from
                            name.
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Category</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pick a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CATEGORIES.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-[11px]">
                            Groups templates in the picker (home / about /
                            etc).
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    {/* Display title / description (per-language) */}
                    <div className="rounded-md border p-3 space-y-3">
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Display ({previewLang.toUpperCase()})
                      </div>
                      <FormField
                        control={form.control}
                        name={`title.${previewLang}` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Title</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ''}
                                placeholder="Title shown in template picker"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`description.${previewLang}` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Description
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                value={field.value ?? ''}
                                rows={3}
                                placeholder="When to use this template…"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="previewImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">
                            Preview image URL
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ''}
                              placeholder="https://…"
                            />
                          </FormControl>
                          <FormDescription className="text-[11px]">
                            Optional thumbnail rendered next to this template
                            in the picker.
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                          <div>
                            <FormLabel className="text-xs cursor-pointer">
                              Active
                            </FormLabel>
                            <p className="text-[10px] text-muted-foreground">
                              Inactive templates are hidden from the page
                              picker.
                            </p>
                          </div>
                          <Switch
                            checked={field.value === 'Active'}
                            onCheckedChange={(v) =>
                              field.onChange(v ? 'Active' : 'Inactive')
                            }
                          />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </aside>
            )}

            {/* Canvas — page-builder UI for the layout tree */}
            <div className="flex-1 overflow-auto bg-muted/20">
              <div className="min-h-full p-6">
                <div className="mx-auto max-w-5xl bg-background rounded shadow border p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                    Layout tree
                  </div>
                  <PageLayoutBuilder
                    value={watchedLayout}
                    onChange={(next) =>
                      form.setValue('layout', next as any, {
                        shouldDirty: true,
                      })
                    }
                    tenantId={tenantId}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
