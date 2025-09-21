"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { getLocalizedText } from "@repo/utils";
import { IconComponent } from "@repo/ui";
import type { QuickEntryConfig, QuickEntryField, MultilingualText } from "@repo/types";

interface QuickEntryDialogProps {
  config: QuickEntryConfig;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  currentLanguage: string;
}

export function QuickEntryDialog({
  config,
  isOpen,
  onClose,
  onSubmit,
  currentLanguage,
}: QuickEntryDialogProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    config.fields.forEach((field) => {
      const value = formData[field.fieldName];
      
      // Check required fields
      if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        newErrors[field.fieldName] = `${getLocalizedText(field.label, currentLanguage)} is required`;
      }
      
      // Additional validation based on field type
      if (field.validationRule) {
        const rule = field.validationRule;
        
        if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
          newErrors[field.fieldName] = `Minimum length is ${rule.minLength}`;
        }
        
        if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
          newErrors[field.fieldName] = `Maximum length is ${rule.maxLength}`;
        }
        
        if (rule.email && field.fieldType === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value as string)) {
            newErrors[field.fieldName] = 'Invalid email format';
          }
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);
    
    try {
      // Prepare data with default values from backend schema
      const submitData = { ...formData };
      
      // Add field-level default values
      config.fields.forEach((field) => {
        if (field.defaultValue !== undefined && submitData[field.fieldName] === undefined) {
          submitData[field.fieldName] = field.defaultValue;
        }
      });
      
      // Add config-level default values from backend
      if (config.defaultValues) {
        Object.keys(config.defaultValues).forEach((key) => {
          if (submitData[key] === undefined) {
            submitData[key] = config.defaultValues![key];
          }
        });
      }
      
      await onSubmit(submitData);
      
      // Success - clear form and show message
      setFormData({});
      setSubmitMessage({
        type: 'success',
        text: currentLanguage === 'mm' ? 'အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ' : 'Successfully created'
      });
      
      // Close after short delay
      setTimeout(() => {
        onClose();
        setSubmitMessage(null);
      }, 1500);
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        text: currentLanguage === 'mm' ? 'ထည့်သွင်းရာတွင် အမှားရှိနေပါသည်' : 'Failed to create'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: QuickEntryField) => {
    const value = formData[field.fieldName] || '';
    const error = errors[field.fieldName];
    
    switch (field.fieldType) {
      case 'text':
      case 'email':
        return (
          <div key={field.fieldName} className="space-y-1.5">
            <Label htmlFor={field.fieldName}>
              {getLocalizedText(field.label, currentLanguage)}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.fieldName}
              type={field.fieldType}
              value={value as string}
              onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
              placeholder={field.placeHolder}
              className={error ? 'border-red-500' : ''}
              disabled={isSubmitting}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );
        
      case 'textArea':
        return (
          <div key={field.fieldName} className="space-y-1.5">
            <Label htmlFor={field.fieldName}>
              {getLocalizedText(field.label, currentLanguage)}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.fieldName}
              value={value as string}
              onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
              placeholder={field.placeHolder}
              className={error ? 'border-red-500' : ''}
              disabled={isSubmitting}
              rows={3}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );
        
      case 'number':
        return (
          <div key={field.fieldName} className="space-y-1.5">
            <Label htmlFor={field.fieldName}>
              {getLocalizedText(field.label, currentLanguage)}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.fieldName}
              type="number"
              value={value as number}
              onChange={(e) => handleFieldChange(field.fieldName, e.target.value ? Number(e.target.value) : '')}
              placeholder={field.placeHolder}
              className={error ? 'border-red-500' : ''}
              disabled={isSubmitting}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );
        
      case 'select':
        return (
          <div key={field.fieldName} className="space-y-1.5">
            <Label htmlFor={field.fieldName}>
              {getLocalizedText(field.label, currentLanguage)}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value as string}
              onValueChange={(val) => handleFieldChange(field.fieldName, val)}
              disabled={isSubmitting}
            >
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder={field.placeHolder || 'Select...'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value as string} value={option.value as string}>
                    {getLocalizedText(option.label, currentLanguage)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );
        
      default:
        return null;
    }
  };

  const title = config.modalTitle 
    ? getLocalizedText(config.modalTitle, currentLanguage)
    : currentLanguage === 'mm' ? 'အသစ်ထည့်ရန်' : 'Add New';
    
  const submitText = currentLanguage === 'mm' ? 'သိမ်းဆည်းမည်' : 'Save';
  
  // Determine modal size class based on config
  const getSizeClass = () => {
    switch (config.modalSize) {
      case 'sm': return 'w-full max-w-sm';
      case 'md': return 'w-full max-w-md';
      case 'lg': return 'w-full max-w-lg';
      case 'xl': return 'w-full max-w-xl';
      default: return 'w-full max-w-sm';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={getSizeClass()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {config.fields.map(renderField)}
          
          {submitMessage && (
            <div
              className={`p-2 rounded text-sm ${
                submitMessage.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {submitMessage.text}
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {currentLanguage === 'mm' ? 'ပယ်ဖျက်မည်' : 'Cancel'}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <IconComponent name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                {currentLanguage === 'mm' ? 'သိမ်းဆည်းနေသည်...' : 'Saving...'}
              </>
            ) : (
              submitText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}