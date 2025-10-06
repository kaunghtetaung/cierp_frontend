"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Button } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { DynamicSelectForPublicWeb } from "../DynamicSelectForPublicWeb";

interface SubjectItemProps {
  educationIndex: number;
  subjectIndex: number;
  onRemove: (index: number) => void;
}

export function SubjectItem({ educationIndex, subjectIndex, onRemove }: SubjectItemProps) {
  const { register, control, setValue, formState: { errors } } = useFormContext();

  const subjectErrors = errors.previousEducation?.[educationIndex]?.subjects?.[subjectIndex];

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

  // Consistent styling classes matching PersonalInfoStep
  const inputClass = "block w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const errorClass = "text-xs text-red-600 mt-1";

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      {/* Subject row - responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Subject Select - 6 columns */}
        <div className="md:col-span-6">
          <label htmlFor={`previousEducation.${educationIndex}.subjects.${subjectIndex}.subjectId`} className={labelClass}>
            Subject #{subjectIndex + 1}
          </label>
          <Controller
            name={`previousEducation.${educationIndex}.subjects.${subjectIndex}.subjectId`}
            control={control}
            render={({ field }) => (
              <DynamicSelectForPublicWeb
                value={field.value}
                onChange={field.onChange}
                placeholder="Select subject"
                serviceName="cpms"
                endpoint="/subjects/ref"
                labelField="name"
                valueField="_id"
              />
            )}
          />
          {subjectErrors?.subjectId && (
            <p className={errorClass}>
              {subjectErrors.subjectId.message as string}
            </p>
          )}
        </div>

        {/* Mark, Distinction, Delete - 6 columns */}
        <div className="md:col-span-6 grid grid-cols-12 gap-2 items-end">
          {/* Mark - 5 columns */}
          <div className="col-span-5">
            <label htmlFor={`previousEducation.${educationIndex}.subjects.${subjectIndex}.mark`} className={labelClass}>
              Mark
            </label>
            <input
              id={`previousEducation.${educationIndex}.subjects.${subjectIndex}.mark`}
              type="number"
              placeholder="0-100"
              {...register(`previousEducation.${educationIndex}.subjects.${subjectIndex}.mark`, {
                valueAsNumber: true
              })}
              className={inputClass}
              onKeyDown={handleInputEscKey(`previousEducation.${educationIndex}.subjects.${subjectIndex}.mark`)}
            />
            {subjectErrors?.mark && (
              <p className={errorClass}>
                {subjectErrors.mark.message as string}
              </p>
            )}
          </div>

          {/* Distinction Toggle - 4 columns */}
          <div className="col-span-4 flex items-center justify-center pb-2">
            <Controller
              name={`previousEducation.${educationIndex}.subjects.${subjectIndex}.isDistinction`}
              control={control}
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!!field.value}
                    onClick={() => field.onChange(!field.value)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      field.value ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                        field.value ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <label
                    className="text-xs font-normal cursor-pointer whitespace-nowrap text-gray-700"
                    onClick={() => field.onChange(!field.value)}
                  >
                    Distinction
                  </label>
                </div>
              )}
            />
          </div>

          {/* Delete Button - 3 columns */}
          <div className="col-span-3 flex justify-end pb-2">
            <Button
              type="button"
              onClick={() => onRemove(subjectIndex)}
              variant="destructive"
              size="sm"
              className="flex items-center gap-1"
            >
              <IconComponent name="Trash2" className="w-4 h-4" />
              <span className="hidden lg:inline">Delete</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
