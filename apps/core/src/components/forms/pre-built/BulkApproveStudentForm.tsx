"use client";

import React, { useState } from "react";
import { Button } from "@repo/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui";
import { Alert, AlertDescription } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { Badge } from "@repo/ui";
import { getLocalizedText } from "@repo/utils";
import type { PreBuiltFormProps } from "../ExtraActionFormRouter";

/**
 * Bulk Approve Student Form
 *
 * Confirmation form for approving multiple students at once.
 * Allows batch approval of selected students' registrations.
 */
export function BulkApproveStudentForm({
  action,
  selectedItems,
  currentLanguage,
  onSubmit,
  onCancel,
  hideHeader = false,
}: PreBuiltFormProps) {

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItems || selectedItems.length === 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for server action
      const formData = new FormData();

      // Add metadata
      formData.append("actionKey", action.actionKey);

      // Add selected student IDs (for bulk operations)
      // Using the same pattern as other bulk operations
      formData.append("selectedIds", JSON.stringify(selectedItems));

      // Also append individual IDs for backend compatibility
      selectedItems.forEach((id) => {
        formData.append("ids[]", id);
      });

      // Call parent onSubmit
      await onSubmit(formData);

      // Parent component will handle success/close modal
    } catch (error) {
      console.error("Bulk approve students form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = getLocalizedText(action.title, currentLanguage);
  const description = getLocalizedText(action.description, currentLanguage);
  const selectedCount = selectedItems?.length || 0;

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {!hideHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconComponent
              name={action.iconName || "CheckCircle"}
              className="w-5 h-5 text-success"
            />
            {title}
          </CardTitle>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </CardHeader>
      )}

      <CardContent className="space-y-4">
        {/* Selection summary */}
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <IconComponent name="Users" className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {currentLanguage === "mm"
              ? "ရွေးချယ်ထားသော ကျောင်းသား"
              : "Selected Students"}:
          </span>
          <Badge variant="secondary" className="ml-auto">
            {selectedCount} {currentLanguage === "mm" ? "ဦး" : ""}
          </Badge>
        </div>

        {/* Confirmation alert */}
        <Alert>
          <IconComponent name="AlertTriangle" className="h-4 w-4" />
          <AlertDescription>
            {currentLanguage === "mm"
              ? `ရွေးချယ်ထားသော ကျောင်းသား ${selectedCount} ဦး၏ မှတ်ပုံတင်ခြင်းကို အတည်ပြုလိုပါသလား? အတည်ပြုပြီးသွားပါက အခြေအနေများသည် 'အတည်ပြုပြီး' ဖြစ်သွားမည်။`
              : `Are you sure you want to approve ${selectedCount} selected student${selectedCount > 1 ? 's' : ''}? Once approved, their status will be changed to 'approved'.`}
          </AlertDescription>
        </Alert>

        {/* Info message */}
        <div className="text-sm text-muted-foreground p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
          <div className="flex items-start gap-2">
            <IconComponent name="Info" className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400" />
            <div>
              {currentLanguage === "mm"
                ? "ဤလုပ်ဆောင်ချက်သည် ရွေးချယ်ထားသော ကျောင်းသားအားလုံး၏ မှတ်ပုံတင်အခြေအနေကို တစ်ပြိုင်နက် အတည်ပြုပေးမည်ဖြစ်သည်။"
                : "This action will approve all selected students' registrations simultaneously."}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <IconComponent name="X" className="w-4 h-4 mr-2" />
            {currentLanguage === "mm" ? "ပယ်ဖျက်မည်" : "Cancel"}
          </Button>
          <Button
            type="submit"
            variant="default"
            disabled={isSubmitting || selectedCount === 0}
            className="bg-success hover:bg-success/90"
          >
            {isSubmitting ? (
              <>
                <IconComponent name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                {currentLanguage === "mm" ? "အတည်ပြုနေသည်..." : "Approving..."}
              </>
            ) : (
              <>
                <IconComponent name="CheckCircle" className="w-4 h-4 mr-2" />
                {currentLanguage === "mm"
                  ? `${selectedCount} ဦး အတည်ပြုမည်`
                  : `Approve ${selectedCount} Student${selectedCount > 1 ? 's' : ''}`}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
