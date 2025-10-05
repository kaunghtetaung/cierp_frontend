"use client";

import React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Button } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { BatchEnrollmentItem } from "./BatchEnrollmentItem";

export function CurrentAcademicStep() {
  const { register, control, formState: { errors } } = useFormContext();

  const {
    fields: batchFields,
    append: appendBatch,
    remove: removeBatch,
  } = useFieldArray({
    control,
    name: "batches",
  });

  const inputClass = "block w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const errorClass = "text-xs text-red-600 mt-1";

  const handleAddBatch = () => {
    appendBatch({
      academicYearId: "",
      batchId: "",
      rollNo: "",
    });
  };

  const handleRemoveBatch = (index: number) => {
    removeBatch(index);
  };

  return (
    <div className="space-y-6">
      {/* MEDM Number */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          University Registration
        </h3>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="medm" className={labelClass}>
              University Registration Number (MEDM)
            </label>
            <input
              {...register("medm")}
              id="medm"
              type="text"
              placeholder="Enter MEDM number"
              className={inputClass}
            />
            {errors.medm && (
              <p className={errorClass}>{errors.medm.message as string}</p>
            )}
          </div>
        </div>
      </div>

      {/* Batch Enrollments */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Batch Enrollments
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Add your batch enrollment information
            </p>
          </div>
          <Button
            type="button"
            onClick={handleAddBatch}
            size="sm"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white"
          >
            <IconComponent name="Plus" className="w-4 h-4" />
            <span className="hidden sm:inline">Add Batch</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        <div className="space-y-3">
          {batchFields.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <IconComponent name="GraduationCap" className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 font-medium mb-1">No batch enrollments added yet</p>
              <p className="text-sm text-gray-500 mb-4">
                Click "Add Batch" to get started
              </p>
            </div>
          ) : (
            batchFields.map((field: any, index: number) => (
              <BatchEnrollmentItem
                key={field.id}
                index={index}
                onRemove={handleRemoveBatch}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
