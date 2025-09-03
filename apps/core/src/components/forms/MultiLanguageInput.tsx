"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import type { MultilingualText, FormField } from "@repo/types";

interface MultiLanguageInputProps {
  field: FormField;
  defaultValue?: MultilingualText | string;
  currentLanguage: string;
  onValueChange?: (value: MultilingualText) => void;
  isVerticalLayout?: boolean;
  errors?: Record<string, string>; // Validation errors from form
}

export function MultiLanguageInput({
  field,
  defaultValue,
  currentLanguage,
  onValueChange,
  isVerticalLayout = false,
  errors,
}: MultiLanguageInputProps) {
  const [showPreview, setShowPreview] = useState(false);
  
  // Refs for inputs
  const enInputRef = useRef<HTMLInputElement>(null);
  const enTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const mmInputRef = useRef<HTMLInputElement>(null);
  const mmTextAreaRef = useRef<HTMLTextAreaElement>(null);
  
  // Ref to track previous defaultValue
  const prevDefaultValueRef = useRef<MultilingualText | string | undefined>(defaultValue);

  // Initialize values from defaultValue
  const initValue =
    typeof defaultValue === "string"
      ? { en: defaultValue, mm: "" }
      : defaultValue || { en: "", mm: "" };

  const [values, setValues] = useState<MultilingualText>(initValue);

  // Update values when defaultValue changes (for form resets, draft restoration, etc.)
  useEffect(() => {
    // Check if defaultValue has actually changed
    if (JSON.stringify(prevDefaultValueRef.current) !== JSON.stringify(defaultValue)) {
      const newInitValue =
        typeof defaultValue === "string"
          ? { en: defaultValue, mm: "" }
          : defaultValue || { en: "", mm: "" };
      
      console.log('🔄 MultiLanguageInput: Updating values from defaultValue:', newInitValue);
      setValues(newInitValue);
      prevDefaultValueRef.current = defaultValue;
    }
  }, [defaultValue]);

  const handleValueChange = (lang: "en" | "mm", value: string) => {
    const newValues = { ...values, [lang]: value };
    setValues(newValues);
    onValueChange?.(newValues);
  };

  // Get validation errors from React Hook Form
  const enError = errors?.[`${field.fieldName}.en`];
  const mmError = errors?.[`${field.fieldName}.mm`];

  // Auto-focus first field with error
  useEffect(() => {
    if (enError) {
      setTimeout(() => {
        const inputElement = field.fieldType === "textArea" ? enTextAreaRef.current : enInputRef.current;
        inputElement?.focus();
      }, 100);
    } else if (mmError) {
      setTimeout(() => {
        const inputElement = field.fieldType === "textArea" ? mmTextAreaRef.current : mmInputRef.current;
        inputElement?.focus();
      }, 100);
    }
  }, [enError, mmError, field.fieldType]);

  const getValidationProps = () => {
    const props: Record<string, any> = {};

    if (field.validationRule?.required) {
      props.required = true;
    }

    if (field.fieldType === "email") {
      props.type = "email";
    }

    if (field.fieldType === "number") {
      props.type = "number";
      if (field.validationRule?.min !== undefined)
        props.min = field.validationRule.min;
      if (field.validationRule?.max !== undefined)
        props.max = field.validationRule.max;
    }

    if (field.validationRule?.minLength) {
      props.minLength = field.validationRule.minLength;
    }

    if (field.validationRule?.maxLength) {
      props.maxLength = field.validationRule.maxLength;
    }

    if (field.validationRule?.pattern) {
      props.pattern = field.validationRule.pattern;
    }

    return props;
  };

  const validationProps = getValidationProps();

  const renderInputField = (lang: "en" | "mm", fieldLabel: string) => {
    const placeholder =
      lang === "en"
        ? field.placeHolder || "Enter text in English"
        : "မြန်မာဘာသာဖြင့် ရေးပါ";

    const hasError = lang === "en" ? enError : mmError;
    const flagEmoji = lang === "en" ? "🇺🇸" : "🇲🇲";

    const baseInputProps = {
      value: values[lang] || "",
      placeholder,
      disabled: field.readonly,
      className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
        hasError 
          ? "border-destructive focus:ring-destructive bg-destructive/5" 
          : "border-input focus:ring-primary"
      } ${field.readonly ? "bg-muted cursor-not-allowed" : ""}`,
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => handleValueChange(lang, e.target.value),
      ...validationProps,
    };

    return (
      <div className="space-y-2">
        {/* Language-specific label */}
        <label className="flex items-center gap-2 text-sm font-medium">
          <span className="text-base">{flagEmoji}</span>
          <span>{fieldLabel}</span>
          {field.validationRule?.required && (
            <span className="text-danger">*</span>
          )}
        </label>
        
        {/* Input field */}
        <div>
          {field.fieldType === "textArea" ? (
            <textarea
              {...baseInputProps}
              ref={lang === "en" ? enTextAreaRef : mmTextAreaRef}
              rows={field.rows || 4}
              className={`${baseInputProps.className} resize-vertical`}
            />
          ) : (
            <input
              type={
                field.fieldType === "password"
                  ? "password"
                  : field.fieldType === "email"
                  ? "email"
                  : "text"
              }
              {...baseInputProps}
              ref={lang === "en" ? enInputRef : mmInputRef}
            />
          )}
          
          {/* Error message */}
          {hasError && (
            <p className="text-xs text-destructive mt-1 flex items-center">
              <IconComponent name="AlertCircle" className="w-3 h-3 mr-1" />
              {hasError}
            </p>
          )}
        </div>
      </div>
    );
  };

  const mainLabel = currentLanguage === "mm" ? field.label.mm : field.label.en;
  const englishLabel = currentLanguage === "mm" ? "အင်္ဂလိပ်" : "English";
  const myanmarLabel = currentLanguage === "mm" ? "မြန်မာ" : "Myanmar";

  if (isVerticalLayout) {
    return (
      <div className="flex items-start gap-2 sm:gap-4">
        {/* Main Label Container */}
        <div className="flex-shrink-0 w-24 sm:w-32 md:w-48 pt-2">
          <label className="block text-xs sm:text-sm font-medium">
            {mainLabel}
            <span className="text-xs text-muted-foreground block mt-1">
              (Multilingual)
            </span>
          </label>
        </div>

        {/* Stacked Input Container */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* English Input */}
          {renderInputField("en", englishLabel)}
          
          {/* Myanmar Input */}
          {renderInputField("mm", myanmarLabel)}
          
          {/* Preview Toggle */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="px-3 py-1 h-auto text-xs"
              onClick={() => setShowPreview(!showPreview)}
            >
              <IconComponent name="Eye" className="w-3 h-3 mr-1" />
              {showPreview ? "Hide Preview" : "Show Preview"}
            </Button>
          </div>
          
          {/* Preview Section */}
          {showPreview && (
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="space-y-3">
                <div className="border border-border rounded-md p-3 bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">🇺🇸</span>
                    <span className="text-sm font-medium">English</span>
                  </div>
                  <div className="text-sm text-foreground min-h-[2rem] whitespace-pre-wrap">
                    {values.en || (
                      <span className="text-muted-foreground italic">No English content</span>
                    )}
                  </div>
                </div>

                <div className="border border-border rounded-md p-3 bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">🇲🇲</span>
                    <span className="text-sm font-medium">မြန်မာ (Myanmar)</span>
                  </div>
                  <div className="text-sm text-foreground min-h-[2rem] whitespace-pre-wrap">
                    {values.mm || (
                      <span className="text-muted-foreground italic">မြန်မာဘာသာ မရှိပါ</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hidden inputs to submit the data */}
          <input type="hidden" name={`${field.fieldName}.en`} value={values.en} />
          <input type="hidden" name={`${field.fieldName}.mm`} value={values.mm} />

          {field.validationRule?.errorMessage && (
            <p className="text-xs text-muted-foreground">
              {currentLanguage === "mm"
                ? field.validationRule.errorMessage.mm
                : field.validationRule.errorMessage.en}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Horizontal layout - stacked inputs
  return (
    <div className="space-y-4">
      {/* Main Label */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">
          {mainLabel}
          <span className="text-xs text-muted-foreground ml-2">
            (Multilingual)
          </span>
        </label>
        
        {/* Preview Toggle */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="px-3 py-1 h-auto text-xs"
          onClick={() => setShowPreview(!showPreview)}
        >
          <IconComponent name="Eye" className="w-3 h-3 mr-1" />
          {showPreview ? "Hide Preview" : "Show Preview"}
        </Button>
      </div>

      {/* Stacked Input Container */}
      <div className="space-y-4">
        {/* English Input */}
        {renderInputField("en", englishLabel)}
        
        {/* Myanmar Input */}
        {renderInputField("mm", myanmarLabel)}
        
        {/* Preview Section */}
        {showPreview && (
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div className="space-y-3">
              <div className="border border-border rounded-md p-3 bg-background">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">🇺🇸</span>
                  <span className="text-sm font-medium">English</span>
                </div>
                <div className="text-sm text-foreground min-h-[2rem] whitespace-pre-wrap">
                  {values.en || (
                    <span className="text-muted-foreground italic">No English content</span>
                  )}
                </div>
              </div>

              <div className="border border-border rounded-md p-3 bg-background">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">🇲🇲</span>
                  <span className="text-sm font-medium">မြန်မာ (Myanmar)</span>
                </div>
                <div className="text-sm text-foreground min-h-[2rem] whitespace-pre-wrap">
                  {values.mm || (
                    <span className="text-muted-foreground italic">မြန်မာဘာသာ မရှိပါ</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden inputs to submit the data */}
        <input type="hidden" name={`${field.fieldName}.en`} value={values.en} />
        <input type="hidden" name={`${field.fieldName}.mm`} value={values.mm} />

        {field.validationRule?.errorMessage && (
          <p className="text-xs text-muted-foreground">
            {currentLanguage === "mm"
              ? field.validationRule.errorMessage.mm
              : field.validationRule.errorMessage.en}
          </p>
        )}
      </div>
    </div>
  );
}
