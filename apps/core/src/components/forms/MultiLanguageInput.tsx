"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { IconComponent } from "@repo/ui/components/icons";
import type { LocalizedText, FormField } from "@repo/types";

interface MultiLanguageInputProps {
  field: FormField;
  defaultValue?: LocalizedText | string;
  currentLanguage: string;
  onValueChange?: (value: LocalizedText) => void;
}

export function MultiLanguageInput({ 
  field, 
  defaultValue, 
  currentLanguage,
  onValueChange 
}: MultiLanguageInputProps) {
  const [activeTab, setActiveTab] = useState<'en' | 'mm'>('en');
  
  // Initialize values from defaultValue
  const initValue = typeof defaultValue === 'string' 
    ? { en: defaultValue, mm: '' }
    : defaultValue || { en: '', mm: '' };
    
  const [values, setValues] = useState<LocalizedText>(initValue);

  const handleValueChange = (lang: 'en' | 'mm', value: string) => {
    const newValues = { ...values, [lang]: value };
    setValues(newValues);
    onValueChange?.(newValues);
  };

  const getValidationProps = () => {
    const props: Record<string, any> = {};
    
    if (field.validationRule.required) {
      props.required = true;
    }
    
    if (field.fieldType === 'email') {
      props.type = 'email';
    }
    
    if (field.fieldType === 'number') {
      props.type = 'number';
      if (field.validationRule.min !== undefined) props.min = field.validationRule.min;
      if (field.validationRule.max !== undefined) props.max = field.validationRule.max;
    }
    
    if (field.validationRule.minLength) {
      props.minLength = field.validationRule.minLength;
    }
    
    if (field.validationRule.maxLength) {
      props.maxLength = field.validationRule.maxLength;
    }
    
    if (field.validationRule.pattern) {
      props.pattern = field.validationRule.pattern;
    }
    
    return props;
  };

  const validationProps = getValidationProps();
  const label = currentLanguage === 'mm' ? field.label.mm : field.label.en;

  const commonInputProps = {
    disabled: field.readonly,
    className: `w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
      field.readonly ? 'bg-muted cursor-not-allowed' : ''
    }`,
    ...validationProps
  };

  const renderInputField = (lang: 'en' | 'mm') => {
    const placeholder = lang === 'en' 
      ? field.placeHolder || 'Enter text in English'
      : 'မြန်မာဘာသာဖြင့် ရေးပါ';

    const inputProps = {
      ...commonInputProps,
      value: values[lang],
      placeholder,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        handleValueChange(lang, e.target.value)
    };

    switch (field.fieldType) {
      case 'textArea':
        return (
          <textarea 
            {...inputProps}
            rows={field.rows || 4}
            className={`${commonInputProps.className} resize-vertical`}
          />
        );
      
      default:
        return (
          <input 
            type={field.fieldType === 'password' ? 'password' : 
                  field.fieldType === 'email' ? 'email' : 'text'}
            {...inputProps}
          />
        );
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">
        {label} {field.validationRule.required && <span className="text-red-500">*</span>}
        <span className="text-xs text-muted-foreground ml-2">
          (Multilanguage field)
        </span>
      </label>

      {/* Language Tabs */}
      <div className="flex border-b border-border">
        <Button
          type="button"
          variant={activeTab === 'en' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-none border-b-2 ${
            activeTab === 'en' 
              ? 'border-primary bg-primary/10' 
              : 'border-transparent hover:border-border'
          }`}
          onClick={() => setActiveTab('en')}
        >
          <IconComponent name="Globe" className="w-4 h-4 mr-1" />
          English
        </Button>
        <Button
          type="button"
          variant={activeTab === 'mm' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-none border-b-2 ${
            activeTab === 'mm' 
              ? 'border-primary bg-primary/10' 
              : 'border-transparent hover:border-border'
          }`}
          onClick={() => setActiveTab('mm')}
        >
          <IconComponent name="Languages" className="w-4 h-4 mr-1" />
          မြန်မာ
        </Button>
      </div>

      {/* Input Fields */}
      <div className="space-y-2">
        {activeTab === 'en' && (
          <div>
            {renderInputField('en')}
            <p className="text-xs text-muted-foreground mt-1">
              English content
            </p>
          </div>
        )}
        {activeTab === 'mm' && (
          <div>
            {renderInputField('mm')}
            <p className="text-xs text-muted-foreground mt-1">
              မြန်မာဘာသာ အကြောင်းအရာ
            </p>
          </div>
        )}
      </div>

      {/* Preview of both languages */}
      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Preview:</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">EN:</span> 
            <span className="ml-2 text-muted-foreground">
              {values.en || 'Not set'}
            </span>
          </div>
          <div>
            <span className="font-medium">MM:</span> 
            <span className="ml-2 text-muted-foreground">
              {values.mm || 'မထည့်သွင်းထားပါ'}
            </span>
          </div>
        </div>
      </div>

      {/* Hidden inputs to submit the data */}
      <input 
        type="hidden" 
        name={`${field.fieldName}.en`} 
        value={values.en} 
      />
      <input 
        type="hidden" 
        name={`${field.fieldName}.mm`} 
        value={values.mm} 
      />

      {field.validationRule.errorMessage && (
        <p className="text-xs text-muted-foreground">
          {currentLanguage === 'mm' ? field.validationRule.errorMessage.mm : field.validationRule.errorMessage.en}
        </p>
      )}
    </div>
  );
}