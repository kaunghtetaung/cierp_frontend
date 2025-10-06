"use client";

import React from "react";
import { useFormContext } from "react-hook-form";

export function AdditionalInfoStep() {
  const { register, setValue, formState: { errors } } = useFormContext();

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

  const inputClass = "block w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all";
  const textareaClass = "block w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const errorClass = "text-xs text-red-600 mt-1";

  return (
    <div className="space-y-6">
      {/* Interests and Skills */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Interests & Skills
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hobbies */}
          <div>
            <label htmlFor="hobbies" className={labelClass}>
              Hobbies
            </label>
            <input
              {...register("hobbies")}
              id="hobbies"
              type="text"
              placeholder="Enter your hobbies"
              className={inputClass}
              onKeyDown={handleInputEscKey("hobbies")}
            />
            {errors.hobbies && (
              <p className={errorClass}>{errors.hobbies.message as string}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              E.g., Reading, Sports, Music
            </p>
          </div>

          {/* Skills */}
          <div>
            <label htmlFor="skills" className={labelClass}>
              Skills
            </label>
            <input
              {...register("skills")}
              id="skills"
              type="text"
              placeholder="Enter your skills"
              className={inputClass}
              onKeyDown={handleInputEscKey("skills")}
            />
            {errors.skills && (
              <p className={errorClass}>{errors.skills.message as string}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              E.g., Programming, Design, Public Speaking
            </p>
          </div>
        </div>
      </div>

      {/* Health & Special Needs */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Health & Special Needs
        </h3>
        <div className="grid grid-cols-1 gap-6">
          {/* Disabilities */}
          <div>
            <label htmlFor="disabilities" className={labelClass}>
              Disabilities
            </label>
            <input
              {...register("disabilities")}
              id="disabilities"
              type="text"
              placeholder="Enter any disabilities (if applicable)"
              className={inputClass}
              onKeyDown={handleInputEscKey("disabilities")}
            />
            {errors.disabilities && (
              <p className={errorClass}>{errors.disabilities.message as string}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Optional - Leave blank if not applicable
            </p>
          </div>

          {/* Medical Conditions */}
          <div>
            <label htmlFor="medicalConditions" className={labelClass}>
              Medical Conditions
            </label>
            <textarea
              {...register("medicalConditions")}
              id="medicalConditions"
              rows={2}
              placeholder="Enter any medical conditions we should be aware of"
              className={textareaClass}
              onKeyDown={handleInputEscKey("medicalConditions")}
            />
            {errors.medicalConditions && (
              <p className={errorClass}>{errors.medicalConditions.message as string}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Optional - This information helps us provide better support
            </p>
          </div>

          {/* Special Requirements */}
          <div>
            <label htmlFor="specialRequirements" className={labelClass}>
              Special Requirements
            </label>
            <textarea
              {...register("specialRequirements")}
              id="specialRequirements"
              rows={2}
              placeholder="Enter any special requirements or accommodations needed"
              className={textareaClass}
              onKeyDown={handleInputEscKey("specialRequirements")}
            />
            {errors.specialRequirements && (
              <p className={errorClass}>{errors.specialRequirements.message as string}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              E.g., Dietary restrictions, accessibility needs, learning accommodations
            </p>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              All fields in this section are optional
            </h4>
            <p className="text-sm text-blue-700">
              Providing this information helps us better understand your needs and provide appropriate support during your academic journey.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
