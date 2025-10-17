"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "@repo/ui";
import { cn } from "@repo/utils";

export function AdditionalInfoStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const inputClass = "border-gray-300 focus:border-blue-500 focus:ring-blue-500";
  const labelClass = "text-sm font-medium text-gray-700";
  const errorClass = "text-xs text-red-600 mt-1";

  return (
    <div className="space-y-6">
      {/* Hobbies */}
      <div className="space-y-2">
        <Label className={labelClass}>Hobbies/Interests</Label>
        <textarea
          {...register("hobbies")}
          rows={3}
          placeholder="Enter your hobbies and interests"
          className={cn(
            "w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 transition-all",
            inputClass
          )}
        />
      </div>

      {/* Skills */}
      <div className="space-y-2">
        <Label className={labelClass}>Skills</Label>
        <textarea
          {...register("skills")}
          rows={3}
          placeholder="Enter your professional skills"
          className={cn(
            "w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 transition-all",
            inputClass
          )}
        />
      </div>

      {/* Disabilities */}
      <div className="space-y-2">
        <Label className={labelClass}>Disabilities</Label>
        <textarea
          {...register("disabilities")}
          rows={2}
          placeholder="If any, please specify"
          className={cn(
            "w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 transition-all",
            inputClass
          )}
        />
      </div>

      {/* Medical Conditions */}
      <div className="space-y-2">
        <Label className={labelClass}>Medical Conditions</Label>
        <textarea
          {...register("medicalConditions")}
          rows={2}
          placeholder="If any, please specify"
          className={cn(
            "w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 transition-all",
            inputClass
          )}
        />
      </div>

      {/* Special Requirements */}
      <div className="space-y-2">
        <Label className={labelClass}>Special Requirements</Label>
        <textarea
          {...register("specialRequirements")}
          rows={2}
          placeholder="Any special requirements or accommodations needed"
          className={cn(
            "w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 transition-all",
            inputClass
          )}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> All fields in this section are optional. This information helps us better support and accommodate your needs.
        </p>
      </div>
    </div>
  );
}
