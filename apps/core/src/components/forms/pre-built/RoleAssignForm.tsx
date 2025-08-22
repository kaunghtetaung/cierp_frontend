"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconComponent } from "@repo/ui/components/icons";
import { DynamicSelect } from "../DynamicSelect";
import { getLocalizedText } from "@repo/utils";
import type { PreBuiltFormProps } from "../ExtraActionFormRouter";
import type { FormField } from "@repo/types";

// Form data interface
interface RoleAssignFormData {
  organizationId: string;
  departmentId: string;
  roleIds: string[];
}

// Form validation schema  
const createRoleAssignSchema = (currentLanguage: string) =>
  z.object({
    organizationId: z.string().min(1, 
      currentLanguage === "mm" 
        ? "အဖွဲ့အစည်း ရွေးချယ်ရပါမည်"
        : "Organization is required"
    ),
    departmentId: z.string().min(1, 
      currentLanguage === "mm" 
        ? "ဌာန ရွေးချယ်ရပါမည်"
        : "Department is required"
    ),
    roleIds: z.array(z.string()).min(1, 
      currentLanguage === "mm" 
        ? "အနည်းဆုံး တစ်ခုခု ရွေးချယ်ရပါမည်"
        : "At least one role must be selected"
    ),
  });

export function RoleAssignForm({
  action,
  selectedItems,
  currentLanguage,
  onSubmit,
  onCancel,
  hideHeader = false,
}: PreBuiltFormProps) {
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Create validation schema
  const roleAssignSchema = createRoleAssignSchema(currentLanguage);

  // Initialize form
  const form = useForm<RoleAssignFormData>({
    resolver: zodResolver(roleAssignSchema),
    defaultValues: {
      organizationId: "",
      departmentId: "",
      roleIds: [],
    },
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = form;

  // Handle form submission
  const handleFormSubmit = async (data: RoleAssignFormData) => {
    if (!selectedItems || selectedItems.length === 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      // Create FormData for server action
      const formData = new FormData();

      // Add metadata
      formData.append("actionKey", action.actionKey);
      formData.append("organizationId", data.organizationId);
      formData.append("departmentId", data.departmentId);
      
      // Add role IDs
      data.roleIds.forEach((roleId) => {
        formData.append("roleIds", roleId);
      });

      // Add selected user ID
      if (selectedItems.length > 0) {
        formData.append("id", selectedItems[0]);
      }

      // Submit to server action
      await onSubmit(formData);

      const successResult = {
        success: true,
        message:
          currentLanguage === "mm"
            ? "အခန်းကဏ္ဍများ အောင်မြင်စွာ သတ်မှတ်ပြီးပါပြီ"
            : "Roles assigned successfully",
      };
      
      setSubmitResult(successResult);
      reset();
    } catch (error) {
      const errorResult = {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : currentLanguage === "mm"
            ? "အခန်းကဏ္ဍ သတ်မှတ်ရာတွင် အမှားအယွင်း ဖြစ်ပွားခဲ့သည်"
            : "An error occurred while assigning roles",
      };
      
      setSubmitResult(errorResult);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get user identifier for display
  const getUserIdentifier = () => {
    if (selectedItems && selectedItems.length > 0) {
      return selectedItems[0];
    }
    return currentLanguage === "mm" ? "ရွေးချယ်ထားသော အသုံးပြုသူ" : "Selected User";
  };

  // Create form field configurations for dynamic selects
  const organizationField: FormField = {
    fieldName: "organizationId",
    fieldType: "select",
    label: {
      en: "Organization",
      mm: "အဖွဲ့အစည်း"
    },
    placeHolder: currentLanguage === "mm" ? "အဖွဲ့အစည်း ရွေးချယ်ပါ" : "Select organization",
    validationRule: {
      required: true,
      errorMessage: {
        en: "Organization is required",
        mm: "အဖွဲ့အစည်း ရွေးချယ်ရပါမည်"
      }
    },
    readonly: false,
    hidden: false,
    isMultiLang: false,
    dropdownConfig: {
      type: "dynamic",
      refPath: "/organizations/ref",
      searchable: true,
      clearable: false,
      preloadData: true
    }
  };

  const departmentField: FormField = {
    fieldName: "departmentId", 
    fieldType: "select",
    label: {
      en: "Department",
      mm: "ဌာန"
    },
    placeHolder: currentLanguage === "mm" ? "ဌာန ရွေးချယ်ပါ" : "Select department",
    validationRule: {
      required: true,
      errorMessage: {
        en: "Department is required",
        mm: "ဌာန ရွေးချယ်ရပါမည်"
      }
    },
    readonly: false,
    hidden: false,
    isMultiLang: false,
    dropdownConfig: {
      type: "dynamic",
      refPath: "/departments/ref",
      searchable: true,
      clearable: false,
      preloadData: true,
      dependsOn: ["organizationId"],
      options: [
        {
          value: "*",
          label: {
            en: "* All Departments",
            mm: "* ဌာနအားလုံး"
          }
        }
      ]
    }
  };

  const roleField: FormField = {
    fieldName: "roleIds",
    fieldType: "multiSelect", 
    label: {
      en: "Roles",
      mm: "အခန်းကဏ္ဍများ"
    },
    placeHolder: currentLanguage === "mm" ? "အခန်းကဏ္ဍများ ရွေးချယ်ပါ" : "Select roles",
    validationRule: {
      required: true,
      errorMessage: {
        en: "At least one role must be selected",
        mm: "အနည်းဆုံး တစ်ခုခု ရွေးချယ်ရပါမည်"
      }
    },
    readonly: false,
    hidden: false,
    isMultiLang: false,
    dropdownConfig: {
      type: "dynamic",
      refPath: "/roles/ref",
      searchable: true,
      clearable: true,
      multiple: true,
      preloadData: true,
      dependsOn: ["organizationId", "departmentId"]
    }
  };

  return (
    <div className="w-full">
      {!hideHeader && (
        <div className="text-center pb-6">
          <div className="flex items-center justify-center gap-2 text-lg font-semibold">
            <IconComponent name={action.iconName || "UserCheck"} className="w-5 h-5" />
            {getLocalizedText(action.title, currentLanguage)}
          </div>
          {action.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {getLocalizedText(action.description, currentLanguage)}
            </p>
          )}
          <div className="text-sm text-muted-foreground mt-2">
            {currentLanguage === "mm" ? "အသုံးပြုသူ: " : "User: "}
            <span className="font-mono">{getUserIdentifier()}</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Show result if available */}
        {submitResult && (
          <Alert variant={submitResult.success ? "default" : "destructive"}>
            <IconComponent
              name={submitResult.success ? "CheckCircle" : "AlertCircle"}
              className="w-4 h-4"
            />
            <AlertDescription>{submitResult.message}</AlertDescription>
          </Alert>
        )}

        {/* Form - Hide when successfully submitted */}
        {!submitResult?.success && (
          <form 
            onSubmit={handleSubmit(handleFormSubmit)} 
            className="space-y-6"
          >
            {/* Organization Selection */}
            <div className="space-y-2">
              <Label>
                <span className="flex items-center gap-2">
                  <IconComponent name="Building" className="w-4 h-4" />
                  {getLocalizedText(organizationField.label, currentLanguage)}
                  <span className="text-destructive">*</span>
                </span>
              </Label>
              <Controller
                name="organizationId"
                control={control}
                render={({ field }) => (
                  <DynamicSelect
                    field={organizationField}
                    value={field.value}
                    onChange={field.onChange}
                    currentLanguage={currentLanguage}
                    watch={watch}
                    errors={errors}
                  />
                )}
              />
              {errors.organizationId && (
                <p className="text-sm text-destructive">{errors.organizationId.message}</p>
              )}
            </div>

            {/* Department Selection */}
            <div className="space-y-2">
              <Label>
                <span className="flex items-center gap-2">
                  <IconComponent name="Building2" className="w-4 h-4" />
                  {getLocalizedText(departmentField.label, currentLanguage)}
                  <span className="text-destructive">*</span>
                </span>
              </Label>
              <Controller
                name="departmentId"
                control={control}
                render={({ field }) => (
                  <DynamicSelect
                    field={departmentField}
                    value={field.value}
                    onChange={field.onChange}
                    currentLanguage={currentLanguage}
                    watch={watch}
                    errors={errors}
                  />
                )}
              />
              {errors.departmentId && (
                <p className="text-sm text-destructive">{errors.departmentId.message}</p>
              )}
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label>
                <span className="flex items-center gap-2">
                  <IconComponent name="Shield" className="w-4 h-4" />
                  {getLocalizedText(roleField.label, currentLanguage)}
                  <span className="text-destructive">*</span>
                </span>
              </Label>
              <Controller
                name="roleIds"
                control={control}
                render={({ field }) => (
                  <DynamicSelect
                    field={roleField}
                    value={field.value}
                    onChange={field.onChange}
                    currentLanguage={currentLanguage}
                    watch={watch}
                    errors={errors}
                  />
                )}
              />
              {errors.roleIds && (
                <p className="text-sm text-destructive">{errors.roleIds.message}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                {currentLanguage === "mm" ? "မလုပ်တော့" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
                variant={action.buttonStyle === "warning" ? "destructive" : "default"}
              >
                {isSubmitting && <IconComponent name="Loader2" className="w-4 h-4 mr-2 animate-spin" />}
                {isSubmitting
                  ? currentLanguage === "mm"
                    ? "သတ်မှတ်နေသည်..."
                    : "Assigning..."
                  : currentLanguage === "mm"
                  ? "အခန်းကဏ္ဍ သတ်မှတ်မည်"
                  : "Assign Roles"}
              </Button>
            </div>
          </form>
        )}

        {/* Success State Action Buttons - Show when successfully completed */}
        {submitResult?.success && (
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              <IconComponent name="Check" className="w-4 h-4 mr-2" />
              {currentLanguage === "mm" ? "ပြီးပါပြီ" : "Done"}
            </Button>
          </div>
        )}

        {/* Information */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <IconComponent name="Info" className="w-4 h-4 mt-0.5 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">
              {currentLanguage === "mm" ? (
                <>
                  <p className="mb-1">• အဖွဲ့အစည်း ရွေးချယ်ပြီးနောက် ဌာနများ ပေါ်လာပါမည်</p>
                  <p className="mb-1">• "* ဌာနအားလုံး" ရွေးချယ်လျှင် အဖွဲ့အစည်းလုံးဆိုင်ရာ အခန်းကဏ္ဍများ သတ်မှတ်ပါမည်</p>
                  <p>• အသုံးပြုသူကို အီးမေးလ်ဖြင့် အကြောင်းကြားပါမည်</p>
                </>
              ) : (
                <>
                  <p className="mb-1">• Departments will load after selecting an organization</p>
                  <p className="mb-1">• Select "* All Departments" to assign organization-wide roles</p>
                  <p>• User will be notified via email after role assignment</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}