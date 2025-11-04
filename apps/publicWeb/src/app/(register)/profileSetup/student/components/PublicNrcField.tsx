"use client";

import React, { useState, useEffect } from "react";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label } from "@repo/ui";
import { cn } from "@repo/utils";
import nrcData from "@/../../NRC_Data.json";

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

// Parse NRC string: "12/OuKaMa(N)123456"
function parseNrc(nrcString: string): NrcParts {
  if (!nrcString) {
    return { stateNumber: "", townshipCode: "", type: "", serial: "" };
  }

  const match = nrcString.match(/^(\d{1,2}[\*]?)\/([A-Za-z]+)\(([A-Z])\)(\d{1,6})$/);

  if (match) {
    return {
      stateNumber: match[1],
      townshipCode: match[2],
      type: match[3],
      serial: match[4]
    };
  }

  return { stateNumber: "", townshipCode: "", type: "", serial: "" };
}

// Format NRC parts: "12/OuKaMa(N)123456"
function formatNrc(parts: NrcParts): string {
  const { stateNumber, townshipCode, type, serial } = parts;

  if (!stateNumber || !townshipCode || !type || !serial) {
    return "";
  }

  return `${stateNumber}/${townshipCode}(${type})${serial}`;
}

export function PublicNrcField({ value = "", onChange, error, disabled = false }: NrcFieldProps) {
  const [parts, setParts] = useState<NrcParts>(() => parseNrc(value));
  const [availableTownships, setAvailableTownships] = useState<any[]>([]);

  // Update parts when external value changes
  useEffect(() => {
    if (value) {
      const newParts = parseNrc(value);
      setParts(newParts);
    }
  }, [value]);

  // Update available townships when state changes
  useEffect(() => {
    if (parts.stateNumber) {
      const townships = nrcData.nrcTownships.filter(
        (t: any) => t.stateId === getStateIdByNumber(parts.stateNumber)
      );
      setAvailableTownships(townships);
    } else {
      setAvailableTownships([]);
    }
  }, [parts.stateNumber]);

  // Get state ID by number
  function getStateIdByNumber(number: string): string | undefined {
    const state = nrcData.nrcStates.find((s: any) => s.number.en === number);
    return state?.id;
  }

  // Handle part changes
  const handlePartChange = (field: keyof NrcParts, newValue: string) => {
    const updatedParts = { ...parts, [field]: newValue };

    // Clear township if state changes
    if (field === "stateNumber" && newValue !== parts.stateNumber) {
      updatedParts.townshipCode = "";
    }

    setParts(updatedParts);

    const formattedNrc = formatNrc(updatedParts);
    if (formattedNrc) {
      onChange(formattedNrc);
    } else if (!newValue && !updatedParts.townshipCode && !updatedParts.type && !updatedParts.serial) {
      onChange("");
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
              {nrcData.nrcStates.map((state: any) => (
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
            value={parts.townshipCode}
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
              {availableTownships.map((township: any) => (
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
              {nrcData.nrcTypes.map((type: any) => (
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
