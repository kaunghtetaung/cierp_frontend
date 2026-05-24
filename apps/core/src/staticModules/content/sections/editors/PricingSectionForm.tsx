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
  FormDescription,
} from '@repo/ui';
import { Input, Button, Textarea, Switch, Badge } from '@repo/ui';
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
  GripVertical,
  ChevronDown,
  ChevronUp,
  Settings2,
  Type,
  Layout,
  Tags,
  CircleDollarSign,
  Star,
  Check,
  X as XIcon,
} from 'lucide-react';
import type { PricingSectionFormData } from './pricing-types';
import { EditorSection } from './_shared/EditorSection';
import { LinkPickerInput } from './_shared/LinkPickerInput';

interface PricingSectionFormProps {
  form: UseFormReturn<PricingSectionFormData>;
  onSubmit: (data: PricingSectionFormData) => void;
  onCancel: () => void;
  saving?: boolean;
  tenantId?: string;
}

export function PricingSectionForm({
  form,
  onSubmit,
}: PricingSectionFormProps) {
  const [langTab, setLangTab] = useState<'en' | 'mm'>('en');
  const [expandedPlans, setExpandedPlans] = useState<Set<number>>(
    new Set([0]),
  );

  const {
    fields: plans,
    append,
    remove,
    move,
  } = useFieldArray({
    control: form.control,
    name: 'plans',
  });

  const togglePlan = (idx: number) => {
    setExpandedPlans((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
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
                    placeholder="e.g., Tuition Plans · Membership Tiers"
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
                      <Input
                        {...field}
                        placeholder="Choose the right plan for you"
                      />
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
            </TabsContent>
          </Tabs>
        </EditorSection>

        {/* ───────── Plans (always-open primary) ───────── */}
        <EditorSection
          title="Plans"
          icon={<Tags className="h-3.5 w-3.5" />}
          badge={
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {plans.length}/6
            </span>
          }
          alwaysOpen
        >
          <div className="flex items-center justify-end -mt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={plans.length >= 6}
              onClick={() =>
                append({
                  name: { en: '', mm: '' },
                  price: { amount: 0, currency: 'USD', period: 'month' },
                  features: [],
                  button: {
                    text: { en: 'Get Started', mm: '' },
                    url: '',
                    style: 'primary',
                  },
                  popular: false,
                })
              }
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add plan
            </Button>
          </div>

          {plans.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              At least one plan is required.
            </p>
          )}

          {plans.map((plan, idx) => {
            const isOpen = expandedPlans.has(idx);
            const planName =
              form.watch(`plans.${idx}.name.en`) ||
              form.watch(`plans.${idx}.name.mm`) ||
              `Plan ${idx + 1}`;
            const popular = form.watch(`plans.${idx}.popular`);
            const price = form.watch(`plans.${idx}.price`);
            return (
              <div
                key={plan.id}
                className="rounded-md border bg-muted/20 overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/40">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      #{idx + 1}
                    </Badge>
                    <span className="text-xs font-medium truncate">
                      {planName}
                    </span>
                    {popular && (
                      <Badge className="gap-1 text-[10px] shrink-0">
                        <Star className="h-3 w-3 fill-current" />
                        Popular
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 ml-auto">
                      {price?.currency || 'USD'} {price?.amount ?? 0}/
                      {price?.period || 'month'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => idx > 0 && move(idx, idx - 1)}
                      disabled={idx === 0}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() =>
                        idx < plans.length - 1 && move(idx, idx + 1)
                      }
                      disabled={idx === plans.length - 1}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => togglePlan(idx)}
                    >
                      {isOpen ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => remove(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {isOpen && (
                  <PlanEditor
                    form={form}
                    idx={idx}
                    langTab={langTab}
                    setLangTab={setLangTab}
                  />
                )}
              </div>
            );
          })}
        </EditorSection>

        {/* ───────── Layout ───────── */}
        <EditorSection
          title="Layout & display"
          icon={<Layout className="h-3.5 w-3.5" />}
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="layout"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Layout</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cards">Cards</SelectItem>
                      <SelectItem value="table">Comparison table</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billing"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Billing toggle</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly only</SelectItem>
                      <SelectItem value="yearly">Yearly only</SelectItem>
                      <SelectItem value="both">Show both</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="showComparison"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                <FormLabel className="text-xs cursor-pointer">
                  Show feature comparison
                </FormLabel>
                <Switch
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                />
              </FormItem>
            )}
          />
        </EditorSection>

        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Form>
  );
}

// ──────────────────────────────────────────────────────
// Per-plan editor (expanded card body)
// ──────────────────────────────────────────────────────
interface PlanEditorProps {
  form: UseFormReturn<PricingSectionFormData>;
  idx: number;
  langTab: 'en' | 'mm';
  setLangTab: (lang: 'en' | 'mm') => void;
}

function PlanEditor({ form, idx, langTab, setLangTab }: PlanEditorProps) {
  const {
    fields: features,
    append: appendFeature,
    remove: removeFeature,
    move: moveFeature,
  } = useFieldArray({
    control: form.control,
    name: `plans.${idx}.features`,
  });

  return (
    <div className="p-3 space-y-3">
      {/* Plan name + description */}
      <Tabs
        value={langTab}
        onValueChange={(v) => setLangTab(v as 'en' | 'mm')}
      >
        <TabsList className="h-7">
          <TabsTrigger value="en" className="text-xs px-2">
            EN
          </TabsTrigger>
          <TabsTrigger value="mm" className="text-xs px-2">
            MM
          </TabsTrigger>
        </TabsList>
        <TabsContent value="en" className="space-y-2 mt-2">
          <FormField
            control={form.control}
            name={`plans.${idx}.name.en`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Plan name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Basic / Pro / Enterprise" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`plans.${idx}.description.en`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Short tagline under the plan name"
                    rows={2}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </TabsContent>
        <TabsContent value="mm" className="space-y-2 mt-2">
          <FormField
            control={form.control}
            name={`plans.${idx}.name.mm`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Plan name (MM)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`plans.${idx}.description.mm`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Description (MM)</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={2} />
                </FormControl>
              </FormItem>
            )}
          />
        </TabsContent>
      </Tabs>

      {/* Price */}
      <div className="rounded-md border bg-background p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <CircleDollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          Price
        </div>
        <div className="grid grid-cols-3 gap-2">
          <FormField
            control={form.control}
            name={`plans.${idx}.price.amount`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={field.value ?? 0}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === '' ? 0 : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`plans.${idx}.price.currency`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Currency</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="USD"
                    maxLength={3}
                    className="uppercase"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`plans.${idx}.price.period`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Period</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                    <SelectItem value="one-time">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Popular flag + badge */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <FormField
          control={form.control}
          name={`plans.${idx}.popular`}
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
              <FormLabel className="text-xs cursor-pointer flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5" />
                Mark as popular
              </FormLabel>
              <Switch
                checked={!!field.value}
                onCheckedChange={field.onChange}
              />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`plans.${idx}.badge.en`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Badge text</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Best value" />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Features */}
      <div className="rounded-md border bg-background p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium">
            Features{' '}
            <span className="text-muted-foreground tabular-nums">
              ({features.length})
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendFeature({
                text: { en: '', mm: '' },
                included: true,
              })
            }
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add feature
          </Button>
        </div>
        {features.map((feat, fi) => (
          <div
            key={feat.id}
            className="flex items-start gap-2 rounded-md bg-muted/30 px-2 py-2"
          >
            <FormField
              control={form.control}
              name={`plans.${idx}.features.${fi}.included`}
              render={({ field }) => (
                <FormItem className="shrink-0 mt-1.5">
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={`h-5 w-5 rounded-full flex items-center justify-center ${
                      field.value
                        ? 'bg-emerald-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    title={field.value ? 'Included' : 'Not included'}
                  >
                    {field.value ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <XIcon className="h-3 w-3" />
                    )}
                  </button>
                </FormItem>
              )}
            />
            <div className="flex-1 min-w-0">
              <FormField
                control={form.control}
                name={`plans.${idx}.features.${fi}.text.${langTab}` as any}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder={`Feature text (${langTab.toUpperCase()})`}
                        className="h-8"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 shrink-0"
              onClick={() => fi > 0 && moveFeature(fi, fi - 1)}
              disabled={fi === 0}
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 shrink-0"
              onClick={() => fi < features.length - 1 && moveFeature(fi, fi + 1)}
              disabled={fi === features.length - 1}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive shrink-0"
              onClick={() => removeFeature(fi)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <FormDescription className="text-[11px]">
          Click the green ✓ / grey ✕ to toggle whether a feature is
          included in this plan.
        </FormDescription>
      </div>

      {/* Button */}
      <div className="rounded-md border bg-background p-3 space-y-2">
        <div className="text-xs font-medium">Call-to-action button</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <FormField
            control={form.control}
            name={`plans.${idx}.button.text.${langTab}` as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">
                  Button text *
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Get Started"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`plans.${idx}.button.style`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Style</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="outline">Outline</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name={`plans.${idx}.button.url`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">URL *</FormLabel>
              <FormControl>
                <LinkPickerInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="/signup or https://…"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
