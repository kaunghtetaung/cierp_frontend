'use client';

import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';
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
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { MediaBrowserButton } from '@/components/media/MediaBrowserButton';
import type { HeroSectionFormData } from './hero-types';
import { LinkPickerInput } from './_shared/LinkPickerInput';

interface HeroSectionFormProps {
  form: UseFormReturn<HeroSectionFormData>;
  onSubmit: (data: HeroSectionFormData) => void;
  onCancel: () => void;
  saving?: boolean;
  tenantId?: string;
}

export function HeroSectionForm({
  form,
  onSubmit,
  onCancel,
  saving = false,
  tenantId,
}: HeroSectionFormProps) {
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');

  const { fields: buttonFields, append: appendButton, remove: removeButton } = useFieldArray({
    control: form.control,
    name: 'buttons',
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col">
        <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-6 h-10 mb-2 shrink-0">
            <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
            <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
            <TabsTrigger value="buttons" className="text-xs">Buttons</TabsTrigger>
            <TabsTrigger value="design" className="text-xs">Design</TabsTrigger>
            <TabsTrigger value="layout" className="text-xs">Layout</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
          </TabsList>

          {/* Basic Tab */}
          <TabsContent value="basic" className="mt-0 flex-1 overflow-y-auto py-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-xs">Section Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Name" className="h-8 w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-xs">Section Height</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                        <SelectItem value="fullscreen">Fullscreen</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="textAlignment"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-xs">Text Alignment</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="mt-0 flex-1 overflow-y-auto py-4 space-y-4">
            <div className="space-y-2">
              <FormLabel className="text-sm">Content</FormLabel>
              <Tabs value={langTab} onValueChange={(v) => setLangTab(v as 'en' | 'mm')}>
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger value="en" className="text-xs">English</TabsTrigger>
                  <TabsTrigger value="mm" className="text-xs">မြန်မာ</TabsTrigger>
                </TabsList>

                {/* English Tab */}
                <TabsContent value="en" className="mt-2 space-y-3">
                  <FormField
                    control={form.control}
                    name="headline.en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Headline *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Main headline text" className="h-8" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subheadline.en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Subheadline</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Supporting text"
                            rows={3}
                            className="text-sm resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Myanmar Tab */}
                <TabsContent value="mm" className="mt-2 space-y-3">
                  <FormField
                    control={form.control}
                    name="headline.mm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Headline (မြန်မာ)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="ခေါင်းစဉ်ကြီး" className="h-8" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subheadline.mm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Subheadline (မြန်မာ)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="ခေါင်းစဉ်ငယ်"
                            rows={3}
                            className="text-sm resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Background */}
            <div className="space-y-3 border rounded p-3">
              <FormLabel className="text-sm">Background</FormLabel>

              <FormField
                control={form.control}
                name="background.type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Background Type</FormLabel>
                    <Select value={field.value || 'image'} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="solid">Solid Color</SelectItem>
                        <SelectItem value="gradient">Gradient</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Background Image */}
              {form.watch('background.type') === 'image' && (
                <FormField
                  control={form.control}
                  name="background.image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Background Image</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            {...field}
                            placeholder="Image URL or select from media"
                            className="h-8 flex-1"
                          />
                          {tenantId && (
                            <MediaBrowserButton
                              tenantId={tenantId}
                              onSelect={(files) => {
                                if (files.length > 0) {
                                  field.onChange(files[0].url);
                                }
                              }}
                              config={{
                                allowedTypes: ['image/*'],
                                selectionMode: 'single',
                              }}
                              buttonProps={{
                                variant: 'outline',
                                size: 'sm',
                                className: 'h-8 px-3',
                              }}
                            >
                              Browse
                            </MediaBrowserButton>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Background Video */}
              {form.watch('background.type') === 'video' && (
                <FormField
                  control={form.control}
                  name="background.video"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Background Video</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            {...field}
                            placeholder="Video URL or select from media"
                            className="h-8 flex-1"
                          />
                          {tenantId && (
                            <MediaBrowserButton
                              tenantId={tenantId}
                              onSelect={(files) => {
                                if (files.length > 0) {
                                  field.onChange(files[0].url);
                                }
                              }}
                              config={{
                                allowedTypes: ['video/*'],
                                selectionMode: 'single',
                              }}
                              buttonProps={{
                                variant: 'outline',
                                size: 'sm',
                                className: 'h-8 px-3',
                              }}
                            >
                              Browse
                            </MediaBrowserButton>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Solid Color */}
              {form.watch('background.type') === 'solid' && (
                <FormField
                  control={form.control}
                  name="background.solid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Background Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            {...field}
                            value={field.value || '#000000'}
                            className="h-8 w-20"
                          />
                          <Input
                            {...field}
                            value={field.value || ''}
                            placeholder="#000000"
                            className="h-8 flex-1"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Gradient */}
              {form.watch('background.type') === 'gradient' && (
                <>
                  <FormField
                    control={form.control}
                    name="background.gradient.type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Gradient Type</FormLabel>
                        <Select value={field.value || 'linear'} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="linear">Linear</SelectItem>
                            <SelectItem value="radial">Radial</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('background.gradient.type') === 'linear' && (
                    <FormField
                      control={form.control}
                      name="background.gradient.angle"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-xs">Gradient Angle</FormLabel>
                            <span className="text-xs text-muted-foreground">{field.value || 0}°</span>
                          </div>
                          <FormControl>
                            <input
                              type="range"
                              min={0}
                              max={360}
                              step={1}
                              value={field.value || 0}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              aria-label="Gradient Angle"
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="text-xs text-muted-foreground">
                    <p>Gradient stops: Add at least 2 colors with positions (0-100%)</p>
                    <p className="mt-1">Example: #ff0000 at 0%, #0000ff at 100%</p>
                  </div>
                </>
              )}
            </div>

            {/* Overlay Settings */}
            <div className="space-y-3 border rounded p-3">
              <FormLabel className="text-sm">Overlay</FormLabel>

              <FormField
                control={form.control}
                name="overlay.enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel className="text-xs font-normal">Enable Overlay</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('overlay.enabled') && (
                <>
                  <FormField
                    control={form.control}
                    name="overlay.color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Overlay Color</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input type="color" {...field} className="w-20 h-8" />
                            <Input {...field} placeholder="#000000" className="h-8 flex-1" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="overlay.opacity"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-xs">Overlay Opacity</FormLabel>
                          <span className="text-xs text-muted-foreground">{Math.round(field.value * 100)}%</span>
                        </div>
                        <FormControl>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={field.value}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            aria-label="Overlay Opacity"
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
          </TabsContent>

          {/* Buttons Tab */}
          <TabsContent value="buttons" className="mt-0 flex-1 overflow-y-auto py-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Call-to-Action Buttons</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  appendButton({
                    text: { en: '', mm: '' },
                    url: '',
                    style: 'primary',
                    openInNewTab: false,
                  })
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Button
              </Button>
            </div>

            {buttonFields.length === 0 && (
              <div className="text-center py-6 border-2 border-dashed rounded">
                <p className="text-sm text-muted-foreground">
                  No buttons yet. Click "Add Button" to create one.
                </p>
              </div>
            )}

            {buttonFields.map((button, index) => (
              <div key={button.id} className="border rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold">Button {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeButton(index)}
                    className="h-7 w-7 p-0"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>

                <Tabs value={langTab} onValueChange={(v) => setLangTab(v as 'en' | 'mm')}>
                  <TabsList className="grid w-full grid-cols-2 h-8">
                    <TabsTrigger value="en" className="text-xs">English</TabsTrigger>
                    <TabsTrigger value="mm" className="text-xs">မြန်မာ</TabsTrigger>
                  </TabsList>

                  <TabsContent value="en" className="mt-2">
                    <FormField
                      control={form.control}
                      name={`buttons.${index}.text.en`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Button Text *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Button text" className="h-8" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="mm" className="mt-2">
                    <FormField
                      control={form.control}
                      name={`buttons.${index}.text.mm`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Button Text (မြန်မာ)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ခလုတ်စာသား" className="h-8" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>

                <FormField
                  control={form.control}
                  name={`buttons.${index}.url`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">URL *</FormLabel>
                      <FormControl>
                        <LinkPickerInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="https://example.com or /about"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`buttons.${index}.style`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Button Style</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="primary">Primary</SelectItem>
                          <SelectItem value="secondary">Secondary</SelectItem>
                          <SelectItem value="outline">Outline</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`buttons.${index}.openInNewTab`}
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel className="text-xs font-normal">Open in New Tab</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </TabsContent>

          {/* Design Tab */}
          <TabsContent value="design" className="mt-0 flex-1 overflow-y-auto py-4 space-y-4">
            {/* Text Colors */}
            <div className="space-y-3 border rounded p-3">
              <FormLabel className="text-sm">Text Colors</FormLabel>

              <FormField
                control={form.control}
                name="textColors.headline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Headline Color</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          {...field}
                          value={field.value || '#ffffff'}
                          className="h-8 w-20"
                        />
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="#ffffff or inherit"
                          className="h-8 flex-1"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="textColors.subheadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Subheadline Color</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          {...field}
                          value={field.value || '#ffffff'}
                          className="h-8 w-20"
                        />
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="#ffffff or inherit"
                          className="h-8 flex-1"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="textColors.buttons"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Button Text Color</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          {...field}
                          value={field.value || '#ffffff'}
                          className="h-8 w-20"
                        />
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="#ffffff or inherit"
                          className="h-8 flex-1"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Text Size Controls */}
            <div className="space-y-3 border rounded p-3">
              <FormLabel className="text-sm">Text Sizes</FormLabel>

              <FormField
                control={form.control}
                name="headlineSize"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs">Headline Size</FormLabel>
                      <span className="text-xs text-muted-foreground">{field.value || 48}px</span>
                    </div>
                    <FormControl>
                      <input
                        type="range"
                        min={16}
                        max={96}
                        step={1}
                        value={field.value || 48}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        aria-label="Headline Size"
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subheadlineSize"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs">Subheadline Size</FormLabel>
                      <span className="text-xs text-muted-foreground">{field.value || 24}px</span>
                    </div>
                    <FormControl>
                      <input
                        type="range"
                        min={12}
                        max={72}
                        step={1}
                        value={field.value || 24}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        aria-label="Subheadline Size"
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="mt-0 flex-1 overflow-y-auto py-4 space-y-4">
            {/* Spacing */}
            <div className="space-y-3 border rounded p-3">
              <FormLabel className="text-sm">Spacing</FormLabel>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="spacing.paddingTop"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Padding Top</FormLabel>
                      <Select value={field.value || 'none'} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="sm">Small (1rem)</SelectItem>
                          <SelectItem value="md">Medium (2rem)</SelectItem>
                          <SelectItem value="lg">Large (4rem)</SelectItem>
                          <SelectItem value="xl">Extra Large (6rem)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="spacing.paddingBottom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Padding Bottom</FormLabel>
                      <Select value={field.value || 'none'} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="sm">Small (1rem)</SelectItem>
                          <SelectItem value="md">Medium (2rem)</SelectItem>
                          <SelectItem value="lg">Large (4rem)</SelectItem>
                          <SelectItem value="xl">Extra Large (6rem)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="spacing.paddingLeft"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Padding Left</FormLabel>
                      <Select value={field.value || 'none'} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="sm">Small (1rem)</SelectItem>
                          <SelectItem value="md">Medium (2rem)</SelectItem>
                          <SelectItem value="lg">Large (4rem)</SelectItem>
                          <SelectItem value="xl">Extra Large (6rem)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="spacing.paddingRight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Padding Right</FormLabel>
                      <Select value={field.value || 'none'} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="sm">Small (1rem)</SelectItem>
                          <SelectItem value="md">Medium (2rem)</SelectItem>
                          <SelectItem value="lg">Large (4rem)</SelectItem>
                          <SelectItem value="xl">Extra Large (6rem)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="spacing.marginTop"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Margin Top</FormLabel>
                      <Select value={field.value || 'none'} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="sm">Small (1rem)</SelectItem>
                          <SelectItem value="md">Medium (2rem)</SelectItem>
                          <SelectItem value="lg">Large (4rem)</SelectItem>
                          <SelectItem value="xl">Extra Large (6rem)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="spacing.marginBottom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Margin Bottom</FormLabel>
                      <Select value={field.value || 'none'} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="sm">Small (1rem)</SelectItem>
                          <SelectItem value="md">Medium (2rem)</SelectItem>
                          <SelectItem value="lg">Large (4rem)</SelectItem>
                          <SelectItem value="xl">Extra Large (6rem)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Container Settings */}
            <div className="space-y-3 border rounded p-3">
              <FormLabel className="text-sm">Container</FormLabel>

              <FormField
                control={form.control}
                name="containerSettings.width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Width</FormLabel>
                    <Select value={field.value || 'contained'} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fullWidth">Full Width</SelectItem>
                        <SelectItem value="contained">Contained (1200px)</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {form.watch('containerSettings.width') === 'custom' && (
                <FormField
                  control={form.control}
                  name="containerSettings.maxWidth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Max Width</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="1400px" className="h-8" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-0 flex-1 overflow-y-auto py-4 space-y-4">
            {/* Responsive Visibility */}
            <div className="space-y-3 border rounded p-3">
              <FormLabel className="text-sm">Responsive Visibility</FormLabel>
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="responsiveSettings.hideOnMobile"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel className="text-xs font-normal">Hide on Mobile</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="responsiveSettings.hideOnTablet"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel className="text-xs font-normal">Hide on Tablet</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="responsiveSettings.hideOnDesktop"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel className="text-xs font-normal">Hide on Desktop</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section Settings */}
            <div className="space-y-3 border rounded p-3">
              <FormLabel className="text-sm">Section Settings</FormLabel>

              <FormField
                control={form.control}
                name="isVisible"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel className="text-xs font-normal">Visible</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isReusable"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel className="text-xs font-normal">Reusable</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex gap-2 pt-3 sticky bottom-0 bg-background border-t -mx-4 px-4 py-3 shrink-0">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-9">
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="flex-1 h-9">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Section
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
