"use client";

import React, { useState, useEffect } from "react";
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
import { Briefcase, Calendar, Search } from "lucide-react";
import { cn } from "@repo/utils";

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "permanent", label: "Permanent" },
  { value: "contract", label: "Contract" },
  { value: "temporary", label: "Temporary" },
  { value: "probation", label: "Probation" },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
];

export function EmploymentInfoStep() {
  const {
    register,
    formState: { errors },
    control,
    setValue,
    watch,
  } = useFormContext();

  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const inputClass = "border-gray-300 focus:border-blue-500 focus:ring-blue-500";
  const labelClass = "text-sm font-medium text-gray-700";
  const errorClass = "text-xs text-red-600 mt-1";

  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoadingAppointments(true);
      try {
        const response = await fetch(`/api/appointments/ref?search=${searchTerm}`);
        if (response.ok) {
          const data = await response.json();
          setAppointments(data);
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoadingAppointments(false);
      }
    };

    fetchAppointments();
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Primary Appointment */}
      <div className="space-y-2">
        <Label className={labelClass}>
          Primary Appointment/Position <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Briefcase className="h-5 w-5 text-gray-400" />
          </div>
          <Controller
            name="primaryAppointmentId"
            control={control}
            render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger
                  className={cn(inputClass, "pl-10", errors.primaryAppointmentId && "border-red-500")}
                >
                  <SelectValue placeholder={loadingAppointments ? "Loading..." : "Select appointment"} />
                </SelectTrigger>
                <SelectContent>
                  {appointments.map((apt: any) => (
                    <SelectItem key={apt._id} value={apt._id}>
                      {apt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        {errors.primaryAppointmentId && (
          <p className={errorClass}>{errors.primaryAppointmentId.message as string}</p>
        )}
      </div>

      {/* Employment Status and Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Employment Status */}
        <div className="space-y-2">
          <Label className={labelClass}>
            Employment Status <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="employmentStatus"
            control={control}
            render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger className={cn(inputClass, errors.employmentStatus && "border-red-500")}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.employmentStatus && (
            <p className={errorClass}>{errors.employmentStatus.message as string}</p>
          )}
        </div>

        {/* Employment Type */}
        <div className="space-y-2">
          <Label className={labelClass}>
            Employment Type <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="employmentType"
            control={control}
            render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger className={cn(inputClass, errors.employmentType && "border-red-500")}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.employmentType && (
            <p className={errorClass}>{errors.employmentType.message as string}</p>
          )}
        </div>
      </div>

      {/* Joining Date */}
      <div className="space-y-2">
        <Label className={labelClass}>
          Joining Date <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            {...register("joiningDate")}
            type="date"
            className={cn(inputClass, "pl-10", errors.joiningDate && "border-red-500")}
          />
        </div>
        {errors.joiningDate && (
          <p className={errorClass}>{errors.joiningDate.message as string}</p>
        )}
      </div>
    </div>
  );
}
