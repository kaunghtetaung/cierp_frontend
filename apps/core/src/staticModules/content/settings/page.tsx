'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import { Input, Button, Checkbox, Textarea } from '@repo/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { Separator } from '@repo/ui';
import { toastSuccess, toastError } from '@repo/utils';
import {
  RefreshCw,
  Loader2,
  Settings as SettingsIcon,
  Save,
  Layout,
  Palette,
  Globe,
  Search,
  FileText,
  Menu,
  PanelTop,
  PanelBottom,
  Link,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  getSettings,
  updateSettings,
  updateHeaderSettings,
  updateFooterSettings,
  updateSeoSettings,
  updateLanguageSettings,
  getPosts,
} from '../common/actions';
import type {
  Settings,
  UpdateSettingsDto,
  SocialLink,
  FooterColumn,
  Post,
} from '../common/types';
import { THEME_OPTIONS, findTheme, resolveThemeVariant } from '@repo/types';
import { MediaBrowserButton } from '@/components/media/MediaBrowserButton';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('general');

  // Form states
  const [formData, setFormData] = useState<UpdateSettingsDto>({});
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [footerColumns, setFooterColumns] = useState<FooterColumn[]>([]);

  // Cross-collection picker data — homePageId references a Post where
  // postType.slug === 'page'. Fetched lazily on mount.
  const [pagePosts, setPagePosts] = useState<Post[]>([]);

  // Load settings
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getSettings();
      if (result.success && result.data) {
        setSettings(result.data);
        // homePageId may come back populated as a `{ _id, title, slug }`
        // object (Mongoose populate) or as a bare string. The picker
        // matches on string ids, so normalise here.
        const rawHomePageId: any = result.data.homePageId;
        const homePageIdStr =
          rawHomePageId && typeof rawHomePageId === 'object'
            ? String(rawHomePageId._id ?? '')
            : (rawHomePageId as string | undefined);
        setFormData({
          themeName: result.data.themeName,
          themeVariant: result.data.themeVariant,
          homePageId: homePageIdStr,
          allowCustomDepartmentBanner: result.data.allowCustomDepartmentBanner,
          defaultFeatureImage: result.data.defaultFeatureImage,
          defaultLanguage: result.data.defaultLanguage,
          availableLanguages: result.data.availableLanguages,
          metaTitle: result.data.metaTitle,
          metaDescription: result.data.metaDescription,
          metaKeywords: result.data.metaKeywords,
          enableHeaderMenu: result.data.enableHeaderMenu,
          enableFooterMenu: result.data.enableFooterMenu,
          header: result.data.header,
          footer: result.data.footer,
          layout: result.data.layout,
        });
        setSocialLinks(result.data.footer?.socialLinks || []);
        setFooterColumns(result.data.footer?.columns || []);
      } else {
        toastError(result.error || 'Failed to load settings');
      }
    } catch (error) {
      console.error('Load settings error:', error);
      toastError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all Posts of postType=page — used by the home-page picker.
  // Pulled separately from settings so the request can run in parallel
  // with `loadSettings`. Limit set high enough to surface the entire
  // page tree of typical orgs without paging.
  const loadPagePosts = useCallback(async () => {
    try {
      const result = await getPosts({
        postTypeSlug: 'page',
        skip: 0,
        limit: 200,
      });
      if (result.success && result.data) {
        const items = (result.data as any).data ?? result.data;
        setPagePosts(Array.isArray(items) ? items : []);
      }
    } catch (error) {
      console.error('Load page posts error:', error);
      // Non-fatal — picker just falls back to ID-only display
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadPagePosts();
  }, [loadSettings, loadPagePosts]);

  // Handle save
  const handleSave = (section?: string) => {
    startTransition(async () => {
      try {
        let result;

        switch (section) {
          case 'header':
            result = await updateHeaderSettings(formData.header);
            break;
          case 'footer':
            result = await updateFooterSettings({
              ...formData.footer,
              socialLinks,
              columns: footerColumns,
            });
            break;
          case 'seo':
            result = await updateSeoSettings({
              metaTitle: formData.metaTitle,
              metaDescription: formData.metaDescription,
              metaKeywords: formData.metaKeywords,
            });
            break;
          case 'language':
            result = await updateLanguageSettings(
              formData.defaultLanguage || 'en',
              formData.availableLanguages || ['en', 'mm']
            );
            break;
          default:
            result = await updateSettings(formData);
        }

        if (result?.success) {
          toastSuccess('Settings saved successfully');
          loadSettings();
        } else {
          toastError(result?.error || 'Failed to save settings');
        }
      } catch (error) {
        console.error('Save settings error:', error);
        toastError('Failed to save settings');
      }
    });
  };

  // Add social link
  const addSocialLink = () => {
    setSocialLinks([
      ...socialLinks,
      { platform: '', url: '', icon: '', enabled: true },
    ]);
  };

  // Remove social link
  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  // Update social link
  const updateSocialLink = (index: number, field: keyof SocialLink, value: any) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    setSocialLinks(updated);
  };

  // Add footer column
  const addFooterColumn = () => {
    setFooterColumns([
      ...footerColumns,
      { title: { en: '', mm: '' }, links: [] },
    ]);
  };

  // Remove footer column
  const removeFooterColumn = (index: number) => {
    setFooterColumns(footerColumns.filter((_, i) => i !== index));
  };

  // Update a footer column field (title.en / title.mm).
  const updateFooterColumnTitle = (
    index: number,
    lang: 'en' | 'mm',
    value: string,
  ) => {
    setFooterColumns((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        title: { ...(next[index].title || { en: '', mm: '' }), [lang]: value },
      };
      return next;
    });
  };

  // Add an empty link to a footer column.
  const addFooterColumnLink = (colIdx: number) => {
    setFooterColumns((prev) => {
      const next = [...prev];
      next[colIdx] = {
        ...next[colIdx],
        links: [
          ...(next[colIdx].links || []),
          { title: { en: '', mm: '' }, url: '' },
        ],
      };
      return next;
    });
  };

  // Remove a link from a footer column.
  const removeFooterColumnLink = (colIdx: number, linkIdx: number) => {
    setFooterColumns((prev) => {
      const next = [...prev];
      next[colIdx] = {
        ...next[colIdx],
        links: (next[colIdx].links || []).filter((_, i) => i !== linkIdx),
      };
      return next;
    });
  };

  // Update a link's title (multilang) or URL inside a footer column.
  const updateFooterColumnLink = (
    colIdx: number,
    linkIdx: number,
    field: 'titleEn' | 'titleMm' | 'url',
    value: string,
  ) => {
    setFooterColumns((prev) => {
      const next = [...prev];
      const links = [...(next[colIdx].links || [])];
      const link = { ...links[linkIdx] };
      if (field === 'url') link.url = value;
      else
        link.title = {
          ...(link.title || { en: '', mm: '' }),
          [field === 'titleEn' ? 'en' : 'mm']: value,
        };
      links[linkIdx] = link;
      next[colIdx] = { ...next[colIdx], links };
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure your website settings
          </p>
        </div>
        <Button variant="outline" onClick={loadSettings} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="general">
            <SettingsIcon className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="header">
            <PanelTop className="h-4 w-4 mr-2" />
            Header
          </TabsTrigger>
          <TabsTrigger value="footer">
            <PanelBottom className="h-4 w-4 mr-2" />
            Footer
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Search className="h-4 w-4 mr-2" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="language">
            <Globe className="h-4 w-4 mr-2" />
            Language
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic website settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Theme — options sourced from `THEME_OPTIONS` in
                    `@repo/types/themes`. Adding a new theme there
                    surfaces it here automatically; no edit to this
                    Select needed. */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Theme</label>
                  <Select
                    value={formData.themeName || 'default'}
                    onValueChange={(v) => {
                      // When the theme changes, reset the variant
                      // selection to the new theme's default — the
                      // previous theme's variant key may be invalid
                      // for the new one.
                      const next = findTheme(v);
                      setFormData({
                        ...formData,
                        themeName: v,
                        themeVariant: next?.defaultVariant,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THEME_OPTIONS.map((opt) => (
                        <SelectItem key={opt.key} value={opt.key}>
                          {opt.label}
                          {opt.description && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              — {opt.description}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Theme variant — only rendered when the chosen
                    theme declares variants in the catalogue. The
                    radio UI surfaces variant key + label; selection
                    saves to `Settings.themeVariant`, and the
                    public theme's CSS picks it up via the
                    `.theme-variant-<key>` class on the layout root. */}
                {(() => {
                  const theme = findTheme(formData.themeName || 'default');
                  if (!theme?.variants?.length) return null;
                  const activeVariant = resolveThemeVariant(
                    theme.key,
                    formData.themeVariant,
                  );
                  return (
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">
                        Theme Variant
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {theme.variants.map((v) => {
                          const checked = activeVariant === v.key;
                          return (
                            <label
                              key={v.key}
                              className={`flex items-start gap-3 rounded-md border px-3 py-2 cursor-pointer transition-colors ${
                                checked
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:bg-muted/40'
                              }`}
                            >
                              <input
                                type="radio"
                                name="themeVariant"
                                value={v.key}
                                checked={checked}
                                onChange={() =>
                                  setFormData({
                                    ...formData,
                                    themeVariant: v.key,
                                  })
                                }
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium">
                                  {v.label}
                                </div>
                                {v.description && (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {v.description}
                                  </div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Layout Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Layout Type</label>
                  <Select
                    value={formData.layout?.type || 'boxed'}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        layout: { ...formData.layout, type: v as any },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boxed">Boxed</SelectItem>
                      <SelectItem value="fluid">Full Width</SelectItem>
                      <SelectItem value="blank">Blank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Home page picker — surfaces every published Post of
                    type 'page'. Stored as the page's `_id`. Public-web
                    renders this page when the visitor lands on `/`. */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Home Page</label>
                  <Select
                    value={formData.homePageId || '__none__'}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        // null (not undefined) clears the home page on
                        // backend; undefined would just be omitted from
                        // the JSON payload, leaving the existing value.
                        homePageId: v === '__none__' ? (null as any) : v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a page…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        — None (use theme default) —
                      </SelectItem>
                      {pagePosts.map((p) => {
                        const t = p.title as any;
                        const label =
                          (typeof t === 'string' ? t : t?.en || t?.mm) ||
                          (p as any).slug ||
                          p._id;
                        return (
                          <SelectItem key={p._id} value={p._id}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {pagePosts.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No pages yet — create one under Content → Pages first.
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* ───────── Layout background ───────── */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Layout Background</h3>
                  <p className="text-xs text-muted-foreground">
                    Applied as the body background on every public page.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm">Background Type</label>
                    <Select
                      value={formData.layout?.background?.type || 'color'}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          layout: {
                            ...formData.layout,
                            background: {
                              ...(formData.layout?.background || {}),
                              type: v as any,
                              value:
                                formData.layout?.background?.value ?? '#ffffff',
                              opacity:
                                formData.layout?.background?.opacity ?? 1,
                            },
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="color">Solid Color</SelectItem>
                        <SelectItem value="gradient">
                          Gradient (CSS)
                        </SelectItem>
                        <SelectItem value="image">Image URL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm">
                      Value{' '}
                      <span className="text-muted-foreground">
                        ({formData.layout?.background?.type || 'color'})
                      </span>
                    </label>
                    {formData.layout?.background?.type === 'color' ||
                    !formData.layout?.background?.type ? (
                      <Input
                        type="color"
                        value={formData.layout?.background?.value || '#ffffff'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            layout: {
                              ...formData.layout,
                              background: {
                                ...(formData.layout?.background || {
                                  type: 'color',
                                  opacity: 1,
                                }),
                                type: 'color',
                                value: e.target.value,
                                opacity:
                                  formData.layout?.background?.opacity ?? 1,
                              },
                            },
                          })
                        }
                        className="h-10 p-1"
                      />
                    ) : (
                      <Input
                        placeholder={
                          formData.layout?.background?.type === 'gradient'
                            ? 'linear-gradient(135deg, #667eea, #764ba2)'
                            : 'https://… (image URL)'
                        }
                        value={formData.layout?.background?.value || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            layout: {
                              ...formData.layout,
                              background: {
                                ...(formData.layout?.background || {
                                  opacity: 1,
                                }),
                                type:
                                  (formData.layout?.background?.type as any) ||
                                  'gradient',
                                value: e.target.value,
                                opacity:
                                  formData.layout?.background?.opacity ?? 1,
                              },
                            },
                          })
                        }
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm">
                      Opacity{' '}
                      <span className="text-muted-foreground tabular-nums">
                        (
                        {(
                          formData.layout?.background?.opacity ?? 1
                        ).toFixed(2)}
                        )
                      </span>
                    </label>
                    <Input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={formData.layout?.background?.opacity ?? 1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          layout: {
                            ...formData.layout,
                            background: {
                              ...(formData.layout?.background || {
                                type: 'color',
                                value: '#ffffff',
                              }),
                              type:
                                formData.layout?.background?.type || 'color',
                              value:
                                formData.layout?.background?.value || '#ffffff',
                              opacity: Number(e.target.value),
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm">
                    Custom CSS class{' '}
                    <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <Input
                    placeholder="e.g., bg-pattern-dots, theme-festive"
                    value={formData.layout?.className || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        layout: {
                          ...formData.layout,
                          className: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Menu Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Menu Settings</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="enableHeaderMenu"
                      checked={formData.enableHeaderMenu}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, enableHeaderMenu: checked as boolean })
                      }
                    />
                    <label htmlFor="enableHeaderMenu" className="text-sm">
                      Enable Header Menu
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="enableFooterMenu"
                      checked={formData.enableFooterMenu}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, enableFooterMenu: checked as boolean })
                      }
                    />
                    <label htmlFor="enableFooterMenu" className="text-sm">
                      Enable Footer Menu
                    </label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* ───────── Default Featured Image ─────────
                  Site-wide fallback rendered by post listings and
                  detail pages when a post itself has no
                  `featuredImage`. Recommended source: 1600 × 900
                  (16:9), JPEG / WebP, ≤ 300 KB. */}
              <div className="space-y-2 pb-2">
                <label className="text-sm font-medium">
                  Default Featured Image
                </label>
                <p className="text-xs text-muted-foreground">
                  Used when a post has no featured image of its own —
                  e.g. imported announcements, news with text-only
                  bodies. Recommended: 1600 × 900 (JPEG / WebP).
                </p>
                <div className="flex items-start gap-4">
                  {formData.defaultFeatureImage ? (
                    <div
                      className="relative w-48 aspect-video rounded-md border bg-muted overflow-hidden flex-shrink-0"
                      style={{
                        backgroundImage: `url("${formData.defaultFeatureImage}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                  ) : (
                    <div className="w-48 aspect-video rounded-md border border-dashed bg-muted/40 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        No image set
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <MediaBrowserButton
                      onSelect={(url) =>
                        setFormData({
                          ...formData,
                          defaultFeatureImage: url,
                        })
                      }
                      currentValue={formData.defaultFeatureImage}
                      label={
                        formData.defaultFeatureImage
                          ? 'Change image'
                          : 'Browse images'
                      }
                      config={{
                        allowedTypes: ['image/*'],
                        basePath: 'public',
                      }}
                    />
                    {formData.defaultFeatureImage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            defaultFeatureImage: undefined,
                          })
                        }
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
                {formData.defaultFeatureImage && (
                  <p
                    className="text-[11px] text-muted-foreground break-all pt-1"
                    title={formData.defaultFeatureImage}
                  >
                    {formData.defaultFeatureImage}
                  </p>
                )}
              </div>

              <Separator />

              {/* Department-level branding override toggle. When ON,
                  individual departments can override the org-wide
                  banner from their own page settings. */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="allowCustomDepartmentBanner"
                    checked={formData.allowCustomDepartmentBanner}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        allowCustomDepartmentBanner: checked as boolean,
                      })
                    }
                  />
                  <label
                    htmlFor="allowCustomDepartmentBanner"
                    className="text-sm font-medium"
                  >
                    Allow departments to set their own banner
                  </label>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  When enabled, each department's page can override the
                  org-wide header banner with its own title and subtitle.
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => handleSave()} disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Header Settings */}
        <TabsContent value="header">
          <Card>
            <CardHeader>
              <CardTitle>Header Settings</CardTitle>
              <CardDescription>
                Configure the website header appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ───────── Header Variant + Menu Assignment ─────────
                  Picks the publicWeb header component. The Default
                  variant uses two menus (primary + secondary); the
                  Modern/Minimal variants use the primary slot only.
                  Menu slots store `menuType` slugs that publicWeb
                  uses to fetch Navigation docs. */}
              <div className="space-y-4 pb-2 border-b">
                <h3 className="text-sm font-medium">Variant &amp; Menus</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Header Design
                    </label>
                    <Select
                      value={formData.header?.variant || 'default'}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          header: { ...formData.header, variant: v },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">
                          Default
                          <span className="ml-1 text-xs text-muted-foreground">
                            — 2 menus, Stanford-style
                          </span>
                        </SelectItem>
                        <SelectItem value="modern">
                          Modern
                          <span className="ml-1 text-xs text-muted-foreground">
                            — single menu + org logo, sticky
                          </span>
                        </SelectItem>
                        <SelectItem value="minimal">
                          Minimal
                          <span className="ml-1 text-xs text-muted-foreground">
                            — logo only, no menus
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Primary Menu
                    </label>
                    <Select
                      value={formData.header?.menuType || 'header'}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          header: { ...formData.header, menuType: v },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="header">header</SelectItem>
                        <SelectItem value="secondary-header-menu">
                          secondary-header-menu
                        </SelectItem>
                        <SelectItem value="study-sidebar-menu">
                          study-sidebar-menu
                        </SelectItem>
                        <SelectItem value="custom">custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Navigation menuType to use as the primary nav
                    </p>
                  </div>
                  {/* Secondary menu picker — only meaningful for
                      variants that render two menus (Default).
                      Hide for Modern/Minimal to avoid confusion. */}
                  {(formData.header?.variant || 'default') === 'default' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Secondary Menu
                      </label>
                      <Select
                        value={
                          formData.header?.secondaryMenuType ||
                          'secondary-header-menu'
                        }
                        onValueChange={(v) =>
                          setFormData({
                            ...formData,
                            header: {
                              ...formData.header,
                              secondaryMenuType: v,
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="secondary-header-menu">
                            secondary-header-menu
                          </SelectItem>
                          <SelectItem value="study-sidebar-menu">
                            study-sidebar-menu
                          </SelectItem>
                          <SelectItem value="header">header</SelectItem>
                          <SelectItem value="custom">custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Used by Default variant&apos;s audience row
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="headerEnabled"
                    checked={formData.header?.enabled}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        header: { ...formData.header, enabled: checked as boolean },
                      })
                    }
                  />
                  <label htmlFor="headerEnabled" className="text-sm font-medium">
                    Enable Header
                  </label>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showLogo"
                      checked={formData.header?.showLogo}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          header: { ...formData.header, showLogo: checked as boolean },
                        })
                      }
                    />
                    <label htmlFor="showLogo" className="text-sm">Show Logo</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showNavigation"
                      checked={formData.header?.showNavigation}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          header: { ...formData.header, showNavigation: checked as boolean },
                        })
                      }
                    />
                    <label htmlFor="showNavigation" className="text-sm">Show Navigation</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showSearch"
                      checked={formData.header?.showSearch}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          header: { ...formData.header, showSearch: checked as boolean },
                        })
                      }
                    />
                    <label htmlFor="showSearch" className="text-sm">Show Search</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showLanguageSelector"
                      checked={formData.header?.showLanguageSelector}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          header: { ...formData.header, showLanguageSelector: checked as boolean },
                        })
                      }
                    />
                    <label htmlFor="showLanguageSelector" className="text-sm">Language Selector</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showUserMenu"
                      checked={formData.header?.showUserMenu}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          header: { ...formData.header, showUserMenu: checked as boolean },
                        })
                      }
                    />
                    <label htmlFor="showUserMenu" className="text-sm">User Menu</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showBreadcrumbs"
                      checked={formData.header?.showBreadcrumbs}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          header: { ...formData.header, showBreadcrumbs: checked as boolean },
                        })
                      }
                    />
                    <label htmlFor="showBreadcrumbs" className="text-sm">Breadcrumbs</label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* ───────── Banner — header content shown above navigation ─────────
                  When `useOrgInfoAsBanner` is on, the public site renders the
                  organisation's name/logo as the banner. When OFF, it falls back
                  to the custom title/subtitle fields below. */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Banner</h3>
                  <p className="text-xs text-muted-foreground">
                    Top-of-page heading shown above the navigation bar.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="useOrgInfoAsBanner"
                    checked={formData.header?.useOrgInfoAsBanner}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        header: {
                          ...formData.header,
                          useOrgInfoAsBanner: checked as boolean,
                        },
                      })
                    }
                  />
                  <label
                    htmlFor="useOrgInfoAsBanner"
                    className="text-sm font-medium"
                  >
                    Use organisation info as banner
                  </label>
                </div>

                {!formData.header?.useOrgInfoAsBanner && (
                  <div className="space-y-3 pl-6">
                    <p className="text-xs text-muted-foreground">
                      Custom banner — leave blank to hide entirely.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs">Title (EN)</label>
                        <Input
                          value={
                            formData.header?.customBannerTitle?.en || ''
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              header: {
                                ...formData.header,
                                customBannerTitle: {
                                  ...(formData.header?.customBannerTitle || {
                                    en: '',
                                    mm: '',
                                  }),
                                  en: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs">Title (MM)</label>
                        <Input
                          value={
                            formData.header?.customBannerTitle?.mm || ''
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              header: {
                                ...formData.header,
                                customBannerTitle: {
                                  ...(formData.header?.customBannerTitle || {
                                    en: '',
                                    mm: '',
                                  }),
                                  mm: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs">Subtitle (EN)</label>
                        <Input
                          value={
                            formData.header?.customBannerSubtitle?.en || ''
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              header: {
                                ...formData.header,
                                customBannerSubtitle: {
                                  ...(formData.header?.customBannerSubtitle || {
                                    en: '',
                                    mm: '',
                                  }),
                                  en: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs">Subtitle (MM)</label>
                        <Input
                          value={
                            formData.header?.customBannerSubtitle?.mm || ''
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              header: {
                                ...formData.header,
                                customBannerSubtitle: {
                                  ...(formData.header?.customBannerSubtitle || {
                                    en: '',
                                    mm: '',
                                  }),
                                  mm: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => handleSave('header')} disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Header Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer Settings */}
        <TabsContent value="footer">
          <Card>
            <CardHeader>
              <CardTitle>Footer Settings</CardTitle>
              <CardDescription>
                Configure the website footer appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ───────── Footer Variant + Menu Assignment ─────────
                  Picks the publicWeb footer component. Default is
                  the Stanford-style multi-column; Modern is a
                  compact single-row with socials; Minimal is a
                  copyright-only one-liner. */}
              <div className="space-y-4 pb-2 border-b">
                <h3 className="text-sm font-medium">Variant &amp; Menu</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Footer Design
                    </label>
                    <Select
                      value={formData.footer?.variant || 'default'}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          footer: { ...formData.footer, variant: v },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">
                          Default
                          <span className="ml-1 text-xs text-muted-foreground">
                            — Stanford multi-column
                          </span>
                        </SelectItem>
                        <SelectItem value="modern">
                          Modern
                          <span className="ml-1 text-xs text-muted-foreground">
                            — compact 1-row + socials
                          </span>
                        </SelectItem>
                        <SelectItem value="minimal">
                          Minimal
                          <span className="ml-1 text-xs text-muted-foreground">
                            — copyright only
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Footer Menu</label>
                    <Select
                      value={formData.footer?.menuType || 'footer'}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          footer: { ...formData.footer, menuType: v },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="footer">footer</SelectItem>
                        <SelectItem value="custom">custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Navigation menuType to use for footer links
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="footerEnabled"
                    checked={formData.footer?.enabled}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        footer: { ...formData.footer, enabled: checked as boolean },
                      })
                    }
                  />
                  <label htmlFor="footerEnabled" className="text-sm font-medium">
                    Enable Footer
                  </label>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showSocialLinks"
                      checked={formData.footer?.showSocialLinks}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          footer: { ...formData.footer, showSocialLinks: checked as boolean },
                        })
                      }
                    />
                    <label htmlFor="showSocialLinks" className="text-sm">Show Social Links</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showCopyright"
                      checked={formData.footer?.showCopyright}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          footer: { ...formData.footer, showCopyright: checked as boolean },
                        })
                      }
                    />
                    <label htmlFor="showCopyright" className="text-sm">Show Copyright</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showBackToTop"
                      checked={formData.footer?.showBackToTop}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          footer: { ...formData.footer, showBackToTop: checked as boolean },
                        })
                      }
                    />
                    <label htmlFor="showBackToTop" className="text-sm">Back to Top</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showVisitorCount"
                      checked={(formData.footer as any)?.showVisitorCount ?? false}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          footer: {
                            ...(formData.footer as any),
                            showVisitorCount: checked as boolean,
                          } as any,
                        })
                      }
                    />
                    <label htmlFor="showVisitorCount" className="text-sm">Visitor Counter</label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Open Hours — multi-line, MM + EN. Pre-wrap on the
                  public side so admins can write multi-line shifts
                  ("Mon–Fri 8am–5pm\nSat 9am–1pm"). */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Open Hours</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">English</label>
                    <textarea
                      className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Mon–Fri 8am–5pm"
                      value={(formData.footer as any)?.openHours?.en ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          footer: {
                            ...(formData.footer as any),
                            openHours: {
                              ...(formData.footer as any)?.openHours,
                              en: e.target.value,
                            },
                          } as any,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">မြန်မာ</label>
                    <textarea
                      className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="တနင်္လာ–သောကြာ မနက် ၈ နာရီ – ညနေ ၅ နာရီ"
                      value={(formData.footer as any)?.openHours?.mm ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          footer: {
                            ...(formData.footer as any),
                            openHours: {
                              ...(formData.footer as any)?.openHours,
                              mm: e.target.value,
                            },
                          } as any,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Social Links */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Social Links</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addSocialLink}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Link
                  </Button>
                </div>
                {socialLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Input
                      placeholder="Platform (e.g., facebook)"
                      value={link.platform}
                      onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="URL"
                      value={link.url}
                      onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                      className="flex-1"
                    />
                    <Checkbox
                      checked={link.enabled}
                      onCheckedChange={(checked) => updateSocialLink(index, 'enabled', checked)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSocialLink(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <Separator />

              {/* ───────── Copyright text (multilang) ───────── */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium">Copyright Text</h3>
                  <p className="text-xs text-muted-foreground">
                    Shown when "Show Copyright" is enabled. Year tokens
                    like <code>{'{{year}}'}</code> can be used by the
                    public renderer.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs">Copyright (EN)</label>
                    <Input
                      placeholder="© {{year}} My Organisation"
                      value={formData.footer?.copyrightText?.en || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          footer: {
                            ...formData.footer,
                            copyrightText: {
                              ...(formData.footer?.copyrightText || {
                                en: '',
                                mm: '',
                              }),
                              en: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs">Copyright (MM)</label>
                    <Input
                      value={formData.footer?.copyrightText?.mm || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          footer: {
                            ...formData.footer,
                            copyrightText: {
                              ...(formData.footer?.copyrightText || {
                                en: '',
                                mm: '',
                              }),
                              mm: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* ───────── Contact info ───────── */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Contact Info</h3>
                  <p className="text-xs text-muted-foreground">
                    Optional contact block in the footer. Only fields
                    you toggle on are rendered.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showAddress"
                      checked={formData.footer?.contactInfo?.showAddress}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          footer: {
                            ...formData.footer,
                            contactInfo: {
                              ...(formData.footer?.contactInfo || ({} as any)),
                              showAddress: checked as boolean,
                            },
                          },
                        })
                      }
                    />
                    <label htmlFor="showAddress" className="text-sm">
                      Show Address
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showPhone"
                      checked={formData.footer?.contactInfo?.showPhone}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          footer: {
                            ...formData.footer,
                            contactInfo: {
                              ...(formData.footer?.contactInfo || ({} as any)),
                              showPhone: checked as boolean,
                            },
                          },
                        })
                      }
                    />
                    <label htmlFor="showPhone" className="text-sm">
                      Show Phone
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showEmail"
                      checked={formData.footer?.contactInfo?.showEmail}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          footer: {
                            ...formData.footer,
                            contactInfo: {
                              ...(formData.footer?.contactInfo || ({} as any)),
                              showEmail: checked as boolean,
                            },
                          },
                        })
                      }
                    />
                    <label htmlFor="showEmail" className="text-sm">
                      Show Email
                    </label>
                  </div>
                </div>

                {/* Address (multilang) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs">Address (EN)</label>
                    <Textarea
                      rows={2}
                      value={formData.footer?.contactInfo?.address?.en || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          footer: {
                            ...formData.footer,
                            contactInfo: {
                              ...(formData.footer?.contactInfo || ({} as any)),
                              address: {
                                ...(formData.footer?.contactInfo?.address || {
                                  en: '',
                                  mm: '',
                                }),
                                en: e.target.value,
                              },
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs">Address (MM)</label>
                    <Textarea
                      rows={2}
                      value={formData.footer?.contactInfo?.address?.mm || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          footer: {
                            ...formData.footer,
                            contactInfo: {
                              ...(formData.footer?.contactInfo || ({} as any)),
                              address: {
                                ...(formData.footer?.contactInfo?.address || {
                                  en: '',
                                  mm: '',
                                }),
                                mm: e.target.value,
                              },
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs">Phone</label>
                    <Input
                      placeholder="+95 9 ..."
                      value={formData.footer?.contactInfo?.phone || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          footer: {
                            ...formData.footer,
                            contactInfo: {
                              ...(formData.footer?.contactInfo || ({} as any)),
                              phone: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs">Email</label>
                    <Input
                      type="email"
                      placeholder="info@example.org"
                      value={formData.footer?.contactInfo?.email || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          footer: {
                            ...formData.footer,
                            contactInfo: {
                              ...(formData.footer?.contactInfo || ({} as any)),
                              email: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>

                {/* ───────── Google Map ─────────
                    Two ways to set the map source:
                      1. Embed URL  — paste the `src` attribute from
                         Google Maps' Share → Embed a map dialog
                         (gives full control: zoom, place card, etc.).
                      2. lat / lng  — when only the coords are known
                         the public theme falls back to the keyless
                         search-query embed. Either path works without
                         a Google API key. */}
                <div className="pt-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showMap"
                      checked={!!(formData.footer?.contactInfo as any)?.showMap}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          footer: {
                            ...formData.footer,
                            contactInfo: {
                              ...(formData.footer?.contactInfo || ({} as any)),
                              showMap: checked as boolean,
                            } as any,
                          },
                        })
                      }
                    />
                    <label htmlFor="showMap" className="text-sm">
                      Show Google Map
                    </label>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs">Map Embed URL</label>
                    <Input
                      placeholder="https://www.google.com/maps/embed?pb=..."
                      value={
                        (formData.footer?.contactInfo as any)?.mapEmbedUrl || ''
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          footer: {
                            ...formData.footer,
                            contactInfo: {
                              ...(formData.footer?.contactInfo || ({} as any)),
                              mapEmbedUrl: e.target.value,
                            } as any,
                          },
                        })
                      }
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Paste the <code>src</code> from Google Maps → Share →
                      Embed a map. Overrides lat / lng if set.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs">Latitude</label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="16.8409"
                        value={
                          (formData.footer?.contactInfo as any)?.latitude ?? ''
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            footer: {
                              ...formData.footer,
                              contactInfo: {
                                ...(formData.footer?.contactInfo || ({} as any)),
                                latitude:
                                  e.target.value === ''
                                    ? undefined
                                    : Number(e.target.value),
                              } as any,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs">Longitude</label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="96.1735"
                        value={
                          (formData.footer?.contactInfo as any)?.longitude ?? ''
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            footer: {
                              ...formData.footer,
                              contactInfo: {
                                ...(formData.footer?.contactInfo || ({} as any)),
                                longitude:
                                  e.target.value === ''
                                    ? undefined
                                    : Number(e.target.value),
                              } as any,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* ───────── Footer Columns ─────────
                  Each column = a labelled list of links (e.g. "Quick
                  links", "Departments"). Author ordering is preserved.
                  Up to ~4 columns is the visual ceiling on most themes
                  but no hard cap is enforced here. */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Footer Columns</h3>
                    <p className="text-xs text-muted-foreground">
                      Grouped link lists shown in the footer (Quick
                      Links, Departments, Resources, …).
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFooterColumn}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Column
                  </Button>
                </div>
                {footerColumns.length === 0 && (
                  <p className="text-xs italic text-muted-foreground">
                    No columns yet — add one to get started.
                  </p>
                )}
                {footerColumns.map((col, colIdx) => (
                  <div
                    key={colIdx}
                    className="rounded-lg border p-3 space-y-3 bg-muted/20"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px]">
                            Column title (EN)
                          </label>
                          <Input
                            placeholder="Quick Links"
                            value={col.title?.en || ''}
                            onChange={(e) =>
                              updateFooterColumnTitle(
                                colIdx,
                                'en',
                                e.target.value,
                              )
                            }
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px]">
                            Column title (MM)
                          </label>
                          <Input
                            value={col.title?.mm || ''}
                            onChange={(e) =>
                              updateFooterColumnTitle(
                                colIdx,
                                'mm',
                                e.target.value,
                              )
                            }
                            className="h-8"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFooterColumn(colIdx)}
                        title="Remove column"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    {/* Links in this column */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Links ({col.links?.length || 0})
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addFooterColumnLink(colIdx)}
                          className="h-7"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Link
                        </Button>
                      </div>
                      {(col.links || []).map((link, linkIdx) => (
                        <div
                          key={linkIdx}
                          className="flex items-center gap-2 p-2 rounded border bg-background"
                        >
                          <Input
                            placeholder="Link title (EN)"
                            value={link.title?.en || ''}
                            onChange={(e) =>
                              updateFooterColumnLink(
                                colIdx,
                                linkIdx,
                                'titleEn',
                                e.target.value,
                              )
                            }
                            className="h-8 flex-1"
                          />
                          <Input
                            placeholder="MM"
                            value={link.title?.mm || ''}
                            onChange={(e) =>
                              updateFooterColumnLink(
                                colIdx,
                                linkIdx,
                                'titleMm',
                                e.target.value,
                              )
                            }
                            className="h-8 w-20"
                          />
                          <Input
                            placeholder="/about · https://…"
                            value={link.url || ''}
                            onChange={(e) =>
                              updateFooterColumnLink(
                                colIdx,
                                linkIdx,
                                'url',
                                e.target.value,
                              )
                            }
                            className="h-8 flex-1 font-mono text-xs"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              removeFooterColumnLink(colIdx, linkIdx)
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => handleSave('footer')} disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Footer Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Settings */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>
                Configure default SEO meta tags
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Meta Title</label>
                  <Input
                    value={formData.metaTitle || ''}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    placeholder="Default page title"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.metaTitle?.length || 0}/60 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Meta Description</label>
                  <Textarea
                    value={formData.metaDescription || ''}
                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                    placeholder="Default page description"
                    maxLength={160}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.metaDescription?.length || 0}/160 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Meta Keywords</label>
                  <Input
                    value={formData.metaKeywords?.join(', ') || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metaKeywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean),
                      })
                    }
                    placeholder="keyword1, keyword2, keyword3"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate keywords with commas
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => handleSave('seo')} disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save SEO Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Language Settings */}
        <TabsContent value="language">
          <Card>
            <CardHeader>
              <CardTitle>Language Settings</CardTitle>
              <CardDescription>
                Configure supported languages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Language</label>
                  <Select
                    value={formData.defaultLanguage || 'en'}
                    onValueChange={(v) => setFormData({ ...formData, defaultLanguage: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="mm">Myanmar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Available Languages</label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="langEn"
                        checked={formData.availableLanguages?.includes('en')}
                        onCheckedChange={(checked) => {
                          const langs = formData.availableLanguages || [];
                          if (checked) {
                            setFormData({ ...formData, availableLanguages: [...langs, 'en'] });
                          } else {
                            setFormData({
                              ...formData,
                              availableLanguages: langs.filter((l) => l !== 'en'),
                            });
                          }
                        }}
                      />
                      <label htmlFor="langEn" className="text-sm">English</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="langMm"
                        checked={formData.availableLanguages?.includes('mm')}
                        onCheckedChange={(checked) => {
                          const langs = formData.availableLanguages || [];
                          if (checked) {
                            setFormData({ ...formData, availableLanguages: [...langs, 'mm'] });
                          } else {
                            setFormData({
                              ...formData,
                              availableLanguages: langs.filter((l) => l !== 'mm'),
                            });
                          }
                        }}
                      />
                      <label htmlFor="langMm" className="text-sm">Myanmar</label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => handleSave('language')} disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Language Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
