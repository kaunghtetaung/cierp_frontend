"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@repo/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui";
import { Label } from "@repo/ui";
import { Checkbox } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { cn } from "@repo/utils";

// Enhanced Myanmar State/Region codes with comprehensive township data
const MYANMAR_STATES = [
  {
    code: 1,
    nameEn: "Kachin State",
    nameMm: "ကချင်ပြည်နယ်",
    townships: ["မမန", "အလန", "ဗမန", "ဗရန", "တနန", "တပန", "ကမန", "မကန", "မနန", "နမန", "နရတ", "နယန", "ပကန", "ပတန", "ရမန", "သကန", "တဝန", "တဇန", "ဝလန"]
  },
  {
    code: 2,
    nameEn: "Kayah State",
    nameMm: "ကယားပြည်နယ်",
    townships: ["ဒမဆ", "ဒရန", "လကန", "လမန", "မဆန", "ပစန", "ရရန"]
  },
  {
    code: 3,
    nameEn: "Kayin State",
    nameMm: "ကရင်ပြည်နယ်",
    townships: ["တနတ", "ကမမ", "ကဝန", "မအန", "မလန", "ရကန", "သကန"]
  },
  {
    code: 4,
    nameEn: "Chin State",
    nameMm: "ချင်းပြည်နယ်",
    townships: ["ဖလန", "ဖရန", "ဟခန", "ကလန", "လနန", "မတန", "မနန", "မရန", "ပလန", "ထလန", "တးန", "တဇန"]
  },
  {
    code: 5,
    nameEn: "Sagaing Region",
    nameMm: "စစ်ကိုင်းတိုင်းဒေသကြီး",
    townships: ["အမန", "အတန", "ဗဒန", "ဗလန", "စကန", "စလန", "ကလန", "ကနန", "ကသန", "ကဝန", "ခမန", "ခဝန", "လရန", "မဂန", "မညန", "မကန", "မမန", "မဇန", "နမန", "နရန", "နတန", "နယန", "ပလန", "စကန", "တလန", "တမန", "တကန", "ဝလန", "ယငန", "ယမန"]
  },
  {
    code: 6,
    nameEn: "Tanintharyi Region",
    nameMm: "တနင်္သာရီတိုင်းဒေသကြီး",
    townships: ["ဗခန", "ဒရန", "ကသန", "ကတန", "လမန", "မတန", "ပလန", "တစန", "တမန"]
  },
  {
    code: 7,
    nameEn: "Bago Region",
    nameMm: "ပဲခူးတိုင်းဒေသကြီး",
    townships: ["ပဂန", "ဒစန", "ကခန", "ကရန", "လပန", "မဒန", "ညတန", "အကန", "ပရန", "ပမန", "ရမန", "ရညန", "ရကန", "သနန", "သကန", "သကတ", "သညန", "တကန", "သဇန", "ထရန", "ဝန", "ယကန"]
  },
  {
    code: 8,
    nameEn: "Magway Region",
    nameMm: "မကွေးတိုင်းဒေသကြီး",
    townships: ["အလန", "စကန", "စမန", "ဂငန", "ကရန", "ခရန", "လကန", "မကန", "မခန", "မနန", "မရန", "မသန", "မးန", "နရန", "နထန", "ပခန", "ပတန", "ပဝန", "စသန", "ပပန", "ပတန", "စလန", "စလန", "သကန", "သလန", "သနန", "တစန", "တမန", "ရတန", "ယစန", "ယငန"]
  },
  {
    code: 9,
    nameEn: "Mandalay Region",
    nameMm: "မန္တလေးတိုင်းဒေသကြီး",
    townships: ["အမန", "အမရ", "ခန", "ကမန", "ကယန", "ကလန", "မမန", "မညန", "မတန", "မရန", "နမန", "နခန", "နညန", "နတန", "နပန", "ပခန", "ပတန", "ပလန", "စငန", "စဝန", "တစန", "တလန", "တမန", "တရန", "ရကန", "ယမန"]
  },
  {
    code: 10,
    nameEn: "Mon State",
    nameMm: "မွန်ပြည်နယ်",
    townships: ["ဗငန", "စငန", "ကကန", "မတန", "မလန", "ရငန", "သထန", "ပအန", "ယတန", "ယခန"]
  },
  {
    code: 11,
    nameEn: "Rakhine State",
    nameMm: "ရခိုင်ပြည်နယ်",
    townships: ["အခန", "အနန", "ဗတန", "စနန", "ကပန", "ကတန", "ခဝန", "ကမန", "မကန", "မတန", "မရန", "မခန", "ပလန", "ပနန", "ရငန", "စတန", "တကန", "တမန", "တရန", "ရကန", "ရခန"]
  },
  {
    code: 12,
    nameEn: "Yangon Region",
    nameMm: "ရန်ကုန်တိုင်းဒေသကြီး",
    townships: ["အမန", "ဗဟန", "ဗတန", "စပန", "ဒဂန", "ဒလန", "ကမန", "ကမရ", "ကမင", "ကတန", "ခမန", "လန", "လမန", "လမတ", "မဂတ", "မအပ", "မခန", "မသန", "မးပ", "ပဇတ", "ရမန", "စခန", "သကက", "သမန", "တခက", "တလန", "တမန", "ထလန", "ဝမန", "ရမင", "ယမန"]
  },
  {
    code: 13,
    nameEn: "Shan State",
    nameMm: "ရှမ်းပြည်နယ်",
    townships: ["အမန", "ကလန", "ကတန", "ကဆန", "ကဟန", "ကရန", "လငန", "လမန", "မငန", "မရန", "မင", "မတန", "မစန", "မလန", "မပန", "နကန", "နငန", "နမန", "နပန", "နသန", "ပငန", "ပလန", "စကန", "တစန", "တလန", "တမန", "တနန", "ကမန", "တငန", "ရမန"]
  },
  {
    code: 14,
    nameEn: "Ayeyarwady Region",
    nameMm: "ဧရာဝတီတိုင်းဒေသကြီး",
    townships: ["ဗငန", "ဒနန", "ဟံသန", "အငန", "ကညန", "ကပန", "ကရန", "ကမန", "ကမင", "လမန", "မအန", "မပန", "မမန", "မဇန", "နရန", "နတန", "ပတန", "ပမန", "ပနန", "ပမင", "စလန", "သပန", "တကန", "တရန", "ဝမန", "ရကန", "ယငန"]
  }
];

