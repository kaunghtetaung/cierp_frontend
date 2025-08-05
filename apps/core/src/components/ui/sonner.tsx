"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"
import { Z_INDEX } from "@repo/utils"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className={`toaster group ${Z_INDEX.TOAST}`}
      toastOptions={{
        classNames: {
          toast: "toast",
          title: "text-sm font-semibold",
          description: "text-xs opacity-90",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
