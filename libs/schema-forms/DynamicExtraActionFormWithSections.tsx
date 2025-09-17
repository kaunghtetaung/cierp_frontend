"use client";

import React, { useState } from "react";
import { useForm, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getLocalizedText } from "@repo/utils";
import { Button, IconComponent, Form } from "@repo/ui";
import { FormFieldRenderer } from "./FormFieldRenderer";
import { FormTableSection } from "./components/FormTableSection";
import { generateZodSchema } from "@repo/schema-utils";
import type { ExtraActionForm } from "@repo/types";

interface DynamicExtraActionFormProps {
  action: ExtraActionForm;
  selectedItems?: string[]; // For actions that require selection
  currentLanguage: string;
  onSubmit: (data: FormData) => Promise<void>;
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

  console.log(`🏗️ DynamicExtraActionFormWithSections: Rendering form for action "${action.actionKey}"`, {
    actionKey: action.actionKey,
    hasSections: !!(action as any).sections,
    hasFormFields: !!action.formFields?.length,
    selectedItemsCount: selectedItems?.length,
  });

  // Check if this is a sectioned form
  const sections = (action as any).sections;
  const hasSections = sections && sections.length > 0;

  // If no sections, check for form fields (backward compatibility)
  if (!hasSections && (!action.formFields || action.formFields.length === 0)) {
    console.error(`❌ DynamicExtraActionFormWithSections: No sections or form fields for action "${action.actionKey}"`);
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
        selectedItems.forEach((id) => formData.append("selectedIds", id));
        // Also add the first item as 'id' for single-item actions
        if (selectedItems.length === 1) {
          formData.append("id", selectedItems[0]);
        }
      }

      // Add editing item ID if editing
      if (editingItem) {
        formData.append("itemId", editingItem.id);
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
            value.forEach((item) => formData.append(key, String(item)));
          } else {
            // Safe serialization
            formData.append(key, String(value));
          }
        }
      });

      await onSubmit(formData);
      
      // Reset form and refresh table
      reset();
      setEditingItem(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    // Populate form with item data
    Object.keys(item).forEach(key => {
      form.setValue(key, item[key]);
    });
  };

  const handleDelete = async (item: any) => {
    try {
      const formData = new FormData();
      formData.append("actionKey", action.actionKey);
      formData.append("moduleSlug", moduleSlug || "");
      formData.append("id", selectedItems?.[0] || "");
      formData.append("itemId", item.id);
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

    // If we have both form and table sections, display them vertically (form on top, table below)
    if (formSection && tableSection) {
      return (
        <div className="space-y-6">
          {/* Form Header */}
          {!hideHeader && (action.title || action.description) && (
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
                {action.title && (
                  <h2 className="text-lg font-semibold">
                    {getLocalizedText(action.title, currentLanguage)}
                  </h2>
                )}
                {action.description && (
                  <p className="text-muted-foreground text-sm mt-1">
                    {getLocalizedText(action.description, currentLanguage)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Form Section */}
          <div className="space-y-4">
            {formSection.title && (
              <h3 className="text-base font-medium">
                {getLocalizedText(formSection.title, currentLanguage)}
              </h3>
            )}
            
            <Form {...form}>
              <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                <div className={formSection.layout === "grid" && formSection.columns ? 
                  `grid grid-cols-${formSection.columns} gap-4` : "space-y-4"}>
                  {formSection.fields.map((field: any) =>
                    <FormFieldRenderer
                      key={field.fieldName}
                      field={field}
                      currentLanguage={currentLanguage}
                      isVerticalLayout={isVerticalLayout}
                      errors={errors}
                      watch={watch}
                    />
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  {editingItem && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingItem(null);
                        reset();
                      }}
                    >
                      {currentLanguage === "mm" ? "မလုပ်တော့" : "Cancel Edit"}
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    variant={formSection.submitButton?.style || "primary"}
                  >
                    {isSubmitting && (
                      <IconComponent name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingItem
                      ? (currentLanguage === "mm" ? "ပြင်ဆင်မည်" : "Update")
                      : getLocalizedText(formSection.submitButton?.label || 
                        { en: "Add", mm: "ထည့်သွင်းမည်" }, currentLanguage)
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Separator */}
          <div className="border-t pt-6" />

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

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
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
      {!hideHeader && (action.title || action.description) && (
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
            {action.title && (
              <h2 className="text-lg font-semibold">
                {getLocalizedText(action.title, currentLanguage)}
              </h2>
            )}
            {action.description && (
              <p className="text-muted-foreground text-sm mt-1">
                {getLocalizedText(action.description, currentLanguage)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Form Fields */}
      <Form {...form}>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className={isVerticalLayout ? "space-y-4" : "space-y-4"}>
            {formFields.map((field: any) =>
              <FormFieldRenderer
                key={field.fieldName}
                field={field}
                currentLanguage={currentLanguage}
                isVerticalLayout={isVerticalLayout}
                errors={errors}
                watch={watch}
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {currentLanguage === "mm" ? "မလုပ်တော့ပါ" : "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <IconComponent name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
              )}
              {currentLanguage === "mm" ? "သိမ်းမည်" : "Submit"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}