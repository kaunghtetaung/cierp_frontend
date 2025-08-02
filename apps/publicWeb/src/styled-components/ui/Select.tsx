"use client";

// Styled Select Component - Complete UI implementation
import React from "react";
import {
  Select as BaseSelect,
  SelectTrigger as BaseSelectTrigger,
  SelectContent as BaseSelectContent,
  SelectItem as BaseSelectItem,
  SelectValue as BaseSelectValue,
  SelectProps as BaseSelectProps,
  SelectTriggerProps as BaseSelectTriggerProps,
  SelectContentProps as BaseSelectContentProps,
  SelectItemProps as BaseSelectItemProps,
  SelectValueProps as BaseSelectValueProps,
} from "@/base-components/ui/select";

export interface SelectProps extends BaseSelectProps {}
export interface SelectTriggerProps extends BaseSelectTriggerProps {}
export interface SelectContentProps extends BaseSelectContentProps {}
export interface SelectItemProps extends BaseSelectItemProps {}
export interface SelectValueProps extends BaseSelectValueProps {}

/**
 * Styled Select Components - WITH STYLING
 */
export function Select(props: SelectProps) {
  return <BaseSelect {...props} />;
}

export function SelectTrigger({
  className = "",
  ...props
}: SelectTriggerProps) {
  const styledClassName = `flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`;
  return <BaseSelectTrigger className={styledClassName} {...props} />;
}

export function SelectContent({
  className = "",
  ...props
}: SelectContentProps) {
  const styledClassName = `relative z-50 max-h-96 min-w-32 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md ${className}`;
  return <BaseSelectContent className={styledClassName} {...props} />;
}

export function SelectItem({ className = "", ...props }: SelectItemProps) {
  const styledClassName = `relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`;
  return <BaseSelectItem className={styledClassName} {...props} />;
}

export function SelectValue({ className = "", ...props }: SelectValueProps) {
  const styledClassName = `${className}`;
  return <BaseSelectValue className={styledClassName} {...props} />;
}
