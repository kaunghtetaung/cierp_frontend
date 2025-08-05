"use client";

import React, { useState, Suspense } from "react";
import { useForm, Controller } from "react-hook-form";
import dynamic from "next/dynamic";
import type { FormField } from "@repo/types";

// Dynamic import to avoid initialization issues
const DynamicSelect = dynamic(() => import("@/components/forms/DynamicSelect").then(mod => ({ default: mod.DynamicSelect })), {
  loading: () => <div className="h-10 bg-muted animate-pulse rounded" />,
  ssr: false
});

// Test organization dropdown config
const organizationField: FormField = {
  fieldName: "organizationId",
  fieldType: "select",
  label: {
    en: "Organization",
    mm: "အဖွဲ့အစည်း"
  },
  placeHolder: "Select organization",
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

// Test department dropdown config (exactly matching user schema)
const departmentField: FormField = {
  fieldName: "departmentId",
  fieldType: "select",
  label: {
    en: "Department",
    mm: "ဌာန"
  },
  placeHolder: "Select department",
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
    dependsOn: ["organizationId"],
    queryParams: ["organizationId"],
    searchable: true,
    clearable: true,
    preloadData: false
  }
};

export default function DebugDropdownPage() {
  const [currentLanguage] = useState("en");
  
  const { control, watch, formState: { errors } } = useForm({
    defaultValues: {
      organizationId: "",
      departmentId: ""
    }
  });

  const organizationId = watch("organizationId");

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Dropdown Dependency Debug</h1>
      
      <div className="space-y-6 bg-card p-6 rounded-lg border">
        {/* Debug Info */}
        <div className="bg-muted p-4 rounded">
          <h3 className="font-medium mb-2">Current Values:</h3>
          <pre className="text-sm">
            organizationId: {JSON.stringify(organizationId, null, 2)}
          </pre>
          <pre className="text-sm">
            departmentId: {JSON.stringify(watch("departmentId"), null, 2)}
          </pre>
        </div>

        {/* Organization Dropdown */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Organization</label>
          <Suspense fallback={<div className="h-10 bg-muted animate-pulse rounded" />}>
            <Controller
              name="organizationId"
              control={control}
              render={({ field: { onChange, value } }) => (
                <DynamicSelect
                  field={organizationField}
                  value={value}
                  onChange={onChange}
                  currentLanguage={currentLanguage}
                  watch={watch}
                  errors={errors}
                />
              )}
            />
          </Suspense>
        </div>

        {/* Department Dropdown */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Department</label>
          <Suspense fallback={<div className="h-10 bg-muted animate-pulse rounded" />}>
            <Controller
              name="departmentId"
              control={control}
              render={({ field: { onChange, value } }) => (
                <DynamicSelect
                  field={departmentField}
                  value={value}
                  onChange={onChange}
                  currentLanguage={currentLanguage}
                  watch={watch}
                  errors={errors}
                />
              )}
            />
          </Suspense>
        </div>

        {/* Test Instructions */}
        <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
          <h4 className="font-medium text-blue-900 mb-2">Test Instructions:</h4>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Select an organization from the first dropdown</li>
            <li>2. Watch the console for API calls and dependency updates</li>
            <li>3. Check if the department dropdown loads correctly</li>
            <li>4. Expected endpoint: <code>/core/departments/ref?organizationId=YOUR_ORG_ID</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
}