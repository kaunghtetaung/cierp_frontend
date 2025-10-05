"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { User, ModuleSchema } from "@repo/types";
import { Button } from "@repo/ui";
import { getLocalizedText } from "@repo/utils";
import { getStudentsModuleSchema } from "@/actions/student-registration";
import { StudentRegistrationWizard } from "./StudentRegistrationWizard";

interface StudentSelfRegistrationFormProps {
  user: User;
  onBack: () => void;
}

export function StudentSelfRegistrationForm({
  user,
  onBack,
}: StudentSelfRegistrationFormProps) {
  const [moduleSchema, setModuleSchema] = useState<ModuleSchema | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch module schema on mount
  useEffect(() => {
    async function fetchSchema() {
      try {
        setIsLoading(true);
        const result = await getStudentsModuleSchema();

        if (result.success && result.module) {
          setModuleSchema(result.module);
        } else {
          setError(result.error || "Failed to load form schema");
        }
      } catch (err) {
        console.error("Error fetching schema:", err);
        setError("Failed to load form schema");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSchema();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#4C67E1] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#19184A] mb-2">
            Loading Form
          </h2>
          <p className="text-gray-600">
            Please wait while we prepare the registration form...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !moduleSchema) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-[#FF6954] mb-4">
            Error
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "Unable to load registration form"}
          </p>
          <Button
            onClick={onBack}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-6">
          <Button
            onClick={onBack}
            variant="ghost"
            className="flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Change Role Selection
          </Button>
        </div>

        {/* Student Registration Wizard */}
        <StudentRegistrationWizard moduleSchema={moduleSchema} user={user} />
      </div>
    </div>
  );
}
