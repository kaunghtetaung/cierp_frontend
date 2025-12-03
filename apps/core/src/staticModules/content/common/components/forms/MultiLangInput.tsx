'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { Input, Textarea, Label } from '@repo/ui';
import { cn } from '@repo/ui';
import type { MultiLanguageText } from '../../types';

interface MultiLangInputProps {
  value?: MultiLanguageText;
  onChange?: (value: MultiLanguageText) => void;
  placeholder?: {
    en?: string;
    mm?: string;
  };
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  multiline?: boolean;
  rows?: number;
}

export function MultiLangInput({
  value = { en: '', mm: '' },
  onChange,
  placeholder = {
    en: 'Enter text in English',
    mm: 'မြန်မာဘာသာဖြင့် ထည့်ပါ',
  },
  label,
  required,
  error,
  disabled,
  className,
  multiline = false,
  rows = 3,
}: MultiLangInputProps) {
  const [activeTab, setActiveTab] = useState<'en' | 'mm'>('en');

  const handleChange = (lang: 'en' | 'mm', text: string) => {
    onChange?.({ ...value, [lang]: text });
  };

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className={className}>
      {label && (
        <Label className="block text-sm font-medium text-foreground mb-2">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'en' | 'mm')}>
        <TabsList className="h-8 mb-2">
          <TabsTrigger value="en" className="text-xs px-2 py-1 flex items-center gap-1">
            <span>🇬🇧</span>
            EN
            {value.en && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </TabsTrigger>
          <TabsTrigger value="mm" className="text-xs px-2 py-1 flex items-center gap-1">
            <span>🇲🇲</span>
            MM
            {value.mm && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="en" className="mt-0">
          <InputComponent
            value={value.en}
            onChange={(e) => handleChange('en', e.target.value)}
            placeholder={placeholder.en}
            disabled={disabled}
            className={cn(error && 'border-destructive')}
            {...(multiline && { rows })}
          />
        </TabsContent>

        <TabsContent value="mm" className="mt-0">
          <InputComponent
            value={value.mm}
            onChange={(e) => handleChange('mm', e.target.value)}
            placeholder={placeholder.mm}
            disabled={disabled}
            className={cn(error && 'border-destructive')}
            {...(multiline && { rows })}
          />
        </TabsContent>
      </Tabs>

      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

export default MultiLangInput;
