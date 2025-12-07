"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label } from "@repo/ui";
import { cn } from "@repo/utils";
import { useNrcStates, useNrcTownships, useNrcTypes } from "@repo/nrc-hooks";

interface NrcFieldProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  showFieldErrors?: boolean; // Show individual field validation errors
  onValidationChange?: (isValid: boolean) => void; // Callback when validation state changes
}

interface FieldErrors {
  stateNumber?: string;
  townshipCode?: string;
  type?: string;
  serial?: string;
}

interface NrcParts {
  stateNumber: string;
  townshipCode: string;
  type: string;
  serial: string;
}

// Parse NRC string: "12/ကတတ(N)123456" (Myanmar format) or partial format "12|ကတတ|N|123456"
// Township codes are in Myanmar script (e.g., ကတတ, မဘတ)
// Format: {stateNumber}/{townshipCode}({type}){serial}
// Example: 12/ကမရ(N)123456
function parseNrc(nrcString: string): NrcParts {
  if (!nrcString) {
    return { stateNumber: "", townshipCode: "", type: "", serial: "" };
  }

  // Try to match complete NRC format first
  // State: 1-14 or with * (e.g., 12, 5*, 14)
  // Township: Myanmar Unicode characters [\u1000-\u109F] (e.g., ကမရ, မဘတ)
  // Type: Single uppercase letter (N, E, P, T, Y, S)
  // Serial: Exactly 6 digits
  const completeMatch = nrcString.match(/^(\d{1,2}[\*]?)\/([A-Za-z\u1000-\u109F]+)\(([A-Z])\)(\d{1,6})$/);

  if (completeMatch) {
    return {
      stateNumber: completeMatch[1],
      townshipCode: completeMatch[2],
      type: completeMatch[3],
      serial: completeMatch[4]
    };
  }

  // Try to match partial NRC format: "stateNumber|townshipCode|type|serial"
  const partialMatch = nrcString.match(/^(\d{0,2}[\*]?)\|([A-Za-z\u1000-\u109F]*)\|([A-Z]?)\|(\d{0,6})$/);
  if (partialMatch) {
    return {
      stateNumber: partialMatch[1],
      townshipCode: partialMatch[2],
      type: partialMatch[3],
      serial: partialMatch[4]
    };
  }

  return { stateNumber: "", townshipCode: "", type: "", serial: "" };
}

// Format NRC parts: "12/ကမရ(N)123456" for complete, or "12|ကမရ|N|123456" for partial
function formatNrc(parts: NrcParts): string {
  const { stateNumber, townshipCode, type, serial } = parts;

  // If all parts are filled, return complete format
  if (stateNumber && townshipCode && type && serial) {
    return `${stateNumber}/${townshipCode}(${type})${serial}`;
  }

  return "";
}

// Format partial NRC for storage: "stateNumber|townshipCode|type|serial"
function formatPartialNrc(parts: NrcParts): string {
  const { stateNumber, townshipCode, type, serial } = parts;

  // If any part has value, save as partial format
  if (stateNumber || townshipCode || type || serial) {
    return `${stateNumber}|${townshipCode}|${type}|${serial}`;
  }

  return "";
}

