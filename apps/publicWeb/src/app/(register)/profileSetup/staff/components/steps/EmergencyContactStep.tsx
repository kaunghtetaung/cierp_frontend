"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Input, Label } from "@repo/ui";
import { User, Phone, Mail, MapPin, Users } from "lucide-react";
import { cn } from "@repo/utils";
import { PhoneInput } from "@repo/schema-forms/PhoneInput";

export function EmergencyContactStep() {
  const {
    register,
    formState: { errors },
    control,
  } = useFormContext();

  const inputClass = "border-gray-300 focus:border-blue-500 focus:ring-blue-500";
  const labelClass = "text-sm font-medium text-gray-700";
  const errorClass = "text-xs text-red-600 mt-1";

  return (
    <div className="space-y-6">
      {/* Contact Name and Relationship */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Name */}
        <div className="space-y-2">
          <Label className={labelClass}>
            Emergency Contact Name <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              {...register("emergencyContact.name")}
              placeholder="Enter contact name"
              className={cn(inputClass, "pl-10", (errors.emergencyContact as any)?.name && "border-red-500")}
            />
          </div>
          {(errors.emergencyContact as any)?.name && (
            <p className={errorClass}>{(errors.emergencyContact as any).name.message as string}</p>
          )}
        </div>

        {/* Relationship */}
        <div className="space-y-2">
          <Label className={labelClass}>
            Relationship <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              {...register("emergencyContact.relationship")}
              placeholder="e.g., Spouse, Sibling, Parent"
              className={cn(inputClass, "pl-10", (errors.emergencyContact as any)?.relationship && "border-red-500")}
            />
          </div>
          {(errors.emergencyContact as any)?.relationship && (
            <p className={errorClass}>{(errors.emergencyContact as any).relationship.message as string}</p>
          )}
        </div>
      </div>

      {/* Phone and Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phone Number */}
        <div className="space-y-2">
          <Label className={labelClass}>
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="emergencyContact.phoneNumber"
            control={control}
            render={({ field }) => (
              <PhoneInput
                value={field.value || ""}
                onChange={field.onChange}
                error={(errors.emergencyContact as any)?.phoneNumber?.message as string}
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
              {...register("emergencyContact.email")}
              type="email"
              placeholder="example@email.com"
              className={cn(inputClass, "pl-10")}
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label className={labelClass}>Address</Label>
        <div className="relative">
          <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <textarea
            {...register("emergencyContact.address")}
            rows={3}
            placeholder="Enter full address"
            className={cn(
              "w-full pl-10 px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 transition-all",
              inputClass
            )}
          />
        </div>
      </div>
    </div>
  );
}
