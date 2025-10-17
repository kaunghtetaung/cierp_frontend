"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { User, Calendar, Phone, Mail } from "lucide-react";
import { cn } from "@repo/utils";
import { PhoneInput } from "@repo/schema-forms/PhoneInput";

// Predefined options
const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const ETHNICITY_OPTIONS = [
  { value: "bamar", label: "Bamar" },
  { value: "shan", label: "Shan" },
  { value: "karen", label: "Karen" },
  { value: "rakhine", label: "Rakhine" },
  { value: "chin", label: "Chin" },
  { value: "mon", label: "Mon" },
  { value: "kachin", label: "Kachin" },
  { value: "kayah", label: "Kayah" },
  { value: "chinese", label: "Chinese" },
  { value: "indian", label: "Indian" },
  { value: "other", label: "Other" },
];

const RELIGION_OPTIONS = [
  { value: "buddhism", label: "Buddhism" },
  { value: "christianity", label: "Christianity" },
  { value: "islam", label: "Islam" },
  { value: "hinduism", label: "Hinduism" },
  { value: "animism", label: "Animism" },
  { value: "other", label: "Other" },
  { value: "none", label: "None" },
];

const BLOOD_GROUP_OPTIONS = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
];

export function PersonalInfoStep() {
  const {
    register,
    formState: { errors },
    control,
    setValue,
  } = useFormContext();

  const inputClass = "border-gray-300 focus:border-blue-500 focus:ring-blue-500";
  const labelClass = "text-sm font-medium text-gray-700";
  const errorClass = "text-xs text-red-600 mt-1";

  return (
    <div className="space-y-6">
      {/* Names Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Myanmar Name */}
        <div className="space-y-2">
          <Label className={labelClass}>
            Name (Myanmar) <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              {...register("nameMyanmar")}
              placeholder="မြန်မာလို အမည်ထည့်ပါ (ဦး/ဒေါ်) မပါရ"
              className={cn(inputClass, "pl-10", errors.nameMyanmar && "border-red-500")}
            />
          </div>
          {errors.nameMyanmar && (
            <p className={errorClass}>{errors.nameMyanmar.message as string}</p>
          )}
        </div>

        {/* English Name */}
        <div className="space-y-2">
          <Label className={labelClass}>
            Name (English) <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              {...register("nameEnglish")}
              placeholder="Type in english (Without U/Daw)"
              className={cn(inputClass, "pl-10", errors.nameEnglish && "border-red-500")}
            />
          </div>
          {errors.nameEnglish && (
            <p className={errorClass}>{errors.nameEnglish.message as string}</p>
          )}
        </div>
      </div>

      {/* Gender, DOB, NRC Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gender */}
        <div className="space-y-2">
          <Label className={labelClass}>
            Gender <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger className={cn(inputClass, errors.gender && "border-red-500")}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.gender && (
            <p className={errorClass}>{errors.gender.message as string}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <Label className={labelClass}>
            Date of Birth <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              {...register("dateOfBirth")}
              type="date"
              className={cn(inputClass, "pl-10", errors.dateOfBirth && "border-red-500")}
            />
          </div>
          {errors.dateOfBirth && (
            <p className={errorClass}>{errors.dateOfBirth.message as string}</p>
          )}
        </div>

        {/* NRC Number */}
        <div className="space-y-2">
          <Label className={labelClass}>
            NRC Number <span className="text-red-500">*</span>
          </Label>
          <Input
            {...register("nrcNumber")}
            placeholder="12/ABC(N)123456"
            className={cn(inputClass, errors.nrcNumber && "border-red-500")}
          />
          {errors.nrcNumber && (
            <p className={errorClass}>{errors.nrcNumber.message as string}</p>
          )}
        </div>
      </div>

      {/* Place of Birth */}
      <div className="space-y-2">
        <Label className={labelClass}>Place of Birth</Label>
        <Input
          {...register("placeOfBirth")}
          placeholder="Enter place of birth"
          className={inputClass}
        />
      </div>

      {/* Ethnicity, Religion, Blood Group Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ethnicity */}
        <div className="space-y-2">
          <Label className={labelClass}>Race/Ethnicity</Label>
          <Controller
            name="ethnicity"
            control={control}
            render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Select ethnicity" />
                </SelectTrigger>
                <SelectContent>
                  {ETHNICITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Religion */}
        <div className="space-y-2">
          <Label className={labelClass}>Religion</Label>
          <Controller
            name="religion"
            control={control}
            render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Select religion" />
                </SelectTrigger>
                <SelectContent>
                  {RELIGION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Blood Group */}
        <div className="space-y-2">
          <Label className={labelClass}>Blood Type</Label>
          <Controller
            name="bloodGroup"
            control={control}
            render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_GROUP_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phone Number */}
        <div className="space-y-2">
          <Label className={labelClass}>
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="phoneNumber"
            control={control}
            render={({ field }) => (
              <PhoneInput
                value={field.value || ""}
                onChange={field.onChange}
                error={errors.phoneNumber?.message as string}
                placeholder="09xxxxxxxxx"
              />
            )}
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label className={labelClass}>Email</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              {...register("email")}
              type="email"
              placeholder="example@email.com"
              className={cn(inputClass, "pl-10")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
