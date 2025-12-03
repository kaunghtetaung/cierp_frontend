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
}

interface NrcParts {
  stateNumber: string;
  townshipCode: string;
  type: string;
  serial: string;
}

// Parse NRC string: "12/OuKaMa(N)123456" or "12/ကပတ(N)123456" or partial format "12|OuKaMa||", etc.
// Township codes can be in English (OuKaMa) or Myanmar script (ကပတ)
function parseNrc(nrcString: string): NrcParts {
  if (!nrcString) {
    return { stateNumber: "", townshipCode: "", type: "", serial: "" };
  }

  // Try to match complete NRC format first
  // Township can be English letters [A-Za-z] or Myanmar Unicode [\u1000-\u109F]
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

// Format NRC parts: "12/OuKaMa(N)123456" for complete, or "12|OuKaMa|N|123456" for partial
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

export function PublicNrcField({ value = "", onChange, error, disabled = false }: NrcFieldProps) {
  // Debug: Log value on every render
  console.log("🔍 [PublicNrcField] RENDER - value prop:", JSON.stringify(value));

  // Use internal state for immediate UI updates
  // IMPORTANT: Initialize with the value prop - this runs on mount
  const [parts, setParts] = useState<NrcParts>(() => {
    const initialParts = parseNrc(value);
    console.log("🔍 [PublicNrcField] useState INIT - value:", JSON.stringify(value), "→ parts:", initialParts);
    return initialParts;
  });

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
            setParts(prev => ({ ...prev, townshipCode: englishCode }));
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
            onValueChange={(value) => handlePartChange("stateNumber", value)}
            disabled={disabled}
          >
            <SelectTrigger
              className={cn(
                "w-full border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1]",
                error && "border-red-300 focus:border-red-500"
              )}
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
        </div>

        {/* Township */}
        <div className="col-span-4">
          <Select
            value={parts.townshipCode || ""}
            onValueChange={(value) => handlePartChange("townshipCode", value)}
            disabled={disabled || !parts.stateNumber}
          >
            <SelectTrigger
              className={cn(
                "w-full border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1]",
                error && "border-red-300 focus:border-red-500"
              )}
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
        </div>

        {/* Type (N/E/P/T/Y/S) */}
        <div className="col-span-2">
          <Select
            value={parts.type}
            onValueChange={(value) => handlePartChange("type", value)}
            disabled={disabled}
          >
            <SelectTrigger
              className={cn(
                "w-full border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1]",
                error && "border-red-300 focus:border-red-500"
              )}
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
            }}
            disabled={disabled}
            maxLength={6}
            className={cn(
              "border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1]",
              error && "border-red-300 focus:border-red-500"
            )}
          />
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
