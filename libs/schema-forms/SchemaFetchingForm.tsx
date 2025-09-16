"use client";

import React, { useEffect, useState } from "react";
import { DynamicExtraActionFormWithSections } from "./DynamicExtraActionFormWithSections";
import { DynamicExtraActionForm } from "./DynamicExtraActionForm";
import { IconComponent } from "@repo/ui";
import type { ExtraActionForm } from "@repo/types";
import { fetchFormSchemaAction } from "./server-actions/form-actions";

interface SchemaFetchingFormProps {
  action: ExtraActionForm;
  selectedItems?: string[];
  currentLanguage: string;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  moduleSlug?: string;
  hideHeader?: boolean;
}

export function SchemaFetchingForm({
  action,
  selectedItems,
  currentLanguage,
  onSubmit,
  onCancel,
  moduleSlug,
  hideHeader = false,
}: SchemaFetchingFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [formSchema, setFormSchema] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchema = async () => {
      if (!action.formName || !moduleSlug) {
        setError("Missing form name or module slug");
        setIsLoading(false);
        return;
      }

      try {
        console.log(`📥 SchemaFetchingForm: Fetching schema for ${action.formName} from ${moduleSlug}`);
        
        // Use server action to fetch schema
        const response = await fetchFormSchemaAction(moduleSlug, action.formName);

        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch form schema');
        }

        const schema = response.data;
        console.log(`✅ SchemaFetchingForm: Schema fetched successfully`, schema);
        
        // Merge the fetched schema with the action
        const mergedAction = {
          ...action,
          ...schema,
          formApproach: 'schema-driven',
        };
        
        setFormSchema(mergedAction);
      } catch (err) {
        console.error(`❌ SchemaFetchingForm: Error fetching schema`, err);
        setError(err instanceof Error ? err.message : 'Failed to load form schema');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchema();
  }, [action.formName, moduleSlug]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <IconComponent name="Loader2" className="w-4 h-4 animate-spin" />
          <span className="text-sm">
            {currentLanguage === "mm" ? "ဖောင်မ် ရယူနေသည်..." : "Loading form..."}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <IconComponent name="AlertCircle" className="w-8 h-8 mx-auto mb-2 text-destructive" />
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  if (!formSchema) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">
          {currentLanguage === "mm" ? "ဖောင်မ် မတွေ့ရှိပါ" : "Form not found"}
        </p>
      </div>
    );
  }

  // Check if the schema has sections
  const hasSections = !!(formSchema.sections?.length);

  // Render the appropriate form component
  if (hasSections) {
    return (
      <DynamicExtraActionFormWithSections
        action={formSchema}
        selectedItems={selectedItems}
        currentLanguage={currentLanguage}
        onSubmit={onSubmit}
        onCancel={onCancel}
        hideHeader={hideHeader}
        moduleSlug={moduleSlug}
      />
    );
  } else {
    return (
      <DynamicExtraActionForm
        action={formSchema}
        selectedItems={selectedItems}
        currentLanguage={currentLanguage}
        onSubmit={onSubmit}
        onCancel={onCancel}
        hideHeader={hideHeader}
        moduleSlug={moduleSlug}
      />
    );
  }
}