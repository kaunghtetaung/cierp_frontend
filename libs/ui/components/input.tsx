import * as React from "react"

import { cn } from "../lib/utils"

function Input({ className, type, onKeyDown, ...props }: React.ComponentProps<"input">) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent Enter key from submitting forms (except for textareas which are handled separately)
    if (e.key === 'Enter' && type !== 'textarea') {
      console.log('🔑 Input Enter Key Intercepted:', {
        inputType: type,
        inputName: (e.target as HTMLInputElement).name,
        inputValue: (e.target as HTMLInputElement).value,
        timestamp: new Date().toISOString()
      })
      e.preventDefault()
      e.stopPropagation()
    }

    // Call the original onKeyDown if provided
    if (onKeyDown) {
      onKeyDown(e)
    }
  }

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "flex h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className
      )}
      onKeyDown={handleKeyDown}
      {...props}
    />
  )
}

export { Input }
