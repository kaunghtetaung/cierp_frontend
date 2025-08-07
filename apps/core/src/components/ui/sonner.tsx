"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"
import { Z_INDEX } from "@repo/utils"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      expand={true}
      richColors={true}
      closeButton={true}
      className={`toaster group ${Z_INDEX.TOAST}`}
      toastOptions={{
        style: {
          position: 'relative',
        },
        classNames: {
          toast: "toast border shadow-lg",
          title: "text-sm font-semibold",
          description: "text-xs opacity-90",
          actionButton: "bg-primary text-primary-foreground hover:bg-primary/90",
          cancelButton: "bg-muted text-muted-foreground hover:bg-muted/90",
          closeButton: "bg-background border hover:bg-muted",
          error: "border-destructive text-destructive-foreground bg-destructive/10",
          success: "border-green-500 text-green-900 bg-green-50 dark:bg-green-900/20 dark:text-green-100",
          warning: "border-orange-500 text-orange-900 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-100",
          info: "border-blue-500 text-blue-900 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-100",
        },
        duration: 5000, // Default 5 seconds
      }}
      {...props}
    />
  )
}

export { Toaster }
