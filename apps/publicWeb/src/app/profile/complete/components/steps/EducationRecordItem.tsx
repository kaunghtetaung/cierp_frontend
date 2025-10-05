"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { SubjectsList } from "./SubjectsList";

interface EducationRecordItemProps {
  index: number;
  onRemove: (index: number) => void;
}

export function EducationRecordItem({ index, onRemove }: EducationRecordItemProps) {
  const { register, formState: { errors } } = useFormContext();

  const educationErrors = errors.previousEducation?.[index];

  // Consistent styling classes matching PersonalInfoStep
  const inputClass = "block w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const errorClass = "text-xs text-red-600 mt-1";

  return (
    <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm space-y-6">
      {/* Header with title and delete button */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <h4 className="text-base font-semibold text-gray-900">
          Education Record #{index + 1}
        </h4>
        <Button
          type="button"
          onClick={() => onRemove(index)}
          variant="destructive"
          size="sm"
          className="flex items-center gap-2"
        >
          <IconComponent name="Trash2" className="w-4 h-4" />
          Delete
        </Button>
      </div>

      {/* Row 1: Class Name, Exam Board, Total Marks (3 columns on md+) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Class Name */}
        <div className="md:col-span-1">
          <label htmlFor={`previousEducation.${index}.className`} className={labelClass}>
            Class Name <span className="text-red-500">*</span>
          </label>
          <input
            id={`previousEducation.${index}.className`}
            type="text"
            placeholder="e.g., Grade 10, B.Sc"
            {...register(`previousEducation.${index}.className`)}
            className={inputClass}
          />
          {educationErrors?.className && (
            <p className={errorClass}>
              {educationErrors.className.message as string}
            </p>
          )}
        </div>

        {/* Exam Board */}
        <div className="md:col-span-1">
          <label htmlFor={`previousEducation.${index}.examBoard`} className={labelClass}>
            Exam Board
          </label>
          <input
            id={`previousEducation.${index}.examBoard`}
            type="text"
            placeholder="e.g., Myanmar Board, Cambridge"
            {...register(`previousEducation.${index}.examBoard`)}
            className={inputClass}
          />
          {educationErrors?.examBoard && (
            <p className={errorClass}>
              {educationErrors.examBoard.message as string}
            </p>
          )}
        </div>

        {/* Total Marks */}
        <div className="md:col-span-1">
          <label htmlFor={`previousEducation.${index}.totalMarks`} className={labelClass}>
            Total Marks
          </label>
          <input
            id={`previousEducation.${index}.totalMarks`}
            type="number"
            placeholder="Total marks obtained"
            {...register(`previousEducation.${index}.totalMarks`, {
              valueAsNumber: true
            })}
            className={inputClass}
          />
          {educationErrors?.totalMarks && (
            <p className={errorClass}>
              {educationErrors.totalMarks.message as string}
            </p>
          )}
        </div>
      </div>

      {/* Row 2: Year, Roll Number (2 columns on md+) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Year */}
        <div className="md:col-span-1">
          <label htmlFor={`previousEducation.${index}.year`} className={labelClass}>
            Year
          </label>
          <input
            id={`previousEducation.${index}.year`}
            type="number"
            placeholder="Academic year (e.g., 2023)"
            {...register(`previousEducation.${index}.year`, {
              valueAsNumber: true
            })}
            className={inputClass}
          />
          {educationErrors?.year && (
            <p className={errorClass}>
              {educationErrors.year.message as string}
            </p>
          )}
        </div>

        {/* Roll Number */}
        <div className="md:col-span-1">
          <label htmlFor={`previousEducation.${index}.rollNumber`} className={labelClass}>
            Roll Number
          </label>
          <input
            id={`previousEducation.${index}.rollNumber`}
            type="text"
            placeholder="Enter roll number"
            {...register(`previousEducation.${index}.rollNumber`)}
            className={inputClass}
          />
          {educationErrors?.rollNumber && (
            <p className={errorClass}>
              {educationErrors.rollNumber.message as string}
            </p>
          )}
        </div>
      </div>

      {/* Row 3: Subjects Array */}
      <div className="pt-4 border-t border-gray-200">
        <SubjectsList educationIndex={index} />
      </div>
    </div>
  );
}
