"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@repo/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui";
import { Label } from "@repo/ui";
import { cn } from "@repo/utils";

// Enhanced Myanmar State/Region codes with comprehensive township data
const MYANMAR_STATES = [
  { code: 1, nameEn: "Kachin State", nameMm: "ကချင်ပြည်နယ်", townships: ["မမန", "အလန", "ဗမန", "ဗရန", "တနန", "တပန", "ကမန", "မကန", "မနန", "နမန", "နရတ", "နယန", "ပကန", "ပတန", "ရမန", "သကန", "တဝန", "တဇန", "ဝလန"] },
  { code: 2, nameEn: "Kayah State", nameMm: "ကယားပြည်နယ်", townships: ["ဒမဆ", "ဒရန", "လကန", "လမန", "မဆန", "ပစန", "ရရန"] },
  { code: 3, nameEn: "Kayin State", nameMm: "ကရင်ပြည်နယ်", townships: ["တနတ", "ကမမ", "ကဝန", "မအန", "မလန", "ရကန", "သကန"] },
  { code: 4, nameEn: "Chin State", nameMm: "ချင်းပြည်နယ်", townships: ["ဖလန", "ဖရန", "ဟခန", "ကလန", "လနန", "မတန", "မနန", "မရန", "ပလန", "ထလန", "တးန", "တဇန"] },
  { code: 5, nameEn: "Sagaing Region", nameMm: "စစ်ကိုင်းတိုင်းဒေသကြီး", townships: ["အမန", "အတန", "ဗဒန", "ဗလန", "စကန", "စလန", "ကလန", "ကနန", "ကသန", "ကဝန", "ခမန", "ခဝန", "လရန", "မဂန", "မညန", "မကန", "မမန", "မဇန", "နမန", "နရန", "နတန", "နယန", "ပလန", "စကန", "တလန", "တမန", "တကန", "ဝလန", "ယငန", "ယမန"] },
  { code: 6, nameEn: "Tanintharyi Region", nameMm: "တနင်္သာရီတိုင်းဒေသကြီး", townships: ["ဗခန", "ဒရန", "ကသန", "ကတန", "လမန", "မတန", "ပလန", "တစန", "တမန"] },
  { code: 7, nameEn: "Bago Region", nameMm: "ပဲခူးတိုင်းဒေသကြီး", townships: ["ပဂန", "ဒစန", "ကခန", "ကရန", "လပန", "မဒန", "ညတန", "အကန", "ပရန", "ပမန", "ရမန", "ရညန", "ရကန", "သနန", "သကန", "သကတ", "သညန", "တကန", "သဇန", "ထရန", "ဝန", "ယကန"] },
  { code: 8, nameEn: "Magway Region", nameMm: "မကွေးတိုင်းဒေသကြီး", townships: ["အလန", "စကန", "စမန", "ဂငန", "ကရန", "ခရန", "လကန", "မကန", "မခန", "မနန", "မရန", "မသန", "မးန", "နရန", "နထန", "ပခန", "ပတန", "ပဝန", "စသန", "ပပန", "ပတန", "စလန", "စလန", "သကန", "သလန", "သနန", "တစန", "တမန", "ရတန", "ယစန", "ယငန"] },
  { code: 9, nameEn: "Mandalay Region", nameMm: "မန္တလေးတိုင်းဒေသကြီး", townships: ["အမန", "အမရ", "ခန", "ကမန", "ကယန", "ကလန", "မမန", "မညန", "မတန", "မရန", "နမန", "နခန", "နညန", "နတန", "နပန", "ပခန", "ပတန", "ပလန", "စငန", "စဝန", "တစန", "တလန", "တမန", "တရန", "ရကန", "ယမန"] },
  { code: 10, nameEn: "Mon State", nameMm: "မွန်ပြည်နယ်", townships: ["ဗငန", "စငန", "ကကန", "မတန", "မလန", "ရငန", "သထန", "ပအန", "ယတန", "ယခန"] },
  { code: 11, nameEn: "Rakhine State", nameMm: "ရခိုင်ပြည်နယ်", townships: ["အခန", "အနန", "ဗတန", "စနန", "ကပန", "ကတန", "ခဝန", "ကမန", "မကန", "မတန", "မရန", "မခန", "ပလန", "ပနန", "ရငန", "စတန", "တကန", "တမန", "တရန", "ရကန", "ရခန"] },
  { code: 12, nameEn: "Yangon Region", nameMm: "ရန်ကုန်တိုင်းဒေသကြီး", townships: ["အမန", "ဗဟန", "ဗတန", "စပန", "ဒဂန", "ဒလန", "ကမန", "ကမရ", "ကမင", "ကတန", "ခမန", "လန", "လမန", "လမတ", "မဂတ", "မအပ", "မခန", "မသန", "မးပ", "ပဇတ", "ရမန", "စခန", "သကက", "သမန", "တခက", "တလန", "တမန", "ထလန", "ဝမန", "ရမင", "ယမန"] },
  { code: 13, nameEn: "Shan State", nameMm: "ရှမ်းပြည်နယ်", townships: ["အမန", "ကလန", "ကတန", "ကဆန", "ကဟန", "ကရန", "လငန", "လမန", "မငန", "မရန", "မင", "မတန", "မစန", "မလန", "မပန", "နကန", "နငန", "နမန", "နပန", "နသန", "ပငန", "ပလန", "စကန", "တစန", "တလန", "တမန", "တနန", "ကမန", "တငန", "ရမန"] },
  { code: 14, nameEn: "Ayeyarwady Region", nameMm: "ဧရာဝတီတိုင်းဒေသကြီး", townships: ["ဗငန", "ဒနန", "ဟံသန", "အငန", "ကညန", "ကပန", "ကရန", "ကမန", "ကမင", "လမန", "မအန", "မပန", "မမန", "မဇန", "နရန", "နတန", "ပတန", "ပမန", "ပနန", "ပမင", "စလန", "သပန", "တကန", "တရန", "ဝမန", "ရကန", "ယငန"] }
];