// Citizenship types
const CITIZENSHIP_TYPES = [
  { code: "N", nameEn: "Citizen", nameMm: "နိုင်ငံသား", description: "Naing-ngan (Citizen)" },
  { code: "E", nameEn: "Associate Citizen", nameMm: "ဧည့်နိုင်ငံသား", description: "Associate Citizen" },
  { code: "A", nameEn: "Naturalized Citizen", nameMm: "နိုင်ငံသားပြု", description: "Naturalized Citizen" },
  { code: "P", nameEn: "Provisional ID", nameMm: "ယာယီကတ်", description: "Provisional ID" }
];

// Get townships for selected state
const getTownshipsForState = (stateCode: string): string[] => {
  const state = MYANMAR_STATES.find(s => s.code.toString() === stateCode);
  return state ? state.townships : [];
};

export interface NrcFieldConfig {
  defaultState?: number;
  strictTownshipValidation?: boolean;
  showFormatHelper?: boolean;
  currentLanguage?: string;
  allowFreeForm?: boolean; // Allow custom free-form NRC entry
  hideToggle?: boolean; // Hide the toggle switch (when rendered externally)
}

export interface NrcFieldProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  config?: NrcFieldConfig;
  className?: string;
  onToggleChange?: (isFreeForm: boolean) => void;
  isFreeForm?: boolean;
  fieldName?: string; // Add fieldName to make selectors unique
  isGuardianMirrored?: boolean; // Add guardian mirrored flag
}

interface NrcParts {
  state: string;
  township: string;
  citizenship: string;
  serial: string;
}

