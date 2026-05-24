'use client';

import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui';
import { Input, Switch } from '@repo/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import {
  GitBranch,
  Eye,
  Hash,
  Home,
  LayoutDashboard,
  Loader2,
  RotateCw,
} from 'lucide-react';
import { Button } from '@repo/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui';
import { toastSuccess, toastError } from '@repo/utils';
import { getModuleListAction } from '@repo/app-modules/server-actions';
import {
  getTemplateReference,
  getTemplateById,
  findSectionsByIds,
} from '../common/actions';
import type { CreatePostFormData } from '../common/schemas';
import type { TemplateRefItem } from '../common/types';

interface PageRefItem {
  id: string;
  title: string;
}

// ───── Layout-walk helpers (template auto-detection) ─────────────
//
// A template's `layout` carries section refs by id; the section's
// `type` lives on the Section doc itself. To decide whether a
// template is a "wrapper" (contains a postBody placeholder) we
// walk the layout, gather every referenced section id, then look
// up the resolved docs.

function collectSectionIdsFromLayout(layout: any): string[] {
  const ids = new Set<string>();
  const walkRow = (row: any) => {
    for (const col of row?.columns ?? []) {
      for (const ref of col?.sectionRefs ?? []) {
        if (ref?.sectionId) ids.add(String(ref.sectionId));
      }
      for (const sub of col?.rows ?? []) walkRow(sub);
    }
  };
  for (const c of layout?.containers ?? []) {
    for (const r of c?.rows ?? []) walkRow(r);
  }
  return Array.from(ids);
}

function layoutContainsPostBody(
  layout: any,
  sectionsById: Map<string, any> | null,
): boolean {
  const walkRow = (row: any): boolean => {
    for (const col of row?.columns ?? []) {
      for (const ref of col?.sectionRefs ?? []) {
        // Inline `sectionData` sometimes carries a resolved type;
        // check it before falling back to the looked-up doc.
        if (ref?.sectionData?.type === 'postBody') return true;
        const resolved = ref?.sectionId
          ? sectionsById?.get(String(ref.sectionId))
          : null;
        if (resolved?.type === 'postBody') return true;
      }
      for (const sub of col?.rows ?? []) {
        if (walkRow(sub)) return true;
      }
    }
    return false;
  };
  for (const c of layout?.containers ?? []) {
    for (const r of c?.rows ?? []) {
      if (walkRow(r)) return true;
    }
  }
  return false;
}

interface PageSettingsFormProps {
  form: UseFormReturn<CreatePostFormData>;
  editingPostId?: string;
}

/**
 * Page-specific settings — hierarchy (parent / order / home toggle),
 * navigation flags (showInNavigation / breadcrumbs / title / featured
 * image), and the public-web template picker. Lives in the settings
 * sheet now, single-column layout. Previously embedded inside
 * `PageDetailsCard` as a collapsible; pulled out so the sheet owns
 * all post-level configuration uniformly.
 */
