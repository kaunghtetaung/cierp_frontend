"use client"

import * as React from "react"
import { cn } from "@repo/utils"
import { Input } from "@repo/ui"

interface DatePickerProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  defaultYear?: number
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  className,
  defaultYear
}: DatePickerProps) {
  // Set default value for dateOfBirth field if no value is provided
  const getDefaultValue = () => {
    if (value) return value
    if (defaultYear && !value) {
      // Set default to January 1st of the default year (e.g., 2009-01-01)
      return `${defaultYear}-01-01`
    }
    return ""
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <Input
      type="date"
      value={getDefaultValue()}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        "w-full",
        className
      )}
    />
  )
}