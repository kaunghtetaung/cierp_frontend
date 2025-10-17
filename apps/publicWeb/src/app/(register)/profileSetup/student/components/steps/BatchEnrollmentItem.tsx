"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Button } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { DynamicSelectForPublicWeb } from "../DynamicSelectForPublicWeb";
import { DependentSelectForPublicWeb } from "../DependentSelectForPublicWeb";

interface BatchEnrollmentItemProps {
  index: number;
  onRemove: (index: number) => void;
}

export function BatchEnrollmentItem({ index, onRemove }: BatchEnrollmentItemProps) {
  const { register, control, setValue, formState: { errors } } = useFormContext();

  const inputClass = "block w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const errorClass = "text-xs text-red-600 mt-1";

  const batchErrors = (errors?.batches as any)?.[index];

  // Reusable key handler for input fields (ESC to reset, Enter prevention)
  const handleInputEscKey = (fieldName: string) => (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLInputElement | HTMLTextAreaElement).value = "";
      setValue(fieldName, "");
      const event = new Event('input', { bubbles: true });
      e.target.dispatchEvent(event);
    } else if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      // Prevent Enter key from submitting the form on input fields
      e.preventDefault();
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
        {/* Academic Year - 4 columns */}
        <div className="lg:col-span-4">
          {index === 0 && (
            <label htmlFor={`batches.${index}.academicYearId`} className={labelClass}>
              Academic Year <span className="text-red-500">*</span>
            </label>
          )}
          <Controller
            name={`batches.${index}.academicYearId`}
            control={control}
            rules={{ required: "Academic year is required" }}
            render={({ field }) => (
              <DynamicSelectForPublicWeb
                value={field.value || ""}
                onChange={field.onChange}
                placeholder="Select academic year"
                serviceName="cpms"
                endpoint="/academic-years/ref"
                labelField="name"
                valueField="id"
              />
            )}
          />
          {batchErrors?.academicYearId && (
            <p className={errorClass}>{batchErrors.academicYearId.message}</p>
          )}
        </div>

        {/* Batch - 4 columns (depends on Academic Year) */}
        <div className="lg:col-span-4">
          {index === 0 && (
            <label htmlFor={`batches.${index}.batchId`} className={labelClass}>
              Batch <span className="text-red-500">*</span>
            </label>
          )}
          <Controller
            name={`batches.${index}.batchId`}
            control={control}
            rules={{ required: "Batch is required" }}
            render={({ field }) => (
              <DependentSelectForPublicWeb
                value={field.value || ""}
                onChange={field.onChange}
                placeholder="Select batch"
                serviceName="cpms"
                endpoint="/batches/ref"
                labelField="name"
                valueField="id"
                dependsOn={[`batches.${index}.academicYearId`]}
              />
            )}
          />
          {batchErrors?.batchId && (
            <p className={errorClass}>{batchErrors.batchId.message}</p>
          )}
        </div>

        {/* Roll Number + Delete - 4 columns */}
        <div className="lg:col-span-4">
          <div className="flex items-end gap-2">
            {/* Roll Number */}
            <div className="flex-1">
              {index === 0 && (
                <label htmlFor={`batches.${index}.rollNo`} className={labelClass}>
                  Roll Number
                </label>
              )}
              <input
                {...register(`batches.${index}.rollNo`)}
                type="text"
                placeholder="Enter roll number"
                className={inputClass}
                onKeyDown={handleInputEscKey(`batches.${index}.rollNo`)}
              />
              {batchErrors?.rollNo && (
                <p className={errorClass}>{batchErrors.rollNo.message}</p>
              )}
            </div>

            {/* Delete Button */}
            <div className="flex-shrink-0">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onRemove(index)}
                className="h-10 px-3"
              >
                <IconComponent name="Trash2" className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
