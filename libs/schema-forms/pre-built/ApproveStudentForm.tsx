"use client";

import React, { useState } from "react";
import { Button } from "@repo/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui";
import { Alert, AlertDescription } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { getLocalizedText } from "@repo/utils";
import type { PreBuiltFormProps } from "../ExtraActionFormRouter";

/**
 * Approve Student Form
 *
 * Simple confirmation form for approving a single student registration.
 * Changes the student's registration status from 'pending' to 'approved'.
 */
export function ApproveStudentForm({
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

    setIsSubmitting(true);

    try {
      // Create FormData for server action
      const formData = new FormData();

      // Add metadata
      formData.append("actionKey", action.actionKey);

      // Note: The student ID will be added by the parent component from the URL params
      // This is for single-item actions (/:id/approve endpoint)

      // Call parent onSubmit
      await onSubmit(formData);

      // Parent component will handle success/close modal
    } catch (error) {
      console.error("Approve student form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = getLocalizedText(action.title, currentLanguage);
  const description = getLocalizedText(action.description, currentLanguage);

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
        <Alert>
          <IconComponent name="Info" className="h-4 w-4" />
          <AlertDescription>
            {currentLanguage === "mm"
              ? "ဤကျောင်းသား၏ မှတ်ပုံတင်ခြင်းကို အတည်ပြုလိုပါသလား? အတည်ပြုပြီးသွားပါက အခြေအနေသည် 'အတည်ပြုပြီး' ဖြစ်သွားမည်။"
              : "Are you sure you want to approve this student's registration? Once approved, the status will be changed to 'approved'."}
          </AlertDescription>
        </Alert>

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
            disabled={isSubmitting}
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
                {currentLanguage === "mm" ? "အတည်ပြုမည်" : "Approve"}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </form>
  );
}
