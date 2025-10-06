"use client";

import React, { useState, useEffect } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Popover, PopoverContent, PopoverTrigger, Button } from "@repo/ui";
import { User, ChevronsUpDown, Check, Mail, Phone as PhoneIcon } from "lucide-react";
import { cn } from "@repo/utils";
import { PublicNrcField } from "./PublicNrcField";
import { PlaceOfBirthTypeAhead } from "./PlaceOfBirthTypeAhead";
import { PhoneInput } from "@repo/schema-forms/PhoneInput";

// Predefined options
const ETHNICITY_OPTIONS = [
  "Bamar",
  "Shan",
  "Karen",
  "Rakhine",
  "Chin",
  "Mon",
  "Kachin",
  "Kayah",
  "Chinese",
  "Indian",
];

const RELIGION_OPTIONS = [
  "Buddhism",
  "Christianity",
  "Islam",
  "Hinduism",
  "Animism",
  "None",
];

interface PersonalInfoStepProps {
  user: any;
}

export function PersonalInfoStep({ user }: PersonalInfoStepProps) {
  const { register, formState: { errors }, control, setValue } = useFormContext();

  // Set email from user on mount
  useEffect(() => {
    if (user?.email) {
      setValue("email", user.email);
    }
  }, [user, setValue]);

  // Reusable key handler for input fields (ESC to reset, Enter prevention)
  const handleInputEscKey = (fieldName: string) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLInputElement).value = "";
      setValue(fieldName, "");

      // Trigger React Hook Form's onChange
      const event = new Event('input', { bubbles: true });
      e.target.dispatchEvent(event);
    } else if (e.key === "Enter") {
      // Prevent Enter key from submitting the form on input fields
      e.preventDefault();
    }
  };

  // ESC key handler for Select fields
  const handleSelectEscKey = (fieldName: string, currentValue: string) => (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && currentValue) {
      e.preventDefault();
      e.stopPropagation();
      setValue(fieldName, "");
    }
  };

  return (
    <div className="space-y-6">
      {/* Row 1: Name (Myanmar), Name (English) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name Myanmar */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Name (Myanmar)
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              {...register("nameMyanmar")}
              placeholder="မြန်မာလို အမည်ထည့်ပါ (မောင်/မ) မပါရ"
              className={cn(
                "pl-10 border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1]",
                errors.nameMyanmar && "border-red-300 focus:border-red-500"
              )}
              onKeyDown={handleInputEscKey("nameMyanmar")}
            />
          </div>
          {errors.nameMyanmar && (
            <p className="text-sm text-red-600">{errors.nameMyanmar.message as string}</p>
          )}
        </div>

        {/* Name English */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Name (English)
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              {...register("nameEnglish")}
              placeholder="Type in english (Without Mg/Ma)"
              className={cn(
                "pl-10 border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1]",
                errors.nameEnglish && "border-red-300 focus:border-red-500"
              )}
              onKeyDown={handleInputEscKey("nameEnglish")}
            />
          </div>
          {errors.nameEnglish && (
            <p className="text-sm text-red-600">{errors.nameEnglish.message as string}</p>
          )}
        </div>
      </div>

      {/* Row 2: Gender, Race/Ethnicity, Religion, Blood Type */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Gender */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Gender
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || ""}
                onValueChange={field.onChange}
              >
                <SelectTrigger
                  className={cn(
                    "w-full bg-white border border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1]",
                    errors.gender && "border-red-300 focus:border-red-500"
                  )}
                  onKeyDown={handleSelectEscKey("gender", field.value)}
                >
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.gender && (
            <p className="text-sm text-red-600">{errors.gender.message as string}</p>
          )}
        </div>

        {/* Ethnicity */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Race/Ethnicity
          </Label>
          <Controller
            name="ethnicity"
            control={control}
            render={({ field }) => {
              const [open, setOpen] = React.useState(false);
              const [inputValue, setInputValue] = React.useState("");

              React.useEffect(() => {
                if (open) {
                  setInputValue(field.value || "");
                }
              }, [open, field.value]);

              const handleSelect = (option: string) => {
                field.onChange(option);
                setOpen(false);
              };

              const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
                e.stopPropagation();
                if (e.key === "Escape") {
                  e.preventDefault();
                  if (inputValue) {
                    // Clear input first
                    setInputValue("");
                  } else {
                    // If already empty, close dropdown
                    setOpen(false);
                  }
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (inputValue.trim()) {
                    field.onChange(inputValue.trim());
                    setOpen(false);
                  }
                }
              };

              const filteredOptions = ETHNICITY_OPTIONS.filter((option) =>
                option.toLowerCase().includes(inputValue.toLowerCase())
              );

              return (
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between font-normal bg-white border border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1] hover:bg-white",
                        !field.value && "text-gray-400"
                      )}
                      onKeyDown={(e) => {
                        if (e.key === "Escape" && !open && field.value) {
                          e.preventDefault();
                          e.stopPropagation();
                          field.onChange("");
                        } else if (e.altKey && e.key === "ArrowDown") {
                          e.preventDefault();
                          setOpen(true);
                        }
                      }}
                    >
                      <span className="truncate">{field.value || "Select or type ethnicity"}</span>
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-full p-0 bg-white border border-gray-300"
                    align="start"
                  >
                    <div className="flex items-center border-b border-gray-200 px-3 bg-white">
                      <Input
                        placeholder="Search or type custom..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        className="border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-11"
                      />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto bg-white p-1">
                      {filteredOptions.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-gray-500">
                          Press Enter to use "{inputValue}"
                        </div>
                      ) : (
                        filteredOptions.map((option) => (
                          <div
                            key={option}
                            onClick={() => handleSelect(option)}
                            className="relative flex items-center rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 text-gray-900"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === option ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {option}
                          </div>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              );
            }}
          />
        </div>

        {/* Religion */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Religion
          </Label>
          <Controller
            name="religion"
            control={control}
            render={({ field }) => {
              const [open, setOpen] = React.useState(false);
              const [inputValue, setInputValue] = React.useState("");

              React.useEffect(() => {
                if (open) {
                  setInputValue(field.value || "");
                }
              }, [open, field.value]);

              const handleSelect = (option: string) => {
                field.onChange(option);
                setOpen(false);
              };

              const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
                e.stopPropagation();
                if (e.key === "Escape") {
                  e.preventDefault();
                  if (inputValue) {
                    // Clear input first
                    setInputValue("");
                  } else {
                    // If already empty, close dropdown
                    setOpen(false);
                  }
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (inputValue.trim()) {
                    field.onChange(inputValue.trim());
                    setOpen(false);
                  }
                }
              };

              const filteredOptions = RELIGION_OPTIONS.filter((option) =>
                option.toLowerCase().includes(inputValue.toLowerCase())
              );

              return (
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between font-normal bg-white border border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1] hover:bg-white",
                        !field.value && "text-gray-400"
                      )}
                      onKeyDown={(e) => {
                        if (e.key === "Escape" && !open && field.value) {
                          e.preventDefault();
                          e.stopPropagation();
                          field.onChange("");
                        } else if (e.altKey && e.key === "ArrowDown") {
                          e.preventDefault();
                          setOpen(true);
                        }
                      }}
                    >
                      <span className="truncate">{field.value || "Select or type religion"}</span>
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-full p-0 bg-white border border-gray-300"
                    align="start"
                  >
                    <div className="flex items-center border-b border-gray-200 px-3 bg-white">
                      <Input
                        placeholder="Search or type custom..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        className="border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-11"
                      />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto bg-white p-1">
                      {filteredOptions.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-gray-500">
                          Press Enter to use "{inputValue}"
                        </div>
                      ) : (
                        filteredOptions.map((option) => (
                          <div
                            key={option}
                            onClick={() => handleSelect(option)}
                            className="relative flex items-center rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 text-gray-900"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === option ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {option}
                          </div>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              );
            }}
          />
        </div>

        {/* Blood Group */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Blood Type
          </Label>
          <Controller
            name="bloodGroup"
            control={control}
            render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger
                  className="w-full bg-white border border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1]"
                  onKeyDown={handleSelectEscKey("bloodGroup", field.value)}
                >
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300">
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* Row 3: Place of Birth (col-1), Date of Birth (col-1), NRC Number (col-2) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Place of Birth */}
        <div className="md:col-span-1">
          <Controller
            name="placeOfBirth"
            control={control}
            render={({ field }) => (
              <PlaceOfBirthTypeAhead
                value={field.value || ""}
                onChange={field.onChange}
                error={errors.placeOfBirth?.message as string}
              />
            )}
          />
        </div>

        {/* Date of Birth */}
        <div className="md:col-span-1 space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Date of Birth
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            type="date"
            {...register("dateOfBirth")}
            max={new Date(new Date().getFullYear() - 14, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]}
            className={cn(
              "border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1]",
              errors.dateOfBirth && "border-red-300 focus:border-red-500"
            )}
            onKeyDown={handleInputEscKey("dateOfBirth")}
          />
          {errors.dateOfBirth && (
            <p className="text-sm text-red-600">{errors.dateOfBirth.message as string}</p>
          )}
        </div>

        {/* NRC */}
        <div className="md:col-span-2">
          <Controller
            name="nrcNumber"
            control={control}
            render={({ field }) => (
              <PublicNrcField
                value={field.value || ""}
                onChange={field.onChange}
                error={errors.nrcNumber?.message as string}
              />
            )}
          />
        </div>
      </div>

      {/* Row 4: Phone Number, Email Address */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phone Number */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Phone Number
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Controller
            name="phoneNumber"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                </div>
                <PhoneInput
                  value={field.value || ""}
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
                  className={cn(
                    "pl-10 border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1]",
                    errors.phoneNumber && "border-red-300 focus:border-red-500"
                  )}
                />
              </div>
            )}
          />
          {errors.phoneNumber && (
            <p className="text-sm text-red-600">{errors.phoneNumber.message as string}</p>
          )}
        </div>

        {/* Email Address */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Email Address
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              {...register("email")}
              type="email"
              placeholder="email@example.com"
              readOnly
              className={cn(
                "pl-10 border-gray-300 bg-gray-50 cursor-not-allowed",
                errors.email && "border-red-300"
              )}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message as string}</p>
          )}
        </div>
      </div>
    </div>
  );
}