// Parse NRC string into components
function parseNrc(nrcString: string): NrcParts {
  if (!nrcString) {
    return { state: "", township: "", citizenship: "", serial: "" };
  }

  // Pattern: 12/MaGaTa(N)123456
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

// Format NRC parts into complete string
function formatNrc(parts: NrcParts): string {
  const { state, township, citizenship, serial } = parts;

  if (!state || !township || !citizenship || !serial) {
    return "";
  }

  return `${state}/${township}(${citizenship})${serial}`;
}

// Validate NRC format with enhanced validation
function validateNrc(nrcString: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!nrcString) {
    errors.push("NRC is required");
    return { isValid: false, errors };
  }

  const parts = parseNrc(nrcString);

  // State validation
  const stateNum = parseInt(parts.state);
  if (!parts.state || isNaN(stateNum) || stateNum < 1 || stateNum > 14) {
    errors.push("Invalid state/region code (must be 1-14)");
  } else {
    // Validate if township exists for the selected state
    const validTownships = getTownshipsForState(parts.state);
    if (parts.township && !validTownships.includes(parts.township)) {
      errors.push("Township code is not valid for the selected state/region");
    }
  }

  // Township validation
  if (!parts.township || parts.township.length < 2) {
    errors.push("Township code is required");
  }

  // Citizenship validation
  if (!parts.citizenship || !["N", "E", "A", "P"].includes(parts.citizenship)) {
    errors.push("Invalid citizenship type (must be N, E, A, or P)");
  }

  // Serial validation
  const serialNum = parseInt(parts.serial);
  if (!parts.serial || isNaN(serialNum) || parts.serial.length > 6 || parts.serial.length < 1) {
    errors.push("Serial number must be 1-6 digits");
  }

  return { isValid: errors.length === 0, errors };
}

