"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { PhoneInput } from "@repo/schema-forms/PhoneInput";

export function ContactAddressStep() {
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
      {/* Contact Information */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="phoneNumber" className={labelClass}>
            Phone Number <span className="text-red-500">*</span>
          </label>
          <Controller
            name="phoneNumber"
            control={control}
            rules={{ required: "Phone number is required" }}
            render={({ field }) => (
              <PhoneInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={!!errors.phoneNumber}
                config={{
                  defaultCountry: 'MM',
                  preferredCountries: ['MM', 'US', 'GB'],
                  showDialingCode: true,
                  showCountryFlag: true,
                  autoFormat: true,
                }}
              />
            )}
          />
          {errors.phoneNumber && (
            <p className={errorClass}>{String(errors.phoneNumber.message)}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            {...register("email")}
            id="email"
            type="email"
            className={inputClass}
            placeholder="email@example.com"
          />
        </div>
      </div>

      {/* Address - Location */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="stateRegionName" className={labelClass}>
            State/Region <span className="text-red-500">*</span>
          </label>
          <input
            {...register("stateRegionName", { required: "State/Region is required" })}
            id="stateRegionName"
            type="text"
            className={inputClass}
            placeholder="e.g., Yangon"
          />
          {errors.stateRegionName && (
            <p className={errorClass}>{String(errors.stateRegionName.message)}</p>
          )}
        </div>

        <div>
          <label htmlFor="districtName" className={labelClass}>
            District <span className="text-red-500">*</span>
          </label>
          <input
            {...register("districtName", { required: "District is required" })}
            id="districtName"
            type="text"
            className={inputClass}
            placeholder="e.g., Yangon East"
          />
          {errors.districtName && (
            <p className={errorClass}>{String(errors.districtName.message)}</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="townshipName" className={labelClass}>
            Township <span className="text-red-500">*</span>
          </label>
          <input
            {...register("townshipName", { required: "Township is required" })}
            id="townshipName"
            type="text"
            className={inputClass}
            placeholder="e.g., Botahtaung"
          />
          {errors.townshipName && (
            <p className={errorClass}>{String(errors.townshipName.message)}</p>
          )}
        </div>

        <div>
          <label htmlFor="townName" className={labelClass}>
            Town/Village Tract <span className="text-red-500">*</span>
          </label>
          <input
            {...register("townName", { required: "Town is required" })}
            id="townName"
            type="text"
            className={inputClass}
          />
          {errors.townName && (
            <p className={errorClass}>{String(errors.townName.message)}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="wardVillageName" className={labelClass}>
          Ward/Village Name
        </label>
        <input
          {...register("wardVillageName")}
          id="wardVillageName"
          type="text"
          className={inputClass}
        />
      </div>

      {/* Addresses */}
      <div>
        <label htmlFor="permanentAddress" className={labelClass}>
          Permanent Address <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register("permanentAddress", { required: "Permanent address is required" })}
          id="permanentAddress"
          rows={3}
          className={inputClass}
          placeholder="Full permanent address"
        />
        {errors.permanentAddress && (
          <p className={errorClass}>{String(errors.permanentAddress.message)}</p>
        )}
      </div>

      <div>
        <label htmlFor="currentAddress" className={labelClass}>
          Current Address <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register("currentAddress", { required: "Current address is required" })}
          id="currentAddress"
          rows={3}
          className={inputClass}
          placeholder="Full current address"
        />
        {errors.currentAddress && (
          <p className={errorClass}>{String(errors.currentAddress.message)}</p>
        )}
      </div>
    </div>
  );
}
