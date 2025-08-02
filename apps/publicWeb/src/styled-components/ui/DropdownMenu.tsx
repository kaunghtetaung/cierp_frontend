"use client";

// Styled Dropdown Menu Component - Complete UI implementation
import React from "react";
import {
  DropdownMenu as BaseDropdownMenu,
  DropdownMenuTrigger as BaseDropdownMenuTrigger,
  DropdownMenuContent as BaseDropdownMenuContent,
  DropdownMenuItem as BaseDropdownMenuItem,
  DropdownMenuSeparator as BaseDropdownMenuSeparator,
  DropdownMenuProps as BaseDropdownMenuProps,
  DropdownMenuTriggerProps as BaseDropdownMenuTriggerProps,
  DropdownMenuContentProps as BaseDropdownMenuContentProps,
  DropdownMenuItemProps as BaseDropdownMenuItemProps,
  DropdownMenuSeparatorProps as BaseDropdownMenuSeparatorProps,
} from "@/base-components/ui/dropdown-menu";

export interface DropdownMenuProps extends BaseDropdownMenuProps {}
export interface DropdownMenuTriggerProps
  extends BaseDropdownMenuTriggerProps {}
export interface DropdownMenuContentProps
  extends BaseDropdownMenuContentProps {}
export interface DropdownMenuItemProps extends BaseDropdownMenuItemProps {}
export interface DropdownMenuSeparatorProps
  extends BaseDropdownMenuSeparatorProps {}

/**
 * Styled Dropdown Menu Components - WITH STYLING
 */
export function DropdownMenu(props: DropdownMenuProps) {
  return <BaseDropdownMenu {...props} />;
}

export function DropdownMenuTrigger(props: DropdownMenuTriggerProps) {
  return <BaseDropdownMenuTrigger {...props} />;
}

export function DropdownMenuContent({
  className = "",
  align = "start",
  ...props
}: DropdownMenuContentProps) {
  const alignClasses = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  };

  const styledClassName = `absolute z-[9999] mt-1 min-w-32 rounded-md border bg-popover border-border p-1 text-popover-foreground shadow-lg ${alignClasses[align]} ${className}`;

  return (
    <BaseDropdownMenuContent
      className={styledClassName}
      align={align}
      {...props}
    />
  );
}

export function DropdownMenuItem({
  className = "",
  ...props
}: DropdownMenuItemProps) {
  const styledClassName = `relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${className}`;

  return <BaseDropdownMenuItem className={styledClassName} {...props} />;
}

export function DropdownMenuSeparator({
  className = "",
  ...props
}: DropdownMenuSeparatorProps) {
  const styledClassName = `-mx-1 my-1 h-px bg-border ${className}`;

  return <BaseDropdownMenuSeparator className={styledClassName} {...props} />;
}
