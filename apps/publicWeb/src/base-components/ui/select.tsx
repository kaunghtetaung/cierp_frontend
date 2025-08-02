// Basic Select Component
// Simple replacement for missing UI library
'use client';

import React, { createContext, useContext, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export function Select({ value = '', onValueChange, children }: SelectProps) {
  const [internalValue, setInternalValue] = useState('');
  const [open, setOpen] = useState(false);
  
  const currentValue = value || internalValue;
  const setValue = onValueChange || setInternalValue;
  
  return (
    <SelectContext.Provider value={{ 
      value: currentValue, 
      onValueChange: setValue,
      open,
      onOpenChange: setOpen
    }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectTrigger({ children, className = '' }: SelectTriggerProps) {
  const context = useContext(SelectContext);
  
  if (!context) {
    throw new Error('SelectTrigger must be used within a Select');
  }
  
  return (
    <button
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onClick={() => context.onOpenChange(!context.open)}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
}

export interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

export function SelectValue({ placeholder = 'Select...', className = '' }: SelectValueProps) {
  const context = useContext(SelectContext);
  
  if (!context) {
    throw new Error('SelectValue must be used within a Select');
  }
  
  return (
    <span className={className}>
      {context.value || placeholder}
    </span>
  );
}

export interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectContent({ children, className = '' }: SelectContentProps) {
  const context = useContext(SelectContext);
  
  if (!context) {
    throw new Error('SelectContent must be used within a Select');
  }
  
  if (!context.open) {
    return null;
  }
  
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => context.onOpenChange(false)}
      />
      
      {/* Content */}
      <div className={`absolute z-50 top-full w-full mt-1 max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md ${className}`}>
        {children}
      </div>
    </>
  );
}

export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function SelectItem({ value, children, className = '' }: SelectItemProps) {
  const context = useContext(SelectContext);
  
  if (!context) {
    throw new Error('SelectItem must be used within a Select');
  }
  
  const handleClick = () => {
    context.onValueChange(value);
    context.onOpenChange(false);
  };
  
  const isSelected = context.value === value;
  
  return (
    <div
      className={`relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm hover:bg-accent hover:text-accent-foreground ${isSelected ? 'bg-accent text-accent-foreground' : ''} ${className}`}
      onClick={handleClick}
    >
      {children}
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          ✓
        </span>
      )}
    </div>
  );
}