export function PageSettingsForm({
  form,
  editingPostId,
}: PageSettingsFormProps) {
  const [parentCandidates, setParentCandidates] = useState<PageRefItem[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [templates, setTemplates] = useState<TemplateRefItem[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  // Confirm dialog state when applying a template would overwrite an
  // already-authored layout. We pre-detect the template's mode so the
  // dialog copy can match — wrapper-mode prompts about discarding the
  // sections layout to reveal Tiptap, scaffold-mode prompts about
  // overwriting the layout in place.
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(
    null,
  );
  const [pendingMode, setPendingMode] = useState<'wrapper' | 'scaffold'>(
    'scaffold',
  );
  const [applyingTemplate, setApplyingTemplate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingParents(true);
    (async () => {
      try {
        const result = await getModuleListAction<any>('post', {
          limit: 50,
          sort: 'createdAt',
          order: 'desc',
          // Plain value rather than `{ $eq: 'page' }` — serializer emits
          // `?postTypeSlug=page` (direct match) instead of
          // `?postTypeSlug[$eq]=page` which Express's default `qs` parser
          // treats as a literal field name and ValidationPipe rejects.
          filters: { postTypeSlug: 'page' },
        });
        if (cancelled) return;
        if (result.success && Array.isArray(result.data)) {
          const items: PageRefItem[] = result.data
            .filter((p: any) => !editingPostId || p._id !== editingPostId)
            .map((p: any) => ({
              id: p._id,
              title: p.title?.en || p.title?.mm || p.slug || p._id,
            }));
          setParentCandidates(items);
        }
      } catch (err) {
        console.warn('Failed to load parent page candidates', err);
      } finally {
        if (!cancelled) setLoadingParents(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editingPostId]);

  // ───── Load authored Templates for the picker (Phase 3 of the
  // template work — the static TEMPLATE_OPTIONS array used to live
  // here; now templates are first-class entities at /content/templates).
  useEffect(() => {
    let cancelled = false;
    setLoadingTemplates(true);
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
        if (!cancelled) setLoadingTemplates(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ───── Apply a template — branches on auto-detection.
  //
  // Two modes, decided by what's in the template's layout:
  //
  //   • Wrapper mode (template contains a `postBody` placeholder):
  //     stamp `templateId`, switch `layoutMode='tiptap'`, leave
  //     `page.layout` empty. The Tiptap editor stays visible for the
  //     author to fill the body. At render time `resolvePageLayout`
  //     falls through to `template.layout`, and the `postBody`
  //     section pulls `bodyTiptap` via `PostContentProvider`.
  //
  //   • Scaffold mode (no `postBody`): copy the template's layout
  //     into `page.layout`, switch `layoutMode='sections'`. The page
  //     becomes independent — edits stay local; future template
  //     edits don't propagate.
  const applyTemplate = async (
    templateId: string,
    preDetectedMode?: 'wrapper' | 'scaffold',
  ) => {
    setApplyingTemplate(true);
    try {
      const result = await getTemplateById(templateId);
      if (!result.success || !result.data) {
        toastError(result.error || 'Failed to load template');
        return;
      }
      const layout = (result.data as any).layout;
      if (!layout || !layout.containers || layout.containers.length === 0) {
        // Template has no authored layout — still link by id but
        // don't replace anything. Author can edit the template first.
        form.setValue('templateId', templateId, { shouldDirty: true });
        toastError(
          'Template has no layout yet — assigned by reference. Edit the template to add rows.',
          { duration: 6000 },
        );
        return;
      }

      // Resolve mode if the caller didn't already determine it
      // (handleTemplateSelect pre-detects so the confirm dialog can
      // show the right copy; the re-apply button skips that step).
      let mode: 'wrapper' | 'scaffold' = preDetectedMode ?? 'scaffold';
      if (!preDetectedMode) {
        mode = await detectTemplateMode(layout);
      }

      if (mode === 'wrapper') {
        form.setValue('templateId', templateId, { shouldDirty: true });
        form.setValue('layoutMode', 'tiptap', { shouldDirty: true });
        // Clear any prior copied layout so resolvePageLayout falls
        // through to the live template.layout instead of a stale clone.
        form.setValue('layout', null as any, { shouldDirty: true });
        toastSuccess(
          `Applied "${(result.data as any).name}" as a wrapper. Author the body in Tiptap — the template renders around it.`,
        );
      } else {
        // Deep-clone so future edits don't mutate the cached template.
        const cloned = JSON.parse(JSON.stringify(layout));
        form.setValue('layout', cloned, { shouldDirty: true });
        form.setValue('layoutMode', 'sections', { shouldDirty: true });
        form.setValue('templateId', templateId, { shouldDirty: true });
        toastSuccess(
          `Applied template "${(result.data as any).name}". Edit freely — changes stay on this page only.`,
        );
      }
    } catch (err) {
      console.error('Apply template error:', err);
      toastError('Unexpected error applying template');
    } finally {
      setApplyingTemplate(false);
    }
  };

  // Walk the template layout, fetch referenced sections, and report
  // wrapper vs scaffold. Defaults to scaffold on any error so the
  // existing copy-layout flow remains the safe fallback.
  const detectTemplateMode = async (
    layout: any,
  ): Promise<'wrapper' | 'scaffold'> => {
    try {
      const ids = collectSectionIdsFromLayout(layout);
      if (ids.length === 0) return 'scaffold';
      const res = await findSectionsByIds({ ids });
      const list = (res?.success && Array.isArray(res.data) ? res.data : []) as any[];
      const map = new Map<string, any>(
        list.map((s) => [String(s._id), s]),
      );
      return layoutContainsPostBody(layout, map) ? 'wrapper' : 'scaffold';
    } catch (err) {
      console.warn('Template mode detection failed; defaulting to scaffold', err);
      return 'scaffold';
    }
  };

  // Called when the dropdown selection changes. We pre-detect the
  // template's mode so the confirm dialog (if shown) can match its
  // copy to the actual outcome.
  const handleTemplateSelect = async (newId: string) => {
    if (newId === '__none__') {
      form.setValue('templateId', null, { shouldDirty: true });
      return;
    }

    setApplyingTemplate(true);
    let mode: 'wrapper' | 'scaffold' = 'scaffold';
    try {
      const tpl = await getTemplateById(newId);
      const layout = (tpl?.data as any)?.layout;
      if (layout?.containers?.length) {
        mode = await detectTemplateMode(layout);
      }
    } catch (err) {
      console.warn('Pre-detect template mode failed; defaulting to scaffold', err);
    } finally {
      setApplyingTemplate(false);
    }

    const currentLayout = form.getValues('layout') as any;
    const hasContent =
      !!currentLayout?.containers?.length &&
      currentLayout.containers.some(
        (c: any) => Array.isArray(c.rows) && c.rows.length > 0,
      );

    // Only prompt when there's existing layout content to lose.
    // Wrapper mode also has to confirm because it discards `page.layout`.
    if (hasContent) {
      setPendingMode(mode);
      setPendingTemplateId(newId);
    } else {
      applyTemplate(newId, mode);
    }
  };

  return (
    <div className="space-y-5">
      {/* ───── Hierarchy ───── */}
      <FormField
        control={form.control}
        name="parentId"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5 text-sm">
              <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
              Parent page
            </FormLabel>
            <Select
              value={field.value ?? '__root__'}
              onValueChange={(v) =>
                field.onChange(v === '__root__' ? null : v)
              }
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingParents ? 'Loading…' : 'Top level (no parent)'
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="__root__">Top level (no parent)</SelectItem>
                {parentCandidates.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription className="text-[11px]">
              Used for breadcrumbs + navigation tree.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="orderInParent"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5 text-sm">
              <Hash className="h-3.5 w-3.5 text-muted-foreground" />
              Order
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                step={1}
                value={field.value ?? 0}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === '' ? 0 : Number(e.target.value),
                  )
                }
              />
            </FormControl>
            <FormDescription className="text-[11px]">
              Lower = earlier among siblings.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="isHomePage"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              <FormLabel className="text-xs cursor-pointer">
                Set as home page
              </FormLabel>
            </div>
            <Switch
              checked={!!field.value}
              onCheckedChange={field.onChange}
            />
          </FormItem>
        )}
      />

      {/* ───── Navigation flags ───── */}
      <div>
        <div className="flex items-center gap-1.5 text-sm font-medium mb-2">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          Navigation &amp; layout flags
        </div>
        <div className="space-y-2">
          {[
            {
              name: 'showInNavigation',
              label: 'Show in nav menu',
              hint: 'Appear in primary navigation',
            },
            {
              name: 'showBreadcrumbs',
              label: 'Show breadcrumbs',
              hint: 'Render trail at top',
            },
            {
              name: 'showTitle',
              label: 'Show page header',
              hint: 'Render the title + excerpt band above the body',
            },
            {
              name: 'showFeaturedImage',
              label: 'Show featured image',
              hint: 'Hero band at top',
            },
          ].map((opt) => (
            <FormField
              key={opt.name}
              control={form.control}
              name={opt.name as any}
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="min-w-0">
                    <FormLabel className="text-xs cursor-pointer">
                      {opt.label}
                    </FormLabel>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {opt.hint}
                    </p>
                  </div>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>

      {/* ───── Template picker (authored Templates) ─────
           Picking a template *copies* its layout tree into this
           page's `layout`, then the page is fully independent —
           edit freely, template changes don't propagate back.
           `templateId` is stored as a "based on" reference so we
           can offer a "Re-apply" action later. */}
      <FormField
        control={form.control}
        name="templateId"
        render={({ field }) => {
          const selected = templates.find((t) => t.id === field.value);
          return (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5 text-sm">
                <LayoutDashboard className="h-3.5 w-3.5 text-muted-foreground" />
                Page template
              </FormLabel>
              <div className="flex items-center gap-2">
                <Select
                  value={field.value ?? '__none__'}
                  onValueChange={handleTemplateSelect}
                  disabled={applyingTemplate}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          loadingTemplates
                            ? 'Loading templates…'
                            : 'No template (use page layout)'
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">No template</span>
                        <span className="text-[10px] text-muted-foreground">
                          Use this page&apos;s own layout / sections.
                        </span>
                      </div>
                    </SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{t.label}</span>
                          {t.category && (
                            <span className="text-[10px] text-muted-foreground">
                              {t.category}
                              {t.slug ? ` · ${t.slug}` : ''}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selected && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={applyingTemplate}
                    onClick={() => handleTemplateSelect(field.value!)}
                    title="Re-apply template (re-runs wrapper/scaffold detection)"
                  >
                    {applyingTemplate ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCw className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
              <FormDescription className="text-[11px]">
                {selected
                  ? 'Template applied. Wrapper templates render around your Tiptap body; scaffold templates copy their layout into this page (edits stay local). Re-apply (↻) to refresh.'
                  : 'Pick a template — wrapper-mode wraps around a Tiptap body, scaffold-mode copies its layout into this page.'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      {/* Confirm dialog — opens when applying the picked template
           would discard existing layout content on this page. The
           copy adapts to the detected mode (wrapper vs scaffold). */}
      <AlertDialog
        open={pendingTemplateId !== null}
        onOpenChange={(o) => !o && setPendingTemplateId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingMode === 'wrapper'
                ? 'Switch to wrapper template?'
                : 'Replace current page layout?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingMode === 'wrapper' ? (
                <>
                  This template wraps a Tiptap body. Switching will{' '}
                  <strong>discard</strong> the current Sections layout on
                  this page and reveal the Tiptap editor — author the body
                  there and the template renders the surrounding chrome.
                </>
              ) : (
                <>
                  This page already has authored content in its layout.
                  Applying a template will <strong>overwrite</strong> the
                  current rows / columns / sections with a copy of the
                  template&apos;s layout. Your existing edits will be lost.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={applyingTemplate}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={applyingTemplate}
              onClick={async () => {
                if (pendingTemplateId) {
                  await applyTemplate(pendingTemplateId, pendingMode);
                  setPendingTemplateId(null);
                }
              }}
            >
              {applyingTemplate ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Applying…
                </>
              ) : pendingMode === 'wrapper' ? (
                'Switch to wrapper'
              ) : (
                'Apply template'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
