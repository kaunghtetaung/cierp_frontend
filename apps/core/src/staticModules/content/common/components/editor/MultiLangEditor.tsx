'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { TiptapEditor } from './TiptapEditor';
import type { MultiLanguageText } from '../../types';

interface MultiLangEditorProps {
  value?: MultiLanguageText;
  onChange?: (value: MultiLanguageText) => void;
  placeholder?: {
    en?: string;
    mm?: string;
  };
  editable?: boolean;
  className?: string;
  minHeight?: string;
  label?: string;
  required?: boolean;
  error?: string;
}

export function MultiLangEditor({
  value = { en: '', mm: '' },
  onChange,
  placeholder = {
    en: 'Write content in English...',
    mm: 'မြန်မာဘာသာဖြင့် ရေးသားပါ...',
  },
  editable = true,
  className,
  minHeight = '300px',
  label,
  required,
  error,
}: MultiLangEditorProps) {
  const [activeTab, setActiveTab] = useState<'en' | 'mm'>('en');

  const handleEnChange = (html: string) => {
    onChange?.({ ...value, en: html });
  };

  const handleMmChange = (html: string) => {
    onChange?.({ ...value, mm: html });
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'en' | 'mm')}>
        <TabsList className="mb-2">
          <TabsTrigger value="en" className="flex items-center gap-2">
            <span className="text-xs">🇬🇧</span>
            English
            {value.en && <span className="w-2 h-2 rounded-full bg-primary" />}
          </TabsTrigger>
          <TabsTrigger value="mm" className="flex items-center gap-2">
            <span className="text-xs">🇲🇲</span>
            မြန်မာ
            {value.mm && <span className="w-2 h-2 rounded-full bg-primary" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="en" className="mt-0">
          <TiptapEditor
            content={value.en}
            onChange={handleEnChange}
            placeholder={placeholder.en}
            editable={editable}
            minHeight={minHeight}
          />
        </TabsContent>

        <TabsContent value="mm" className="mt-0">
          <TiptapEditor
            content={value.mm}
            onChange={handleMmChange}
            placeholder={placeholder.mm}
            editable={editable}
            minHeight={minHeight}
          />
        </TabsContent>
      </Tabs>

      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

export default MultiLangEditor;
