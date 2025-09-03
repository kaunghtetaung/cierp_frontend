"use client"

import * as React from "react"
import { cn } from "../lib/utils"
import { Input } from "./input"

interface DatePickerProps {
  date?: Date
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  disabled = false
}: DatePickerProps) {
  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return ''
    return date.toISOString().split('T')[0]
  }

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    if (value) {
      onDateChange(new Date(value))
    } else {
      onDateChange(undefined)
    }
  }

  return (
    <Input
      type="date"
      value={formatDateForInput(date)}
      onChange={handleDateChange}
      placeholder={placeholder}
      className={cn("w-full", className)}
      disabled={disabled}
    />
  )
}