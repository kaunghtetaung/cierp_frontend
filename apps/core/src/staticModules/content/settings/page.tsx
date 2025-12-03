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
} from '../common/actions';
import type { Settings, UpdateSettingsDto, SocialLink, FooterColumn } from '../common/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('general');

  // Form states
  const [formData, setFormData] = useState<UpdateSettingsDto>({});
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [footerColumns, setFooterColumns] = useState<FooterColumn[]>([]);

  // Load settings
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getSettings();
      if (result.success && result.data) {
        setSettings(result.data);
        setFormData({
          themeName: result.data.themeName,
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

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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
                {/* Theme */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Theme</label>
                  <Select
                    value={formData.themeName || 'default'}
                    onValueChange={(v) => setFormData({ ...formData, themeName: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Theme</SelectItem>
                      <SelectItem value="modern">Modern Theme</SelectItem>
                      <SelectItem value="classic">Classic Theme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