export function NrcField({
  value = "",
  onChange,
  placeholder,
  disabled = false,
  error = false,
  config = {},
  className,
  onToggleChange,
  isFreeForm: externalIsFreeForm,
  fieldName = "nrc", // Default fallback for backward compatibility
  isGuardianMirrored = false // Default to false for backward compatibility
}: NrcFieldProps) {
  const {
    defaultState,
    strictTownshipValidation = false,
    showFormatHelper = true,
    currentLanguage = "en",
    allowFreeForm = true, // Default to allowing free form
    hideToggle = false
  } = config;

  const [parts, setParts] = useState<NrcParts>(() => parseNrc(value));
  const [isFocused, setIsFocused] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [internalIsFreeForm, setInternalIsFreeForm] = useState(false);
  const [freeFormValue, setFreeFormValue] = useState(value);
  const [availableTownships, setAvailableTownships] = useState<string[]>([]);
  const [isManuallyCompleted, setIsManuallyCompleted] = useState(false);

  // Use external isFreeForm state if provided, otherwise use internal state
  const isFreeForm = externalIsFreeForm !== undefined ? externalIsFreeForm : internalIsFreeForm;

  // Debug the toggle state
  React.useEffect(() => {
    console.log('🔍 NrcField state update:', {
      externalIsFreeForm,
      internalIsFreeForm,
      finalIsFreeForm: isFreeForm,
      hasOnToggleChange: !!onToggleChange,
      hideToggle,
      allowFreeForm
    });
  }, [externalIsFreeForm, internalIsFreeForm, isFreeForm, onToggleChange, hideToggle, allowFreeForm]);


  // Update parts when external value changes
  useEffect(() => {
    if (value) {
      setFreeFormValue(value);
      const newParts = parseNrc(value);
      // If the value doesn't match structured format, assume it's free form
      if (!newParts.state && !newParts.township && !newParts.citizenship && !newParts.serial) {
        if (externalIsFreeForm === undefined) {
          setInternalIsFreeForm(true);
        }
      } else {
        setParts(newParts);
        // Update available townships based on state
        if (newParts.state) {
          setAvailableTownships(getTownshipsForState(newParts.state));
        }
        // If this is a guardian mirrored field with complete data, mark as manually completed
        if (isGuardianMirrored && newParts.state && newParts.township && newParts.citizenship && newParts.serial) {
          console.log('🔄 Guardian mirrored NRC field auto-completing:', {
            fieldName,
            value,
            parsedParts: newParts,
            isGuardianMirrored
          });
          setIsManuallyCompleted(true);
        }
      }
    }
  }, [value, isGuardianMirrored, fieldName]);

  // Update available townships when state changes
  useEffect(() => {
    if (parts.state) {
      const townships = getTownshipsForState(parts.state);
      setAvailableTownships(townships);
      // Clear township if it's not valid for the new state
      if (parts.township && !townships.includes(parts.township)) {
        handlePartChange("township", "");
      }
    } else {
      setAvailableTownships([]);
    }
  }, [parts.state]);

  // Handle part changes and format output
  const handlePartChange = useCallback((field: keyof NrcParts, newValue: string) => {
    const updatedParts = { ...parts, [field]: newValue };
    setParts(updatedParts);

    // Reset manual completion when user makes changes
    setIsManuallyCompleted(false);

    const formattedNrc = formatNrc(updatedParts);
    const validation = validateNrc(formattedNrc);
    setValidationErrors(validation.errors);

    // Only call onChange with valid complete NRC
    if (validation.isValid) {
      onChange(formattedNrc);
    } else if (formattedNrc === "") {
      onChange("");
    }
  }, [parts, onChange]);

  // Handle state change with auto-focus
  const handleStateChange = (value: string) => {
    handlePartChange("state", value);
    // Auto-focus to township field when state is selected
    if (value && !disabled) {
      setTimeout(() => {
        const townshipTrigger = document.querySelector(`[data-field="${fieldName}-township"]`) as HTMLElement;
        townshipTrigger?.click();
      }, 100);
    }
  };

  // Handle township change with auto-focus
  const handleTownshipChange = (value: string) => {
    handlePartChange("township", value);
    // Auto-focus to citizenship field when township is selected
    if (value && !disabled) {
      setTimeout(() => {
        const citizenshipTrigger = document.querySelector(`[data-field="${fieldName}-citizenship"]`) as HTMLElement;
        citizenshipTrigger?.click();
      }, 100);
    }
  };

  // Handle citizenship change with auto-focus
  const handleCitizenshipChange = (value: string) => {
    handlePartChange("citizenship", value);
    // Auto-focus to serial field when citizenship is selected
    if (value && !disabled) {
      setTimeout(() => {
        const serialInput = document.querySelector(`[data-field="${fieldName}-serial"]`) as HTMLInputElement;
        serialInput?.focus();
      }, 100);
    }
  };

  // Handle serial number change
  const handleSerialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Only allow digits
    value = value.replace(/\D/g, "");

    // Limit to 6 digits
    if (value.length <= 6) {
      handlePartChange("serial", value);
    }
  };

  // Handle free form toggle
  const handleFreeFormToggle = (checked: boolean) => {
    if (onToggleChange) {
      onToggleChange(checked);
    } else {
      setInternalIsFreeForm(checked);
    }

    if (checked) {
      // Switch to free form - use current formatted value or existing free form value
      const currentValue = formattedValue || freeFormValue || value;
      setFreeFormValue(currentValue);
      onChange(currentValue);
    } else {
      // Switch to structured - try to parse the free form value
      const parsedParts = parseNrc(freeFormValue);
      setParts(parsedParts);
      if (parsedParts.state || parsedParts.township || parsedParts.citizenship || parsedParts.serial) {
        const newFormattedValue = formatNrc(parsedParts);
        onChange(newFormattedValue);
      } else {
        onChange("");
      }
    }
  };

  // Handle free form input change
  const handleFreeFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setFreeFormValue(newValue);
    onChange(newValue);
  };

  // Handle manual completion
  const handleComplete = () => {
    if (isDataComplete) {
      setIsManuallyCompleted(true);
      setIsFocused(false);
    }
  };

  // Handle blur event for auto-completion
  const handleBlur = () => {
    if (isDataComplete && isFocused) {
      setIsManuallyCompleted(true);
    }
    setIsFocused(false);
  };

  // Handle key press for Enter key completion
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isDataComplete) {
      setIsManuallyCompleted(true);
      setIsFocused(false);
    }
  };

  const formattedValue = formatNrc(parts);
  const hasErrors = error || validationErrors.length > 0;

  // Calculate completion progress
  const completionProgress = React.useMemo(() => {
    const fields = [parts.state, parts.township, parts.citizenship, parts.serial];
    const completed = fields.filter(Boolean).length;
    return (completed / fields.length) * 100;
  }, [parts]);

  // Check if NRC is complete and valid
  const isDataComplete = completionProgress === 100 && formattedValue && !hasErrors;
  // For guardian mirrored fields, consider them complete if data is complete (no manual completion required)
  // But only if the value is actually a valid formatted NRC
  const isComplete = isDataComplete && (isManuallyCompleted || (isGuardianMirrored && formattedValue));

  return (
    <div className={cn("relative w-full", className)}>
      {/* Toggle Switch positioned to align with label */}
      {allowFreeForm && !hideToggle && (
        <div className="flex justify-end items-center mb-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="nrc-toggle" className="text-xs text-muted-foreground">
              {currentLanguage === "mm" ? "စိတ်ကြိုက်ပုံစံ" : "Custom Format"}
            </Label>
            <button
              id="nrc-toggle"
              type="button"
              onClick={() => handleFreeFormToggle(!isFreeForm)}
              disabled={disabled}
              className={cn(
                "relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isFreeForm ? "bg-primary" : "bg-muted",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <span
                className={cn(
                  "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                  isFreeForm ? "translate-x-3.5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
        </div>
      )}

      {/* Input Fields */}
      {isFreeForm ? (
        /* Free Form Input */
        <div className="space-y-1 w-full">
          <Input
            type="text"
            value={freeFormValue}
            onChange={handleFreeFormChange}
            placeholder={placeholder || (currentLanguage === "mm" ? "NRC အမှတ်ရိုက်ထည့်ပါ" : "Enter NRC number")}
            disabled={disabled}
            className={cn(
              "h-9 text-sm font-mono w-full",
              error && "border-destructive focus:ring-destructive"
            )}
          />
        </div>
      ) : (
        /* Structured Form Input - show when editing, incomplete, or data complete but not manually completed
         For guardian mirrored fields, only show entry mode when focused (user wants to edit) */
        (!isComplete || isFocused || (isDataComplete && !isManuallyCompleted && !isGuardianMirrored)) && (
          <div className="space-y-1 w-full">
            <div className="relative flex items-center gap-1 font-mono text-sm px-2 py-1 transition-all duration-300">
              {/* State Field */}
          <div className="relative">
            <Select
              value={parts.state}
              onValueChange={handleStateChange}
              disabled={disabled}
            >
              <SelectTrigger
                data-field={`${fieldName}-state`}
                data-size="custom"
                className={cn(
                  "!h-6 w-12 border-0 rounded bg-muted py-0.5 text-center font-mono text-sm transition-all duration-150 focus:ring-0 [&>svg]:w-3 [&>svg]:h-3 [&>svg]:transition-transform [&>svg]:duration-150 hover:[&>svg]:scale-110 hover:bg-muted/80",
                  hasErrors && "text-destructive"
                )}
                style={{ height: '26px', paddingLeft: '8px', paddingRight: '4px' }}
              >
                <SelectValue placeholder="xx" className="text-center">
                  {parts.state}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MYANMAR_STATES.map((state) => (
                  <SelectItem key={state.code} value={state.code.toString()}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{state.code}</span>
                      <span className="text-xs">
                        {currentLanguage === "mm" ? state.nameMm : state.nameEn}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Township Field */}
          <div className="relative">
            <Select
              value={parts.township}
              onValueChange={handleTownshipChange}
              disabled={disabled || !parts.state}
            >
              <SelectTrigger
                data-field={`${fieldName}-township`}
                data-size="custom"
                className={cn(
                  "!h-6 w-18 border-0 rounded bg-muted py-0.5 text-center font-mono text-sm transition-all duration-150 focus:ring-0 [&>svg]:w-3 [&>svg]:h-3 [&>svg]:transition-transform [&>svg]:duration-150 hover:[&>svg]:scale-110 hover:bg-muted/80",
                  hasErrors && "text-destructive",
                  !parts.state && "opacity-50"
                )}
                style={{ height: '26px', paddingLeft: '8px', paddingRight: '4px' }}
              >
                <SelectValue placeholder="xxx" className="text-center">
                  {parts.township}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableTownships.map((township) => (
                  <SelectItem key={township} value={township}>
                    <span className="font-mono">{township}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Citizenship Type Field */}
          <div className="relative">
            <Select
              value={parts.citizenship}
              onValueChange={handleCitizenshipChange}
              disabled={disabled}
            >
              <SelectTrigger
                data-field={`${fieldName}-citizenship`}
                data-size="custom"
                className={cn(
                  "!h-6 w-10 border-0 rounded bg-muted py-0.5 text-center font-mono text-sm transition-all duration-150 focus:ring-0 [&>svg]:w-3 [&>svg]:h-3 [&>svg]:transition-transform [&>svg]:duration-150 hover:[&>svg]:scale-110 hover:bg-muted/80",
                  hasErrors && "text-destructive"
                )}
                style={{ height: '26px', paddingLeft: '8px', paddingRight: '4px' }}
              >
                <SelectValue placeholder="x" className="text-center">
                  {parts.citizenship}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CITIZENSHIP_TYPES.map((type) => (
                  <SelectItem key={type.code} value={type.code}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{type.code}</span>
                      <span className="text-xs">
                        {currentLanguage === "mm" ? type.nameMm : type.nameEn}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Serial Number Field */}
          <div className="relative flex items-center gap-2">
            <Input
              type="text"
              value={parts.serial}
              onChange={handleSerialChange}
              onBlur={handleBlur}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              placeholder="xxxxxx"
              disabled={disabled}
              data-field={`${fieldName}-serial`}
              className={cn(
                "!h-6 w-18 border-0 rounded bg-muted py-0.5 text-center font-mono text-sm placeholder:text-muted-foreground focus:ring-0 focus-visible:ring-0 focus:outline-none transition-all duration-150 hover:bg-muted/80",
                hasErrors && "text-destructive"
              )}
              style={{ height: '26px', paddingLeft: '8px', paddingRight: '4px' }}
              maxLength={6}
            />
            {/* Done button when data is complete but not manually completed */}
            {!isFreeForm && isDataComplete && !isManuallyCompleted && (
              <button
                type="button"
                onClick={handleComplete}
                className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
              >
                <IconComponent name="Check" className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Success Indicator - only show when not in edit mode */}
          {isComplete && !isFocused && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
              <IconComponent name="Check" className="w-3 h-3 text-white" />
            </div>
          )}

          {/* Progress Indicator */}
          <div className="absolute bottom-0 left-0 h-0.5 bg-muted rounded-full w-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500 ease-out",
                isComplete
                  ? "bg-gradient-to-r from-green-400 to-green-500"
                  : "bg-gradient-to-r from-primary/60 to-primary"
              )}
              style={{ width: `${completionProgress}%` }}
            />
          </div>
            </div>
        </div>
        )
      )}

      {/* NRC Number Display with Edit Button - only show for structured mode when complete and not focused */}
      {!isFreeForm && isComplete && formattedValue && !isFocused && (
        <div className={cn(
          "relative flex items-center gap-2 px-4 py-2 mb-2 bg-background border rounded-lg transition-all",
          "border-green-200"
        )}>
          <div className="flex-1 font-mono text-sm text-green-800">
            {formattedValue}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-green-600">
              <IconComponent name="CheckCircle" className="w-4 h-4" />
              <span className="text-xs font-medium">
                {currentLanguage === "mm" ? "အပြီးသတ်" : "Complete"}
              </span>
            </div>
            {!isGuardianMirrored && (
              <button
                type="button"
                onClick={() => setIsFocused(true)}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <IconComponent name="Edit" className="w-3 h-3" />
                {currentLanguage === "mm" ? "ပြင်ဆင်" : "Edit"}
              </button>
            )}
          </div>
        </div>
      )}


      {/* Validation Error Messages */}
      {!isFreeForm && validationErrors.length > 0 && (
        <div className="mt-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
          {validationErrors.map((error, index) => (
            <p key={index} className="text-xs text-destructive flex items-center gap-2 animate-in fade-in duration-200" style={{ animationDelay: `${index * 100}ms` }}>
              <IconComponent name="AlertCircle" className="w-3 h-3 flex-shrink-0" />
              <span>{error}</span>
            </p>
          ))}
        </div>
      )}

      {/* Township Validation Helper - only show for structured mode */}
      {!isFreeForm && parts.state && parts.township && availableTownships.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {availableTownships.includes(parts.township) ? (
            <span className="text-green-600 flex items-center gap-1">
              <IconComponent name="CheckCircle" className="w-3 h-3" />
              {currentLanguage === "mm" ? "မှန်ကန်သော မြို့နယ်ကုဒ်" : "Valid township code"}
            </span>
          ) : (
            <span className="text-amber-600 flex items-center gap-1">
              <IconComponent name="AlertTriangle" className="w-3 h-3" />
              {currentLanguage === "mm" ? "မြို့နယ်ကုဒ်ကို စစ်ဆေးပါ" : "Please verify township code"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}