export function PublicNrcField({ value = "", onChange, error, disabled = false, showFieldErrors = true, onValidationChange }: NrcFieldProps) {
  // Debug: Log value on every render
  console.log("🔍 [PublicNrcField] RENDER - value prop:", JSON.stringify(value));

  // Use internal state for immediate UI updates
  // IMPORTANT: Initialize with the value prop - this runs on mount
  const [parts, setParts] = useState<NrcParts>(() => {
    const initialParts = parseNrc(value);
    console.log("🔍 [PublicNrcField] useState INIT - value:", JSON.stringify(value), "→ parts:", initialParts);
    return initialParts;
  });

  // Track which fields have been touched for validation
  const [touched, setTouched] = useState<Record<keyof NrcParts, boolean>>({
    stateNumber: false,
    townshipCode: false,
    type: false,
    serial: false,
  });

  // Validate individual fields for Myanmar NRC format
  const validateField = (field: keyof NrcParts, fieldValue: string): string | undefined => {
    switch (field) {
      case "stateNumber":
        if (!fieldValue) return "State/Region is required";
        const stateNum = parseInt(fieldValue.replace('*', ''));
        if (isNaN(stateNum) || stateNum < 1 || stateNum > 14) return "State must be 1-14";
        return undefined;
      case "townshipCode":
        if (!fieldValue && parts.stateNumber) return "Township is required";
        if (fieldValue && !/^[\u1000-\u109F]+$/.test(fieldValue)) return "Township must be Myanmar script";
        return undefined;
      case "type":
        if (!fieldValue) return "Type is required";
        if (!/^[NEPTYS]$/.test(fieldValue)) return "Type must be N, E, P, T, Y, or S";
        return undefined;
      case "serial":
        if (!fieldValue) return "Serial number is required";
        if (!/^\d{6}$/.test(fieldValue)) return "Serial must be exactly 6 digits";
        return undefined;
      default:
        return undefined;
    }
  };

  // Get field errors (only show if touched or if there's a parent error)
  const getFieldError = (field: keyof NrcParts): string | undefined => {
    if (!showFieldErrors) return undefined;
    if (!touched[field] && !error) return undefined;
    return validateField(field, parts[field]);
  };

  const fieldErrors: FieldErrors = {
    stateNumber: getFieldError("stateNumber"),
    townshipCode: getFieldError("townshipCode"),
    type: getFieldError("type"),
    serial: getFieldError("serial"),
  };

  // Check if NRC is complete and valid (Myanmar format: 12/ကမရ(N)123456)
  // Validation rules:
  // - stateNumber: 1-14 (required)
  // - townshipCode: Myanmar Unicode characters (required)
  // - type: N, E, P, T, Y, or S (required)
  // - serial: exactly 6 digits (required)
  const isValidStateNumber = /^(\d{1,2}[\*]?)$/.test(parts.stateNumber) &&
    (parseInt(parts.stateNumber.replace('*', '')) >= 1 && parseInt(parts.stateNumber.replace('*', '')) <= 14);
  const isValidTownshipCode = /^[\u1000-\u109F]+$/.test(parts.townshipCode); // Myanmar Unicode only
  const isValidType = /^[NEPTYS]$/.test(parts.type);
  const isValidSerial = /^\d{6}$/.test(parts.serial);

  const isNrcValid = !!(
    parts.stateNumber &&
    parts.townshipCode &&
    parts.type &&
    parts.serial &&
    isValidStateNumber &&
    isValidTownshipCode &&
    isValidType &&
    isValidSerial
  );

  // Track previous validation state to avoid unnecessary callback calls
  const prevIsNrcValidRef = useRef<boolean | null>(null);

  // Notify parent of validation state changes (only when value actually changes)
  useEffect(() => {
    if (onValidationChange && prevIsNrcValidRef.current !== isNrcValid) {
      prevIsNrcValidRef.current = isNrcValid;
      onValidationChange(isNrcValid);
    }
  }, [isNrcValid, onValidationChange]);

  // Mark field as touched on blur
  const handleBlur = (field: keyof NrcParts) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Track if update came from internal change to avoid sync loops
  const isInternalChange = useRef(false);

  // Sync internal state from external value prop (when value changes externally)
  useEffect(() => {
    console.log("🔄 [PublicNrcField] useEffect - value:", JSON.stringify(value), "isInternalChange:", isInternalChange.current);

    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }

    const newParts = parseNrc(value);
    console.log("🔄 [PublicNrcField] Syncing from external value:", value, "→", newParts);
    setParts(newParts);
  }, [value]);

  // Lazy load NRC data with hooks
  const { states } = useNrcStates();
  const { townships, isLoading: townshipsLoading } = useNrcTownships(parts.stateNumber);
  const { types } = useNrcTypes();

  // Track if we have a pending township code that needs to be matched after townships load
  const pendingTownshipCode = useRef<string | null>(null);

  // When component mounts with a value, save the township code to restore after townships load
  useEffect(() => {
    if (parts.townshipCode && !townships) {
      console.log("🔍 [PublicNrcField] Saving pending township code:", parts.townshipCode);
      pendingTownshipCode.current = parts.townshipCode;
    }
  }, [parts.townshipCode, townships]);

  // Normalize township code to English when townships are loaded
  // This handles cases where stored value is in Myanmar script
  // Also restores the township code after townships finish loading
  useEffect(() => {
    if (townships && townships.length > 0) {
      // First, check if we have a pending township code to restore
      const codeToMatch = pendingTownshipCode.current || parts.townshipCode;

      if (codeToMatch) {
        const matchingTownship = townships.find(
          t => t.short.mm === codeToMatch || t.short.en === codeToMatch
        );

        if (matchingTownship) {
          const englishCode = matchingTownship.short.en;
          console.log("🔄 [PublicNrcField] Townships loaded - matching township found:",
            codeToMatch, "→", englishCode);

          // Update to English code if different
          if (parts.townshipCode !== englishCode) {
            const updatedParts = { ...parts, townshipCode: englishCode };
            setParts(updatedParts);

            // Propagate to parent form so the normalized value is submitted
            isInternalChange.current = true;
            const completeNrc = formatNrc(updatedParts);
            if (completeNrc) {
              console.log("🔄 [PublicNrcField] Propagating normalized NRC to parent:", completeNrc);
              onChange(completeNrc);
            } else {
              const partialNrc = formatPartialNrc(updatedParts);
              console.log("🔄 [PublicNrcField] Propagating normalized partial NRC to parent:", partialNrc);
              onChange(partialNrc);
            }
          }

          // Clear the pending code
          pendingTownshipCode.current = null;
        } else {
          console.warn("⚠️ [PublicNrcField] No matching township found for:", codeToMatch);
        }
      }
    }
  }, [townships, parts.townshipCode]);

  // Handle part changes - update internal state immediately, then propagate to parent
  const handlePartChange = (field: keyof NrcParts, newValue: string) => {
    const updatedParts = { ...parts, [field]: newValue };

    // Clear township if state changes
    if (field === "stateNumber" && newValue !== parts.stateNumber) {
      updatedParts.townshipCode = "";
    }

    // Update internal state immediately for responsive UI
    setParts(updatedParts);
    isInternalChange.current = true;

    // Propagate to parent
    const completeNrc = formatNrc(updatedParts);

    if (completeNrc) {
      console.log("🔄 [PublicNrcField] Complete NRC:", completeNrc);
      onChange(completeNrc);
    } else {
      const partialNrc = formatPartialNrc(updatedParts);
      console.log("🔄 [PublicNrcField] Partial NRC:", partialNrc);
      onChange(partialNrc);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">
        NRC Number
        <span className="text-red-500 ml-1">*</span>
      </Label>

      <div className="grid grid-cols-12 gap-2">
        {/* State/Region */}
        <div className="col-span-3">
          <Select
            value={parts.stateNumber}
            onValueChange={(value) => {
              handlePartChange("stateNumber", value);
              setTouched(prev => ({ ...prev, stateNumber: true }));
            }}
            disabled={disabled}
          >
            <SelectTrigger
              className={cn(
                "w-full border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1]",
                (error || fieldErrors.stateNumber) && "border-red-300 focus:border-red-500"
              )}
              onBlur={() => handleBlur("stateNumber")}
            >
              <SelectValue placeholder="State">
                {parts.stateNumber ? (
                  <span className="truncate block">{parts.stateNumber}</span>
                ) : (
                  "State"
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-300 max-h-[300px] max-w-[300px] z-[100]">
              {states?.map((state) => (
                <SelectItem key={state.id} value={state.number.en} className="truncate">
                  {state.number.en} - {state.name.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.stateNumber && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.stateNumber}</p>
          )}
        </div>

        {/* Township */}
        <div className="col-span-4">
          <Select
            value={parts.townshipCode || ""}
            onValueChange={(value) => {
              handlePartChange("townshipCode", value);
              setTouched(prev => ({ ...prev, townshipCode: true }));
            }}
            disabled={disabled || !parts.stateNumber}
          >
            <SelectTrigger
              className={cn(
                "w-full border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1]",
                (error || fieldErrors.townshipCode) && "border-red-300 focus:border-red-500"
              )}
              onBlur={() => handleBlur("townshipCode")}
            >
              <SelectValue placeholder="Township">
                {parts.townshipCode ? (
                  <span className="truncate block">{parts.townshipCode}</span>
                ) : (
                  "Township"
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-300 max-h-[300px] overflow-y-auto max-w-[400px] z-[100]">
              {/* Include a hidden option for the current value while townships are loading */}
              {/* This ensures Radix UI Select displays the value even before options load */}
              {parts.townshipCode && !townships?.some(t => t.short.en === parts.townshipCode) && (
                <SelectItem key="__loading__" value={parts.townshipCode} className="hidden">
                  {parts.townshipCode}
                </SelectItem>
              )}
              {townships?.map((township) => (
                <SelectItem key={township.id} value={township.short.en} className="truncate">
                  {township.short.en} - {township.name.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.townshipCode && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.townshipCode}</p>
          )}
        </div>

        {/* Type (N/E/P/T/Y/S) */}
        <div className="col-span-2">
          <Select
            value={parts.type}
            onValueChange={(value) => {
              handlePartChange("type", value);
              setTouched(prev => ({ ...prev, type: true }));
            }}
            disabled={disabled}
          >
            <SelectTrigger
              className={cn(
                "w-full border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1]",
                (error || fieldErrors.type) && "border-red-300 focus:border-red-500"
              )}
              onBlur={() => handleBlur("type")}
            >
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-300 z-[100]">
              {types?.map((type) => (
                <SelectItem key={type.id} value={type.name.en}>
                  {type.name.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.type && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.type}</p>
          )}
        </div>

        {/* Serial Number */}
        <div className="col-span-3">
          <Input
            type="text"
            placeholder="123456"
            value={parts.serial}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
              handlePartChange("serial", value);
              setTouched(prev => ({ ...prev, serial: true }));
            }}
            onBlur={() => handleBlur("serial")}
            disabled={disabled}
            maxLength={6}
            className={cn(
              "border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1]",
              (error || fieldErrors.serial) && "border-red-300 focus:border-red-500"
            )}
          />
          {fieldErrors.serial && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.serial}</p>
          )}
        </div>
      </div>

      {/* Preview */}
      {formatNrc(parts) && (
        <div className="text-sm text-gray-600 mt-1">
          Preview: <span className="font-medium text-[#19184A]">{formatNrc(parts)}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
