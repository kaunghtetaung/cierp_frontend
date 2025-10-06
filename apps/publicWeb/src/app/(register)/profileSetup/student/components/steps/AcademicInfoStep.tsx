"use client";

import React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Button } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { EducationRecordItem } from "./EducationRecordItem";

interface AcademicInfoStepProps {
  moduleSchema?: {
    formFields?: any[];
  };
}

export function AcademicInfoStep({ moduleSchema }: AcademicInfoStepProps) {
  const { control } = useFormContext();

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({
    control,
    name: "previousEducation",
  });

  const handleAddEducation = () => {
    appendEducation({
      className: "",
      rollNumber: "",
      examBoard: "",
      totalMarks: "",
      year: "",
      subjects: [],
    });
  };

  const handleRemoveEducation = (index: number) => {
    removeEducation(index);
  };

  return (
    <div className="space-y-6">
      {/* Previous Education Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Previous Education
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Add your previous educational qualifications
            </p>
          </div>
          <Button
            type="button"
            onClick={handleAddEducation}
            size="sm"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white"
          >
            <IconComponent name="Plus" className="w-4 h-4" />
            <span className="hidden sm:inline">Add Education Record</span>
            <span className="sm:inline md:hidden">Add</span>
          </Button>
        </div>

        <div className="space-y-6">
          {educationFields.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <IconComponent name="GraduationCap" className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 font-medium mb-1">No education records added yet</p>
              <p className="text-sm text-gray-500 mb-4">
                Click "Add Education Record" to get started
              </p>
            </div>
          ) : (
            educationFields.map((field: any, index: number) => (
              <EducationRecordItem
                key={field.id}
                index={index}
                onRemove={handleRemoveEducation}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
