"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useForm,
  FieldValues,
  FormProvider,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toastSuccess, toastError } from "@repo/utils";
import { getLocalizedText } from "@repo/utils";
import { Button } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { FormFieldRenderer } from "./FormFieldRenderer";
import { generateZodSchema } from "@repo/schema-utils";
import { submitModuleForm } from "@repo/app-modules/server-actions";
import { getLocalizedErrorMessage } from "@repo/api/messages";
import { moduleKeys } from "@repo/schema-hooks";
import type { ModuleSchema } from "@repo/types";

interface ReactHookFormEnhancedProps {
  module: ModuleSchema;
  action: "create" | "update";
  initialData?: Record<string, any>;
  moduleSlug: string;
  itemId?: string;
  currentLanguage: string;
  navigation?: {
    hasNext: boolean;
    hasPrevious: boolean;
    nextId?: string;
    previousId?: string;
    currentIndex?: number;
    totalRecords?: number;
  };
  appId?: string;
}

export function ReactHookFormEnhanced({
  module,
  action,
  initialData,
  moduleSlug,
  itemId,
  currentLanguage,
  navigation,
  appId = "core",
}: ReactHookFormEnhancedProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Debug navigation data
  console.log("🔍 ReactHookFormEnhanced navigation debug:", {
    action,
    hasNavigation: !!navigation,
    navigation,
    moduleSlug,
    itemId,
    appId
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Generate Zod schema for validation (exclude password fields in edit mode)
  const filteredFormFields = module.formFields.filter((field) => {
    if (field.hidden) return false;
    if (action === "update" && field.fieldType === "password") {
      return false;
    }
    return true;
  });
  
  const validationSchema = generateZodSchema(filteredFormFields);

  // Initialize React Hook Form
  const form = useForm<FieldValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: initialData || {},
  });

  const {
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = form;


  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  // Add keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement) {
        return;
      }

      // Alt + Left arrow - Previous record
      if (e.altKey && e.key === "ArrowLeft" && navigation?.hasPrevious && navigation?.previousId) {
        e.preventDefault();
        router.push(`/${appId}/${moduleSlug}/${navigation.previousId}`);
      }
      
      // Alt + Right arrow - Next record  
      if (e.altKey && e.key === "ArrowRight" && navigation?.hasNext && navigation?.nextId) {
        e.preventDefault();
        router.push(`/${appId}/${moduleSlug}/${navigation.nextId}`);
      }
    };

    if (action === "update" && navigation) {
      window.addEventListener("keydown", handleKeyDown);
      
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [navigation, appId, moduleSlug, router, action]);

  const isVerticalLayout = module.formLayout === "vertical";

  // Group fields for better organization
  const fieldGroups = React.useMemo(() => {
    const groups: { [key: string]: typeof filteredFormFields } = {
      main: [],
      metadata: [],
    };

    filteredFormFields.forEach((field) => {
      if (
        field.fieldName.includes("created") ||
        field.fieldName.includes("updated") ||
        field.fieldName.includes("deleted")
      ) {
        groups.metadata.push(field);
      } else {
        groups.main.push(field);
      }
    });

    return groups;
  }, [filteredFormFields]);

  const onSubmit = async (data: FieldValues) => {
    setSubmitError(null);
    setIsSubmittingForm(true);

    try {
      // Convert form data to FormData for server action
      const formData = new FormData();

      // For update operations, include version and other metadata fields
      if (action === "update" && initialData) {
        if (initialData.version !== undefined) {
          formData.append("version", String(initialData.version));
        }
      }

      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (typeof value === "object" && value.en !== undefined) {
            formData.append(key, JSON.stringify(value));
          } else if (typeof value === "string" && value.startsWith('{"en":')) {
            formData.append(key, value);
          } else if (Array.isArray(value)) {
            value.forEach((item) => formData.append(key, String(item)));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const result = await submitModuleForm(
        moduleSlug,
        formData,
        action,
        itemId,
        true // skipRedirect
      );

      if (!result.success) {
        if (result.fieldErrors && result.fieldErrors.length > 0) {
          const fieldErrorsText = result.fieldErrors.join("\n");
          const mainError =
            result.error ||
            getLocalizedErrorMessage(
              "FORM_SUBMISSION_FAILED",
              currentLanguage as "en" | "mm"
            );
          const traceInfo = result.traceId
            ? `\n\nTrace ID: ${result.traceId}`
            : "";
          const errorMessage = `${mainError}\n\nField errors:\n${fieldErrorsText}${traceInfo}`;
          toastError(mainError);
          throw new Error(errorMessage);
        } else if (result.errors) {
          const errorMessages = Object.entries(result.errors)
            .map(
              ([field, messages]) =>
                `${field}: ${
                  Array.isArray(messages) ? messages.join(", ") : messages
                }`
            )
            .join("\n");
          const toastErrorMessage =
            result.error ||
            getLocalizedErrorMessage(
              "FORM_SUBMISSION_FAILED",
              currentLanguage as "en" | "mm"
            );
          toastError(toastErrorMessage);
          throw new Error(errorMessages);
        } else {
          const errorMessage =
            result.error ||
            getLocalizedErrorMessage(
              "FORM_SUBMISSION_FAILED",
              currentLanguage as "en" | "mm"
            );
          toastError(errorMessage);
          throw new Error(errorMessage);
        }
      }

      // Success - show toast and handle client-side navigation
      console.log("Form submitted successfully");

      // Invalidate React Query cache to force data refetch
      console.log(`🔄 Invalidating React Query cache for module: ${moduleSlug}`);
      
      // Remove all cached queries for this module to force complete refresh
      await queryClient.removeQueries({
        queryKey: [...moduleKeys.lists(), moduleSlug],
        exact: false
      });
      
      // Invalidate all list queries for this module
      await queryClient.invalidateQueries({
        queryKey: [...moduleKeys.lists(), moduleSlug],
        exact: false,
        refetchType: 'all'
      });

      // If updating, also invalidate the specific item detail
      if (action === "update" && itemId) {
        await queryClient.removeQueries({
          queryKey: moduleKeys.detail(moduleSlug, itemId)
        });
        await queryClient.invalidateQueries({
          queryKey: moduleKeys.detail(moduleSlug, itemId),
          refetchType: 'all'
        });
      }
      
      // Clear all module-related caches to ensure fresh data
      await queryClient.invalidateQueries({
        queryKey: ['modules'],
        exact: false,
        refetchType: 'all'
      });

      // Show success toast with multilingual support
      const successMessage =
        action === "create"
          ? currentLanguage === "mm"
            ? `${getLocalizedText(
                module.name,
                currentLanguage
              )} အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ!`
            : `${getLocalizedText(
                module.name,
                currentLanguage
              )} created successfully!`
          : currentLanguage === "mm"
          ? `${getLocalizedText(
              module.name,
              currentLanguage
            )} အောင်မြင်စွာ အပ်ဒိတ်လုပ်ပြီးပါပြီ!`
          : `${getLocalizedText(
              module.name,
              currentLanguage
            )} updated successfully!`;

      toastSuccess(successMessage);

      // Redirect to module datatable page with user-friendly delay
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: [...moduleKeys.lists(), moduleSlug],
          exact: false
        });

        // Navigate to the list page with proper appId and force refresh via URL parameter
        const redirectPath = appId ? `/${appId}/${moduleSlug}` : `/${moduleSlug}`;
        const timestamp = Date.now();
        router.push(`${redirectPath}?_refresh=${timestamp}`);
      }, 1500);
    } catch (error) {
      console.error("Form submission error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : getLocalizedErrorMessage(
              "FORM_SUBMISSION_FAILED",
              currentLanguage as "en" | "mm"
            );
      setSubmitError(errorMessage);
      toastError(errorMessage);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Enhanced Header with Glass Effect */}
        <Card className="mb-6 border-0 shadow-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-2xl shadow-lg animate-in fade-in-50 zoom-in-95">
                  <IconComponent
                    name={module.iconName || "FileText"}
                    className="w-8 h-8 text-primary"
                  />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {action === "create" ? (
                      <>
                        {currentLanguage === "mm" ? "အသစ်ထည့်သွင်းရန် - " : "Create New "}
                        {getLocalizedText(module.name, currentLanguage)}
                      </>
                    ) : (
                      <>
                        {currentLanguage === "mm" ? "ပြင်ဆင်ရန် - " : "Update "}
                        {getLocalizedText(module.name, currentLanguage)}
                      </>
                    )}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    {getLocalizedText(module.description, currentLanguage)}
                  </p>
                </div>
              </div>

              {/* Help Toggle */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(!showHelp)}
                className="rounded-full"
              >
                <IconComponent name={showHelp ? "X" : "HelpCircle"} className="w-5 h-5" />
              </Button>
            </div>

            {/* Status Pills and Navigation */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
              {isSubmittingForm ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full animate-pulse">
                  <IconComponent name="Loader2" className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">
                    {currentLanguage === "mm" ? "သိမ်းဆည်းနေသည်..." : "Saving..."}
                  </span>
                </div>
              ) : hasErrors ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 rounded-full">
                  <IconComponent name="AlertCircle" className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-destructive font-medium">
                    {Object.keys(errors).length} {currentLanguage === "mm" ? "အမှားများ" : "errors"}
                  </span>
                </div>
              ) : isDirty ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 rounded-full">
                  <IconComponent name="Edit3" className="w-4 h-4 text-warning" />
                  <span className="text-sm text-warning font-medium">
                    {currentLanguage === "mm" ? "ပြောင်းလဲမှုများရှိသည်" : "Has changes"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 rounded-full">
                  <IconComponent name="CheckCircle" className="w-4 h-4 text-success" />
                  <span className="text-sm text-success font-medium">
                    {currentLanguage === "mm" ? "အဆင်သင့်" : "Ready"}
                  </span>
                </div>
              )}
              </div>

              {/* Navigation Controls */}
              {action === "update" && navigation && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (navigation.previousId) {
                        router.push(`/${appId}/${moduleSlug}/${navigation.previousId}`)
                      }
                    }}
                    disabled={!navigation.hasPrevious}
                    title={currentLanguage === "mm" ? "ယခင်မှတ်တမ်း (Alt+←)" : "Previous Record (Alt+←)"}
                  >
                    <IconComponent name="ChevronLeft" className="w-4 h-4" />
                  </Button>
                  
                  {navigation.currentIndex && navigation.totalRecords && (
                    <div className="px-3 py-1 bg-background border border-border/30 rounded-md">
                      <span className="text-sm font-medium">
                        {navigation.currentIndex} / {navigation.totalRecords}
                      </span>
                    </div>
                  )}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (navigation.nextId) {
                        router.push(`/${appId}/${moduleSlug}/${navigation.nextId}`)
                      }
                    }}
                    disabled={!navigation.hasNext}
                    title={currentLanguage === "mm" ? "နောက်မှတ်တမ်း (Alt+→)" : "Next Record (Alt+→)"}
                  >
                    <IconComponent name="ChevronRight" className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Help Panel */}
        {showHelp && (
          <Card className="mb-6 border-warning/50 bg-warning/5 animate-in slide-in-from-top-2">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <IconComponent name="Info" className="w-5 h-5 text-warning mt-1" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium">
                    {currentLanguage === "mm" ? "အကူအညီ:" : "Help Tips:"}
                  </p>
                  <ul className="space-y-1 ml-4">
                    <li>• {currentLanguage === "mm" 
                      ? "အနီရောင် * သင်္ကေတရှိသော အကွက်များမှာ မဖြစ်မနေဖြည့်ရမည်"
                      : "Fields marked with red * are required"}</li>
                    <li>• {currentLanguage === "mm"
                      ? "Tab ကို နှိပ်၍ နောက်အကွက်သို့ သွားနိုင်ပါသည်"
                      : "Press Tab to move to the next field"}</li>
                    <li>• {currentLanguage === "mm"
                      ? "မှားယွင်းနေသော အကွက်များကို အနီရောင်ဖြင့် ပြသပေးမည်"
                      : "Invalid fields will be highlighted in red"}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Form Content */}
        <Card className="relative z-0 shadow-xl border-0">
          <CardContent className="p-0">
            <FormProvider {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="relative">
                {/* Form Fields */}
                <div className="relative z-0 p-6 space-y-6">
                      <div className={`${
                        isVerticalLayout
                          ? "space-y-6"
                          : "grid grid-cols-1 md:grid-cols-2 gap-6"
                      }`}>
                        {fieldGroups.main.map((field) => (
                          <div
                            key={field.fieldName}
                            className={`${
                              field.fieldType === "textArea" || field.fieldType === "htmlContent"
                                ? "md:col-span-2"
                                : ""
                            } animate-in slide-in-from-bottom-2`}
                          >
                            <FormFieldRenderer
                              field={field}
                              currentLanguage={currentLanguage}
                              isVerticalLayout={isVerticalLayout}
                              errors={errors}
                              watch={watch}
                            />
                          </div>
                        ))}
                      </div>
                </div>

                {/* Metadata Section */}
                {fieldGroups.metadata.length > 0 && action === "update" && (
                  <div className="relative z-0 p-6 space-y-6 border-t border-border/50">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">
                      {currentLanguage === "mm" ? "စနစ် အချက်အလက်များ" : "System Information"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {fieldGroups.metadata.map((field) => (
                          <div key={field.fieldName} className="animate-in slide-in-from-bottom-2">
                            <FormFieldRenderer
                              field={field}
                              currentLanguage={currentLanguage}
                              isVerticalLayout={isVerticalLayout}
                              errors={errors}
                              watch={watch}
                            />
                          </div>
                        ))}
                      </div>
                  </div>
                )}

                {/* Error Display */}
                {submitError && (
                  <div className="mx-6 mb-6">
                    <div className="p-4 border-l-4 border-destructive bg-destructive/5 rounded-lg animate-in slide-in-from-top-2">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-destructive/10 rounded-lg">
                          <IconComponent name="AlertTriangle" className="w-5 h-5 text-destructive" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-destructive mb-2">
                            {currentLanguage === "mm"
                              ? "ဖောင်း အမှားများ တွေ့ရှိပါသည်"
                              : "Form Submission Error"}
                          </h4>
                          <div className="text-sm text-destructive/90 space-y-1">
                            {submitError.split("\n").map((line, index) => (
                              <div key={index}>
                                {line.trim() && (
                                  <div className="flex items-start gap-2">
                                    <IconComponent name="ChevronRight" className="w-3 h-3 mt-1" />
                                    <span>{line}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSubmitError(null)}
                          className="p-1 hover:bg-destructive/10 rounded transition-colors"
                          title="Close error message"
                          aria-label="Close error message"
                        >
                          <IconComponent name="X" className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Form Actions */}
                <div className="sticky bottom-0 z-10 bg-background border-t border-border/30 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {hasErrors ? (
                        <div className="flex items-center gap-2 text-destructive">
                          <IconComponent name="AlertCircle" className="w-4 h-4" />
                          <span>
                            {currentLanguage === "mm"
                              ? "ပြင်ဆင်ရန် လိုအပ်ပါသည်"
                              : "Please fix the errors above"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <IconComponent name="Info" className="w-4 h-4" />
                          <span>
                            {isDirty
                              ? currentLanguage === "mm"
                                ? "ပြောင်းလဲမှုများကို သိမ်းဆည်းရန် အဆင်သင့်"
                                : "Ready to save changes"
                              : currentLanguage === "mm"
                              ? "အချက်အလက်များ ဖြည့်စွက်ပါ"
                              : "Fill in the required fields"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="lg"
                        onClick={() => {
                          reset();
                          setSubmitError(null);
                        }}
                        disabled={isSubmittingForm || isSubmitting || !isDirty}
                      >
                        <IconComponent name="RotateCcw" className="w-4 h-4 mr-2" />
                        {currentLanguage === "mm" ? "ပြန်လည်သတ်မှတ်" : "Reset"}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => router.back()}
                        disabled={isSubmittingForm || isSubmitting}
                      >
                        <IconComponent name="X" className="w-4 h-4 mr-2" />
                        {currentLanguage === "mm" ? "မလုပ်တော့ပါ" : "Cancel"}
                      </Button>

                      <Button
                        type="submit"
                        size="lg"
                        disabled={isSubmittingForm || isSubmitting}
                        className="min-w-[150px]"
                      >
                        {isSubmittingForm || isSubmitting ? (
                          <>
                            <IconComponent name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                            {currentLanguage === "mm" ? "သိမ်းဆည်းနေသည်..." : "Saving..."}
                          </>
                        ) : (
                          <>
                            <IconComponent name={action === "create" ? "Plus" : "Save"} className="w-4 h-4 mr-2" />
                            {action === "create"
                              ? currentLanguage === "mm"
                                ? "ဖန်တီးမည်"
                                : "Create"
                              : currentLanguage === "mm"
                              ? "မှတ်တမ်းတင်မည်"
                              : "Save Changes"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </FormProvider>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}