const CITIZENSHIP_TYPES = [
  { code: "N", nameEn: "Citizen", nameMm: "နိုင်ငံသား" },
  { code: "E", nameEn: "Associate Citizen", nameMm: "ဧည့်နိုင်ငံသား" },
  { code: "A", nameEn: "Naturalized Citizen", nameMm: "နိုင်ငံသားပြု" },
  { code: "P", nameEn: "Provisional ID", nameMm: "ယာယီကတ်" }
];

const getTownshipsForState = (stateCode: string): string[] => {
  const state = MYANMAR_STATES.find(s => s.code.toString() === stateCode);
  return state ? state.townships : [];
};

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
  const [availableTownships, setAvailableTownships] = useState<string[]>([]);

  useEffect(() => {
    if (value) {
      setFreeFormValue(value);
      const newParts = parseNrc(value);
      if (!newParts.state && !newParts.township && !newParts.citizenship && !newParts.serial) {
        setIsFreeForm(true);
      } else {
        setParts(newParts);
        if (newParts.state) {
          setAvailableTownships(getTownshipsForState(newParts.state));
        }
      }
    }
  }, [value]);

  useEffect(() => {
    if (parts.state) {
      const townships = getTownshipsForState(parts.state);
      setAvailableTownships(townships);
      if (parts.township && !townships.includes(parts.township)) {
        handlePartChange("township", "");
      }
    } else {
      setAvailableTownships([]);
    }
  }, [parts.state]);

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
              {MYANMAR_STATES.map((state) => (
                <SelectItem key={state.code} value={state.code.toString()}>
                  <span className="font-mono text-xs">{state.code} - {state.nameEn}</span>
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
              {availableTownships.map((township) => (
                <SelectItem key={township} value={township}>
                  <span className="font-mono text-xs">{township}</span>
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
              {CITIZENSHIP_TYPES.map((type) => (
                <SelectItem key={type.code} value={type.code}>
                  <span className="font-mono text-xs">{type.code} - {type.nameEn}</span>
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
