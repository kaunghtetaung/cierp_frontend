"use client";

import React, { useState } from "react";
import { useForm, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getLocalizedText } from "@repo/utils";
import { Button, IconComponent, Form } from "@repo/ui";
import { FormFieldRenderer } from "@repo/schema-forms";
import { FormTableSection } from "@repo/schema-forms/components/FormTableSection";
import { generateZodSchema } from "@repo/schema-utils";
import type { ExtraActionForm } from "@repo/types";
import { extractItemId, extractItemIds } from "./pre-built/form-utils";
import { isDebugEnabled } from "@/lib/env";

interface DynamicExtraActionFormProps {
  action: ExtraActionForm;
  selectedItems?: string[]; // For actions that require selection
  currentLanguage: string;
  onSubmit: (data: FormData) => Promise<any>;
  onCancel: () => void;
  moduleSlug?: string; // For server action routing
  hideHeader?: boolean; // Hide the form header to prevent duplication in modals
}

export function DynamicExtraActionFormWithSections({
  action,
  selectedItems,
  currentLanguage,
  onSubmit,
  onCancel,
  moduleSlug,
  hideHeader = false,
}: DynamicExtraActionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'table' | 'form'>('table'); // Default to table view
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Debug information state
  const [debugInfo, setDebugInfo] = useState<{
    url?: string;
    method?: string;
    requestBody?: any;
    response?: any;
    error?: string;
    timestamp?: string;
  } | null>(null);


  // Check if this is a sectioned form
  const sections = (action as any).sections;
  const hasSections = sections && sections.length > 0;

  // If no sections, check for form fields (backward compatibility)
  if (!hasSections && (!action.formFields || action.formFields.length === 0)) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">
          {currentLanguage === "mm"
            ? "ဖောင်မ်ကွက်များ မတွေ့ရှိပါ"
            : "No form fields found"}
        </p>
      </div>
    );
  }

  // Extract form fields from sections or use direct formFields
  const formFields = hasSections 
    ? sections.find((s: any) => s.type === "form")?.fields || []
    : action.formFields || [];

  // Generate Zod schema for validation
  const validationSchema = formFields.length > 0 ? generateZodSchema(formFields) : null;

  // Initialize React Hook Form
  const form = useForm<FieldValues>({
    resolver: validationSchema ? zodResolver(validationSchema) : undefined,
    defaultValues: editingItem || {},
    mode: action.formValidation?.validateOnChange ? "onChange" : "onSubmit",
  });

  const {
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = form;

  const isVerticalLayout = action.formLayout === "vertical" || action.formLayout === "wizard-vertical";

  const handleFormSubmit = async (data: FieldValues) => {
    try {
      setIsSubmitting(true);

      // Convert form data to FormData for server action
      const formData = new FormData();

      // Add action metadata
      formData.append("actionKey", action.actionKey);
      
      // Add moduleSlug if provided
      if (moduleSlug && moduleSlug !== 'undefined') {
        formData.append("moduleSlug", moduleSlug);
      }

      // Add selected items if this action requires selection
      if (action.requiresSelection && selectedItems) {
        // Extract IDs from selected items (handles both strings and objects)
        const ids = extractItemIds(selectedItems);
        ids.forEach((id) => formData.append("selectedIds", id));

        // Also add the first item as 'id' for single-item actions
        if (ids.length === 1) {
          formData.append("id", ids[0]);
        }
      }

      // Add editing item ID if editing
      if (editingItem) {
        // For update, pass the item identifier (prefer _id, then id, then accessionNo)
        const itemIdentifier = editingItem._id || editingItem.id || editingItem.accessionNo;
        formData.append("itemId", itemIdentifier);
        
        // Also append accessionNo if it exists (for accession management)
        if (editingItem.accessionNo) {
          formData.append("accessionNo", editingItem.accessionNo);
        }
        
        // IMPORTANT: Ensure _id is included in the form data if it exists
        if (!data._id && editingItem._id) {
          data._id = editingItem._id;
        }
        
        formData.append("action", "update");
      } else {
        formData.append("action", "add");
      }

      // Add form field data
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (typeof value === "object" && value.en !== undefined) {
            // Handle multi-language fields - send as nested JSON object
            formData.append(key, JSON.stringify(value));
          } else if (Array.isArray(value)) {
            // Handle array values (multi-select)
            value.forEach((item) => {
              // Extract ID if item is an object, otherwise use as-is
              if (typeof item === 'object' && (item.id || item._id || item.value)) {
                const extractedValue = String(item.id || item._id || item.value);
                formData.append(key, extractedValue);
              } else {
                formData.append(key, String(item));
              }
            });
          } else {
            // Safe serialization
            formData.append(key, String(value));
          }
        }
      });

      const result = await onSubmit(formData);

      // Capture debug info from result
      if (result?.debugInfo) {
        setDebugInfo(result.debugInfo);
      }

      // Show success message
      setMessage({
        type: 'success',
        text: editingItem
          ? (currentLanguage === "mm" ? "အောင်မြင်စွာ မွမ်းမံပြီးပါပြီ" : "Successfully updated")
          : (currentLanguage === "mm" ? "အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ" : "Successfully added")
      });

      // Reset form and refresh table
      reset();
      setEditingItem(null);
      setRefreshTrigger(prev => prev + 1);

      // Switch back to table view after successful save
      setViewMode('table');

      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error("Form submission error:", error);
      setMessage({
        type: 'error',
        text: currentLanguage === "mm" ? "အမှားရှိနေပါသည်" : "An error occurred"
      });
      // Clear error message after 7 seconds
      setTimeout(() => setMessage(null), 7000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    // Populate form with item data including _id
    Object.keys(item).forEach(key => {
      form.setValue(key, item[key]);
    });
    
    // Explicitly ensure _id is set if it exists
    if (item._id) {
      form.setValue('_id', item._id);
    }
    
    // Switch to form view for editing
    setViewMode('form');
  };

  const handleDelete = async (item: any) => {
    try {
      const formData = new FormData();
      formData.append("actionKey", action.actionKey);
      formData.append("moduleSlug", moduleSlug || "");
      formData.append("id", selectedItems?.[0] || "");
      // Pass item identifier (could be accessionNo, id, or other field)
      formData.append("itemId", item.id || item.accessionNo);
      // Also append accessionNo if it exists (for accession management)
      if (item.accessionNo) {
        formData.append("accessionNo", item.accessionNo);
      }
      formData.append("action", "delete");

      await onSubmit(formData);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // Render sections if available
  if (hasSections) {
    const formSection = sections.find((s: any) => s.type === "form");
    const tableSection = sections.find((s: any) => s.type === "table");

    // If we have both form and table sections, display them with toggle
    if (formSection && tableSection) {
      return (
        <div className="flex flex-col gap-4">
          {/* Form Header - Only show description if available */}
          {!hideHeader && action.description && (
            <div className="flex items-start gap-3">
              {action.iconName && (
                <div className="p-2 bg-primary/10 rounded-lg">
                  <IconComponent
                    name={action.iconName}
                    className="w-5 h-5 text-primary"
                  />
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-sm">
                  {getLocalizedText(action.description, currentLanguage)}
                </p>
              </div>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div className={`p-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
              <IconComponent 
                name={message.type === 'success' ? 'CheckCircle' : 'AlertCircle'} 
                className="w-5 h-5 flex-shrink-0"
              />
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          {/* View Toggle - Show appropriate view based on state */}
          {viewMode === 'table' ? (
            <div className="space-y-4">
              {/* Add New Button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setEditingItem(null);
                    reset();
                    setViewMode('form');
                  }}
                  size="default"
                  variant="default"
                >
                  <IconComponent name="Plus" className="w-4 h-4 mr-2" />
                  {currentLanguage === "mm" ? "အသစ်ထည့်မည်" : "Add New"}
                </Button>
              </div>

              {/* Table Section */}
              <FormTableSection
                section={tableSection}
                currentLanguage={currentLanguage}
                selectedItemId={selectedItems?.[0]}
                moduleSlug={moduleSlug}
                onEdit={handleEdit}
                onDelete={handleDelete}
                refreshTrigger={refreshTrigger}
              />
            </div>
          ) : (
            /* Form Section */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">
                  {editingItem 
                    ? (currentLanguage === "mm" ? "ပြင်ဆင်မည်" : "Edit Item")
                    : (formSection.title && getLocalizedText(formSection.title, currentLanguage))
                  }
                </h3>
                <Button
                  onClick={() => {
                    setEditingItem(null);
                    reset();
                    setViewMode('table');
                  }}
                  size="sm"
                  variant="ghost"
                >
                  <IconComponent name="ArrowLeft" className="w-4 h-4 mr-2" />
                  {currentLanguage === "mm" ? "နောက်သို့" : "Back"}
                </Button>
              </div>
              
              <Form {...form}>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                  {/* 🔍 DEBUG: Log form state */}
                  {(() => {
                    console.log('🎨 Form render state:', {
                      isSubmitting,
                      viewMode,
                      editingItem: !!editingItem,
                      fieldsCount: formSection.fields.length,
                      formDisabled: isSubmitting,
                      hasErrors: Object.keys(errors).length > 0,
                      errors
                    });
                    return null;
                  })()}
                  <div className="grid md:grid-cols-2 gap-4">
                    {formSection.fields.map((field: any) =>
                      <div key={field.fieldName} className={`min-w-0 ${field.fieldType === 'textArea' ? 'col-span-full' : ''}`}>
                        <FormFieldRenderer
                          field={field}
                          currentLanguage={currentLanguage}
                          isVerticalLayout={false}
                          errors={errors}
                          watch={watch}
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={() => {
                        setEditingItem(null);
                        reset();
                        setViewMode('table');
                      }}
                    >
                      <IconComponent name="X" className="w-4 h-4 mr-2" />
                      {currentLanguage === "mm" ? "မလုပ်တော့" : "Cancel"}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      size="default"
                      variant="default"
                    >
                      {isSubmitting ? (
                        <>
                          <IconComponent name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                          {currentLanguage === "mm" ? "သိမ်းဆည်းနေသည်..." : "Saving..."}
                        </>
                      ) : editingItem ? (
                        <>
                          <IconComponent name="Save" className="w-4 h-4 mr-2" />
                          {currentLanguage === "mm" ? "မွမ်းမံမည်" : "Update"}
                        </>
                      ) : (
                        <>
                          <IconComponent name="Check" className="w-4 h-4 mr-2" />
                          {getLocalizedText(formSection.submitButton?.label || 
                            { en: "Save", mm: "သိမ်းမည်" }, currentLanguage)}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <IconComponent name="X" className="w-4 h-4 mr-2" />
              {currentLanguage === "mm" ? "ပိတ်မည်" : "Close"}
            </Button>
          </div>
        </div>
      );
    }
  }

  // Fallback to standard form rendering (backward compatibility)
  return (
    <div className="space-y-6">
      {/* Form Header */}
      {!hideHeader && action.description && (
        <div className="flex items-start gap-3 pb-4">
          {action.iconName && (
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <IconComponent
                name={action.iconName}
                className="w-5 h-5 text-primary"
              />
            </div>
          )}
          <div className="flex-1">
            <p className="text-muted-foreground text-sm">
              {getLocalizedText(action.description, currentLanguage)}
            </p>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <Form {...form}>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4 items-start">
            {formFields.map((field: any) =>
              <div key={field.fieldName} className={`min-w-0 ${field.fieldType === 'textArea' ? 'col-span-full' : ''}`}>
                <FormFieldRenderer
                  field={field}
                  currentLanguage={currentLanguage}
                  isVerticalLayout={false}
                  errors={errors}
                  watch={watch}
                />
              </div>
            )}
          </div>

          {/* Debug Information Section - Only show in development */}
          {isDebugEnabled() && debugInfo && (
            <div className="border-2 rounded-lg p-4 bg-blue-50 border-blue-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base flex items-center gap-2 text-blue-900">
                  🔍 API Request/Response Details
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  debugInfo.error
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {debugInfo.error ? '❌ Failed' : '✅ Success'}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                {/* Request URL and Method */}
                <div className="space-y-1">
                  <div className="font-semibold text-blue-900 text-xs uppercase tracking-wide">
                    Request Endpoint
                  </div>
                  <div className="bg-white p-3 rounded-md border border-blue-200 break-all font-mono text-sm">
                    <span className="inline-block px-2 py-1 bg-blue-600 text-white rounded mr-2 text-xs font-bold">
                      {debugInfo.method}
                    </span>
                    <span className="text-slate-800">{debugInfo.url}</span>
                  </div>
                </div>

                {/* Request Body */}
                <div className="space-y-1">
                  <div className="font-semibold text-blue-900 text-xs uppercase tracking-wide">
                    Request Payload
                  </div>
                  <pre className="bg-white p-3 rounded-md border border-blue-200 overflow-x-auto max-h-64 overflow-y-auto text-xs font-mono leading-relaxed">
{JSON.stringify(debugInfo.requestBody, null, 2)}</pre>
                </div>

                {/* Response or Error */}
                {debugInfo.response && (
                  <div className="space-y-1">
                    <div className="font-semibold text-green-900 text-xs uppercase tracking-wide">
                      ✅ Response Data
                    </div>
                    <pre className="bg-green-50 p-3 rounded-md border border-green-300 overflow-x-auto max-h-64 overflow-y-auto text-xs font-mono text-green-900 leading-relaxed">
{JSON.stringify(debugInfo.response, null, 2)}</pre>
                  </div>
                )}

                {debugInfo.error && (
                  <div className="space-y-1">
                    <div className="font-semibold text-red-900 text-xs uppercase tracking-wide">
                      ❌ Error Message
                    </div>
                    <div className="bg-red-50 p-3 rounded-md border border-red-300 text-sm text-red-900 font-medium">
                      {debugInfo.error}
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-xs text-slate-600 pt-2 border-t border-blue-200">
                  <span className="font-semibold">Timestamp:</span>
                  <span className="font-mono">{new Date(debugInfo.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              size="default"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <IconComponent name="X" className="w-4 h-4 mr-2" />
              {currentLanguage === "mm" ? "မလုပ်တော့ပါ" : "Cancel"}
            </Button>
            <Button
              type="submit"
              size="default"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <IconComponent name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                  {currentLanguage === "mm" ? "သိမ်းဆည်းနေသည်..." : "Saving..."}
                </>
              ) : (
                <>
                  <IconComponent name="Check" className="w-4 h-4 mr-2" />
                  {currentLanguage === "mm" ? "သိမ်းမည်" : "Submit"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}