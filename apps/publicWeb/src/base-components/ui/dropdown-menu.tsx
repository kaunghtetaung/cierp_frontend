"use client";

// Base Dropdown Menu Component - Pure functionality only
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";

interface DropdownMenuContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(
  null
);

export interface DropdownMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

export interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
}

export interface DropdownMenuItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export interface DropdownMenuSeparatorProps {
  className?: string;
}

/**
 * Base Dropdown Menu - NO STYLING
 * Pure functionality for dropdown behavior
 */
export function DropdownMenu({
  open: controlledOpen,
  onOpenChange,
  children,
}: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <DropdownMenuContext.Provider value={{ open, onOpenChange: setOpen }}>
      <div className="">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  asChild,
  className = "",
}: DropdownMenuTriggerProps) {
  const context = useContext(DropdownMenuContext);

  if (!context) {
    throw new Error("DropdownMenuTrigger must be used within a DropdownMenu");
  }

  const handleClick = () => {
    context.onOpenChange(!context.open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
      className: `${(children.props as any).className || ""} ${className}`,
    } as any);
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  children,
  className = "",
  align = "start",
}: DropdownMenuContentProps) {
  const context = useContext(DropdownMenuContext);
  const contentRef = useRef<HTMLDivElement>(null);

  if (!context) {
    throw new Error("DropdownMenuContent must be used within a DropdownMenu");
  }

  // Close on outside click
  useEffect(() => {
    if (!context.open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        context.onOpenChange(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [context]);

  if (!context.open) {
    return null;
  }

  return (
    <div ref={contentRef} className={className} data-align={align}>
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  className = "",
  onClick,
}: DropdownMenuItemProps) {
  const context = useContext(DropdownMenuContext);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    if (context) {
      context.onOpenChange(false);
    }
  };

  return (
    <div className={className} onClick={handleClick}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({
  className = "",
}: DropdownMenuSeparatorProps) {
  return <div className={className} />;
}
