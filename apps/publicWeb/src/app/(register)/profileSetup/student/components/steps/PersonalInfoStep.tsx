"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { CompactNrcField } from "../CompactNrcField";

export function PersonalInfoStep() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  const inputClass =
    "block w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all";
  const labelClass =
    "block text-sm font-medium text-gray-700 mb-1.5";
  const errorClass = "text-xs text-red-600 mt-1";

  return (
    <div className="space-y-6">
      {/* Row 1: Name Myanmar, Name English, Date of Birth - Desktop: 3 cols, Mobile: stacked */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Name Myanmar */}
        <div className="md:col-span-1">
          <label htmlFor="nameMyanmar" className={labelClass}>
            Name (Myanmar) <span className="text-red-500">*</span>
          </label>
          <input
            {...register("nameMyanmar", { required: "Name in Myanmar is required" })}
            id="nameMyanmar"
            type="text"
            className={inputClass}
            placeholder="နာမည် (မြန်မာ)"
          />
          {errors.nameMyanmar && (
            <p className={errorClass}>{String(errors.nameMyanmar.message)}</p>
          )}
        </div>

        {/* Name English */}
        <div className="md:col-span-1">
          <label htmlFor="nameEnglish" className={labelClass}>
            Name (English) <span className="text-red-500">*</span>
          </label>
          <input
            {...register("nameEnglish", { required: "Name in English is required" })}
            id="nameEnglish"
            type="text"
            className={inputClass}
            placeholder="Name (English)"
          />
          {errors.nameEnglish && (
            <p className={errorClass}>{String(errors.nameEnglish.message)}</p>
          )}
        </div>

        {/* Date of Birth - Desktop: col 3, Mobile: full width */}
        <div className="md:col-span-1">
          <label htmlFor="dateOfBirth" className={labelClass}>
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            {...register("dateOfBirth", { required: "Date of birth is required" })}
            id="dateOfBirth"
            type="date"
            className={inputClass}
          />
          {errors.dateOfBirth && (
            <p className={errorClass}>{String(errors.dateOfBirth.message)}</p>
          )}
        </div>
      </div>

      {/* Row 2: Place of Birth, Gender, Blood Group - Desktop: 3 cols, Mobile: Place of Birth full width, Gender/Blood 2 cols */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {/* Place of Birth - Mobile: full width, Desktop: 1/3 */}
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="placeOfBirth" className={labelClass}>
            Place of Birth
          </label>
          <input
            {...register("placeOfBirth")}
            id="placeOfBirth"
            type="text"
            className={inputClass}
            placeholder="City, Country"
          />
        </div>

        {/* Gender - Mobile: 1/2 width, Desktop: 1/3 */}
        <div className="col-span-1 md:col-span-1">
          <label htmlFor="gender" className={labelClass}>
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            {...register("gender", { required: "Gender is required" })}
            id="gender"
            className={inputClass}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {errors.gender && (
            <p className={errorClass}>{String(errors.gender.message)}</p>
          )}
        </div>

        {/* Blood Group - Mobile: 1/2 width, Desktop: 1/3 */}
        <div className="col-span-1 md:col-span-1">
          <label htmlFor="bloodGroup" className={labelClass}>
            Blood Group
          </label>
          <select {...register("bloodGroup")} id="bloodGroup" className={inputClass}>
            <option value="">Select</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
          </select>
        </div>
      </div>

      {/* Mobile Row 4: Ethnicity/Race, Religion | Desktop Row 3: Ethnicity/Race, Religion, NRC Number */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {/* Ethnicity */}
        <div className="col-span-1 md:col-span-1">
          <label htmlFor="ethnicity" className={labelClass}>
            Ethnicity/Race
          </label>
          <input
            {...register("ethnicity")}
            id="ethnicity"
            type="text"
            className={inputClass}
            placeholder="e.g., Bamar, Shan"
          />
        </div>

        {/* Religion */}
        <div className="col-span-1 md:col-span-1">
          <label htmlFor="religion" className={labelClass}>
            Religion
          </label>
          <input
            {...register("religion")}
            id="religion"
            type="text"
            className={inputClass}
            placeholder="e.g., Buddhism"
          />
        </div>

        {/* NRC Number - Mobile: Full width Row 5, Desktop: Row 3 */}
        <div className="col-span-2 md:col-span-1">
          <Controller
            name="nrcNumber"
            control={control}
            render={({ field }) => (
              <CompactNrcField
                value={field.value}
                onChange={field.onChange}
                placeholder="12/AbCdEf(N)123456"
                error={!!errors.nrcNumber}
                fieldName="nrcNumber"
                label="NRC Number"
                showLabel={true}
              />
            )}
          />
          {errors.nrcNumber && (
            <p className={errorClass}>{String(errors.nrcNumber.message)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
