'use client';

import React from 'react';
import { Input, Label, Textarea } from '@repo/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { Switch } from '@repo/ui';
import type { ModuleSchema, FormLayout } from '../lib/types';
import { FORM_LAYOUTS } from '../lib/types';

interface BasicInfoFormProps {
  data: Partial<ModuleSchema>;
  onChange: (data: Partial<ModuleSchema>) => void;
  isEdit?: boolean;
}

const SERVICES = [
  { value: 'Core', label: 'Core' },
  { value: 'Library', label: 'Library' },
  { value: 'CPMS', label: 'CPMS' },
  { value: 'Content', label: 'Content' },
];

const ICON_OPTIONS = [
  'Building2', 'Building', 'Layout', 'User', 'Users', 'Settings',
  'KeyRound', 'UserCog', 'Mail', 'Phone', 'Calendar', 'Clock',
  'FileText', 'Folder', 'Database', 'Shield', 'Lock', 'Key',
  'Book', 'BookOpen', 'Bookmark', 'Tag', 'Tags', 'Star',
  'Heart', 'Bell', 'MessageSquare', 'Send', 'Upload', 'Download',
  'Image', 'Video', 'Music', 'File', 'Archive', 'Paperclip',
  'Link', 'Globe', 'Map', 'MapPin', 'Navigation', 'Compass',
  'Home', 'Store', 'ShoppingCart', 'CreditCard', 'DollarSign', 'Wallet',
  'BarChart', 'PieChart', 'TrendingUp', 'Activity', 'Zap', 'Target',
  'Award', 'Gift', 'Package', 'Box', 'Truck', 'Plane',
];

export function BasicInfoForm({ data, onChange, isEdit = false }: BasicInfoFormProps) {
  const handleChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      onChange({
        ...data,
        [parent]: {
          ...(data as any)[parent],
          [child]: value,
        },
      });
    } else {
      onChange({ ...data, [field]: value });
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Name */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name-en">Module Name (English) *</Label>
          <Input
            id="name-en"
            value={data.name?.en || ''}
            onChange={(e) => handleChange('name.en', e.target.value)}
            placeholder="e.g., Users"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name-mm">Module Name (Myanmar) *</Label>
          <Input
            id="name-mm"
            value={data.name?.mm || ''}
            onChange={(e) => handleChange('name.mm', e.target.value)}
            placeholder="e.g., အသုံးပြုသူများ"
          />
        </div>
      </div>

      {/* Slug and Service */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={data.slug || ''}
            onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            placeholder="e.g., users"
            disabled={isEdit}
          />
          <p className="text-xs text-muted-foreground">
            URL path for the module (lowercase, no spaces)
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="serviceName">Service Name *</Label>
          <Select
            value={data.serviceName || ''}
            onValueChange={(value) => handleChange('serviceName', value)}
            disabled={isEdit}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select service" />
            </SelectTrigger>
            <SelectContent>
              {SERVICES.map((service) => (
                <SelectItem key={service.value} value={service.value}>
                  {service.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="description-en">Description (English) *</Label>
          <Textarea
            id="description-en"
            value={data.description?.en || ''}
            onChange={(e) => handleChange('description.en', e.target.value)}
            placeholder="Brief description of the module"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description-mm">Description (Myanmar) *</Label>
          <Textarea
            id="description-mm"
            value={data.description?.mm || ''}
            onChange={(e) => handleChange('description.mm', e.target.value)}
            placeholder="မော်ဂျူး၏ အကျဉ်းချုပ်ဖော်ပြချက်"
            rows={2}
          />
        </div>
      </div>

      {/* Icon and Form Layout */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="iconName">Icon Name *</Label>
          <Select
            value={data.iconName || ''}
            onValueChange={(value) => handleChange('iconName', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select icon" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {ICON_OPTIONS.map((icon) => (
                <SelectItem key={icon} value={icon}>
                  {icon}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Lucide icon name for sidebar
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="formLayout">Form Layout *</Label>
          <Select
            value={data.formLayout || ''}
            onValueChange={(value) => handleChange('formLayout', value as FormLayout)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select layout" />
            </SelectTrigger>
            <SelectContent>
              {FORM_LAYOUTS.map((layout) => (
                <SelectItem key={layout.value} value={layout.value}>
                  {layout.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Parent Module */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="parentModule">Parent Module (Optional)</Label>
          <Input
            id="parentModule"
            value={data.parentModule || ''}
            onChange={(e) => handleChange('parentModule', e.target.value || null)}
            placeholder="e.g., setup (parent module slug)"
          />
          <p className="text-xs text-muted-foreground">
            Leave empty for root-level module
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="customLayoutName">Custom Layout Name (Optional)</Label>
          <Input
            id="customLayoutName"
            value={data.customLayoutName || ''}
            onChange={(e) => handleChange('customLayoutName', e.target.value)}
            placeholder="e.g., StudentRegistrationForm"
            disabled={data.formLayout !== 'custom'}
          />
          <p className="text-xs text-muted-foreground">
            Only for custom form layouts
          </p>
        </div>
      </div>

      {/* Switches */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label>Is Active</Label>
            <p className="text-xs text-muted-foreground">
              Enable or disable module
            </p>
          </div>
          <Switch
            checked={data.isActive !== false}
            onCheckedChange={(checked) => handleChange('isActive', checked)}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label>Has Dashboard</Label>
            <p className="text-xs text-muted-foreground">
              Module has dashboard endpoint
            </p>
          </div>
          <Switch
            checked={data.hasDashboard === true}
            onCheckedChange={(checked) => handleChange('hasDashboard', checked)}
          />
        </div>
      </div>

      {/* Version info (read-only for edit mode) */}
      {isEdit && data.version !== undefined && (
        <div className="rounded-lg border p-4 bg-muted/50">
          <h4 className="text-sm font-medium mb-2">Version Information</h4>
          <div className="grid gap-2 md:grid-cols-3 text-sm">
            <div>
              <span className="text-muted-foreground">Version:</span>{' '}
              <span className="font-mono">{data.version}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Module ID:</span>{' '}
              <span className="font-mono">{data.id}</span>
            </div>
            <div>
              <span className="text-muted-foreground">MongoDB ID:</span>{' '}
              <span className="font-mono text-xs">{data._id}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
