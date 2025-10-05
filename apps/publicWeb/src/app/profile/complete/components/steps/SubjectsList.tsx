"use client";

import React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Button } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { SubjectItem } from "./SubjectItem";

interface SubjectsListProps {
  educationIndex: number;
}

export function SubjectsList({ educationIndex }: SubjectsListProps) {
  const { control } = useFormContext();

  const {
    fields: subjectFields,
    append: appendSubject,
    remove: removeSubject,
  } = useFieldArray({
    control,
    name: `previousEducation.${educationIndex}.subjects`,
  });

  const handleAddSubject = () => {
    appendSubject({
      subjectId: "",
      mark: "",
      isDistinction: false,
    });
  };

  const handleRemoveSubject = (subjectIndex: number) => {
    removeSubject(subjectIndex);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h5 className="text-sm font-semibold text-gray-900">Subjects</h5>
          <p className="text-xs text-gray-600 mt-1">
            Add subjects and marks for this education record
          </p>
        </div>
        <Button
          type="button"
          onClick={handleAddSubject}
          size="sm"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white"
        >
          <IconComponent name="Plus" className="w-4 h-4" />
          <span className="hidden sm:inline">Add Subject</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Subjects list */}
      <div className="space-y-3">
        {subjectFields.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <IconComponent name="BookOpen" className="w-10 h-10 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 font-medium mb-1">
              No subjects added yet
            </p>
            <p className="text-xs text-gray-500">
              Click "Add Subject" to get started
            </p>
          </div>
        ) : (
          subjectFields.map((field: any, subjectIndex: number) => (
            <SubjectItem
              key={field.id}
              educationIndex={educationIndex}
              subjectIndex={subjectIndex}
              onRemove={handleRemoveSubject}
            />
          ))
        )}
      </div>

      {/* Subject count */}
      {subjectFields.length > 0 && (
        <div className="text-xs text-gray-500 text-right">
          {subjectFields.length} {subjectFields.length === 1 ? "subject" : "subjects"}
        </div>
      )}
    </div>
  );
}
