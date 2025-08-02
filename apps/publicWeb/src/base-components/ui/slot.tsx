"use client";

import React from "react";

export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

/**
 * Simple Slot implementation - replaces @radix-ui/react-slot
 */
export const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ children, ...props }, ref) => {
    if (React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...props,
        ...children.props,
        ref,
      } as any);
    }

    return (
      <div ref={ref as any} {...props}>
        {children}
      </div>
    );
  }
);

Slot.displayName = "Slot";
