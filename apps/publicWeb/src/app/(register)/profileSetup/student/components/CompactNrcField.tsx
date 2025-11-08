"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@repo/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui";
import { Label } from "@repo/ui";
import { cn } from "@repo/utils";
import { useNrcStates, useNrcTownships, useNrcTypes } from "@repo/nrc-hooks";

interface NrcParts {
  state: string;
  township: string;
  citizenship: string;
  serial: string;
}

function parseNrc(nrcString: string): NrcParts {
  if (!nrcString) {
    return { state: "", township: "", citizenship: "", serial: "" };
  }
  const match = nrcString.match(/^(\d{1,2})\/([A-Za-z\u1000-\u109F]{3,6})\(([NEAP])\)(\d{1,6})$/);
  if (match) {
    return {
      state: match[1],
      township: match[2],
      citizenship: match[3],
      serial: match[4]
    };
  }
  return { state: "", township: "", citizenship: "", serial: "" };
}

function formatNrc(parts: NrcParts): string {
  const { state, township, citizenship, serial } = parts;
  if (!state || !township || !citizenship || !serial) {
    return "";
  }
  return `${state}/${township}(${citizenship})${serial}`;
}

export interface CompactNrcFieldProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  fieldName?: string;
  label?: string;
  showLabel?: boolean;
}

export function CompactNrcField({
  value = "",
  onChange,
  placeholder,
  disabled = false,
  error = false,
  fieldName = "nrc",
  label = "NRC Number",
  showLabel = true,
}: CompactNrcFieldProps) {
  const [parts, setParts] = useState<NrcParts>(() => parseNrc(value));
  const [isFreeForm, setIsFreeForm] = useState(false);
  const [freeFormValue, setFreeFormValue] = useState(value);

  // Lazy load NRC data with hooks
  const { states } = useNrcStates();
  const { townships } = useNrcTownships(parts.state);
  const { types } = useNrcTypes();

  useEffect(() => {
    if (value) {
      setFreeFormValue(value);
      const newParts = parseNrc(value);
      if (!newParts.state && !newParts.township && !newParts.citizenship && !newParts.serial) {
        setIsFreeForm(true);
      } else {
        setParts(newParts);
      }
    }
  }, [value]);

  const handlePartChange = useCallback((field: keyof NrcParts, newValue: string) => {
    const updatedParts = { ...parts, [field]: newValue };
    setParts(updatedParts);
    const formattedNrc = formatNrc(updatedParts);
    if (formattedNrc) {
      onChange(formattedNrc);
    }
  }, [parts, onChange]);

  const handleFreeFormToggle = (checked: boolean) => {
    setIsFreeForm(checked);
    if (checked) {
      const currentValue = formatNrc(parts) || freeFormValue || value;
      setFreeFormValue(currentValue);
      onChange(currentValue);
    } else {
      const parsedParts = parseNrc(freeFormValue);
      setParts(parsedParts);
      const newFormattedValue = formatNrc(parsedParts);
      onChange(newFormattedValue);
    }
  };

  const handleFreeFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setFreeFormValue(newValue);
    onChange(newValue);
  };

  const handleSerialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length <= 6) {
      handlePartChange("serial", value);
    }
  };

  return (
    <div className="relative w-full">
      {/* Label and Toggle Switch in same row */}
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <Label className="text-sm font-medium text-gray-700">
            {label}
          </Label>
          <div className="flex items-center space-x-2">
            <label htmlFor={`${fieldName}-toggle`} className="text-xs text-muted-foreground cursor-pointer">
              Custom Format
            </label>
            <input
              type="checkbox"
              id={`${fieldName}-toggle`}
              checked={isFreeForm}
              onChange={(e) => handleFreeFormToggle(e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {isFreeForm ? (
        <Input
          type="text"
          value={freeFormValue}
          onChange={handleFreeFormChange}
          placeholder={placeholder || "Enter NRC number"}
          disabled={disabled}
          className={cn(
            "h-9 text-sm font-mono px-3 py-2 border-gray-300 rounded-md",
            error && "border-destructive focus:ring-destructive"
          )}
        />
      ) : (
        <div className="flex items-center gap-1 font-mono text-sm">
          <Select value={parts.state} onValueChange={(v) => handlePartChange("state", v)} disabled={disabled}>
            <SelectTrigger className="h-9 w-14 text-xs border-gray-300 rounded-md">
              <SelectValue placeholder="xx">{parts.state}</SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-300">
              {states?.map((state) => (
                <SelectItem key={state.id} value={state.number.en}>
                  <span className="font-mono text-xs">{state.number.en} - {state.name.en}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-muted-foreground">/</span>

          <Select value={parts.township} onValueChange={(v) => handlePartChange("township", v)} disabled={disabled || !parts.state}>
            <SelectTrigger className="h-9 w-24 text-xs border-gray-300 rounded-md">
              <SelectValue placeholder="xxx">{parts.township}</SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-300 max-h-60 overflow-y-auto">
              {townships?.map((township) => (
                <SelectItem key={township.id} value={township.short.en}>
                  <span className="font-mono text-xs">{township.short.en}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-muted-foreground">(</span>

          <Select value={parts.citizenship} onValueChange={(v) => handlePartChange("citizenship", v)} disabled={disabled}>
            <SelectTrigger className="h-9 w-12 text-xs border-gray-300 rounded-md">
              <SelectValue placeholder="x">{parts.citizenship}</SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-300">
              {types?.map((type) => (
                <SelectItem key={type.id} value={type.name.en}>
                  <span className="font-mono text-xs">{type.name.en}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-muted-foreground">)</span>

          <Input
            type="text"
            value={parts.serial}
            onChange={handleSerialChange}
            placeholder="123456"
            disabled={disabled}
            className="h-9 w-20 text-center font-mono text-xs px-3 py-2 border-gray-300 rounded-md"
            maxLength={6}
          />
        </div>
      )}
    </div>
  );
}
