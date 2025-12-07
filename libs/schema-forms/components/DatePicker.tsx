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

/**
 * Normalizes a date value to YYYY-MM-DD format for HTML date input.
 * Handles various input formats:
 * - ISO format: "2009-01-15T00:00:00.000Z" -> "2009-01-15"
 * - Already formatted: "2009-01-15" -> "2009-01-15"
 * - Empty/null: returns empty string
 */
function normalizeToDateInputFormat(dateValue: string | undefined | null): string {
  if (!dateValue) return ""

  // If it's already in YYYY-MM-DD format (10 characters), return as-is
  if (typeof dateValue === 'string' && dateValue.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue
  }

  // Handle ISO date strings (e.g., "2009-01-15T00:00:00.000Z")
  if (typeof dateValue === 'string' && dateValue.includes('T')) {
    return dateValue.split('T')[0]
  }

  // Try to parse as Date object and format
  try {
    const date = new Date(dateValue)
    if (!isNaN(date.getTime())) {
      // Format as YYYY-MM-DD
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  } catch {
    // If parsing fails, return the original value
  }

  return dateValue || ""
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  className,
  defaultYear
}: DatePickerProps) {
  // Normalize the value to YYYY-MM-DD format for HTML date input
  const normalizedValue = React.useMemo(() => {
    if (value) {
      return normalizeToDateInputFormat(value)
    }
    if (defaultYear) {
      // Set default to January 1st of the default year (e.g., 2009-01-01)
      return `${defaultYear}-01-01`
    }
    return ""
  }, [value, defaultYear])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <Input
      type="date"
      value={normalizedValue}
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