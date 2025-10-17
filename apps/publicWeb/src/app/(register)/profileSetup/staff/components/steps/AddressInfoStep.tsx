"use client";

import React, { useState, useEffect } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui";
import { MapPin } from "lucide-react";
import { cn } from "@repo/utils";
import {
  getStateRegions,
  getDistrictsByState,
  getTownshipsByDistrict,
  getTownsByTownship,
  type RegionData,
} from "@/actions/student-registration";

export function AddressInfoStep() {
  const { register, formState: { errors }, control, setValue, watch } = useFormContext();

  // Watch for changes in parent selections
  const stateRegionName = watch("stateRegionName");
  const districtName = watch("districtName");
  const townshipName = watch("townshipName");
  const permanentAddress = watch("permanentAddress");

  // State for location options
  const [stateRegions, setStateRegions] = useState<RegionData[]>([]);
  const [districts, setDistricts] = useState<RegionData[]>([]);
  const [townships, setTownships] = useState<RegionData[]>([]);
  const [towns, setTowns] = useState<RegionData[]>([]);

  // State for "Same as Permanent Address" checkbox
  const [sameAsPermanent, setSameAsPermanent] = useState(false);

  // Loading states
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingTownships, setLoadingTownships] = useState(false);
  const [loadingTowns, setLoadingTowns] = useState(false);

  // Fetch state/regions on mount
  useEffect(() => {
    const fetchStateRegions = async () => {
      console.log("🔵 [AddressInfoStep] Fetching state regions...");
      setLoadingStates(true);
      try {
        const result = await getStateRegions();
        console.log("🔵 [AddressInfoStep] State regions API response:", result);
        if (result.success && result.data) {
          console.log("✅ [AddressInfoStep] State regions loaded:", result.data.length, "items");
          console.log("🔍 [AddressInfoStep] First few state regions:", result.data.slice(0, 3));
          setStateRegions(result.data);
        } else {
          console.error("❌ [AddressInfoStep] State regions API failed:", result);
        }
      } catch (error) {
        console.error("❌ [AddressInfoStep] Error fetching state regions:", error);
      } finally {
        setLoadingStates(false);
        console.log("🔵 [AddressInfoStep] State regions loading completed");
      }
    };

    fetchStateRegions();
  }, []);

  // Fetch districts when state changes
  useEffect(() => {
    console.log("🟡 [AddressInfoStep] State region changed:", stateRegionName);
    if (stateRegionName) {
      const fetchDistricts = async () => {
        console.log("🟡 [AddressInfoStep] Fetching districts for state:", stateRegionName);
        setLoadingDistricts(true);
        try {
          const result = await getDistrictsByState(stateRegionName);
          console.log("🟡 [AddressInfoStep] Districts API response:", result);
          if (result.success && result.data) {
            console.log("✅ [AddressInfoStep] Districts loaded:", result.data.length, "items");
            console.log("🔍 [AddressInfoStep] First few districts:", result.data.slice(0, 3));
            setDistricts(result.data);
          } else {
            console.error("❌ [AddressInfoStep] Districts API failed:", result);
          }
        } catch (error) {
          console.error("❌ [AddressInfoStep] Error fetching districts:", error);
        } finally {
          setLoadingDistricts(false);
          console.log("🟡 [AddressInfoStep] Districts loading completed");
        }
      };

      fetchDistricts();
    } else {
      console.log("🟡 [AddressInfoStep] No state selected, clearing districts");
      setDistricts([]);
      setTownships([]);
      setTowns([]);
    }
  }, [stateRegionName]);

  // Fetch townships when district changes
  useEffect(() => {
    console.log("🟢 [AddressInfoStep] District changed:", districtName);
    if (districtName) {
      const fetchTownships = async () => {
        console.log("🟢 [AddressInfoStep] Fetching townships for district:", districtName);
        setLoadingTownships(true);
        try {
          const result = await getTownshipsByDistrict(districtName);
          console.log("🟢 [AddressInfoStep] Townships API response:", result);
          if (result.success && result.data) {
            console.log("✅ [AddressInfoStep] Townships loaded:", result.data.length, "items");
            console.log("🔍 [AddressInfoStep] First few townships:", result.data.slice(0, 3));
            setTownships(result.data);
          } else {
            console.error("❌ [AddressInfoStep] Townships API failed:", result);
          }
        } catch (error) {
          console.error("❌ [AddressInfoStep] Error fetching townships:", error);
        } finally {
          setLoadingTownships(false);
          console.log("🟢 [AddressInfoStep] Townships loading completed");
        }
      };

      fetchTownships();
    } else {
      console.log("🟢 [AddressInfoStep] No district selected, clearing townships");
      setTownships([]);
      setTowns([]);
    }
  }, [districtName]);

  // Fetch towns when township changes
  useEffect(() => {
    console.log("🟣 [AddressInfoStep] Township changed:", townshipName);
    if (townshipName) {
      const fetchTowns = async () => {
        console.log("🟣 [AddressInfoStep] Fetching towns for township:", townshipName);
        setLoadingTowns(true);
        try {
          const result = await getTownsByTownship(townshipName);
          console.log("🟣 [AddressInfoStep] Towns API response:", result);
          if (result.success && result.data) {
            console.log("✅ [AddressInfoStep] Towns loaded:", result.data.length, "items");
            console.log("🔍 [AddressInfoStep] First few towns:", result.data.slice(0, 3));
            setTowns(result.data);
          } else {
            console.error("❌ [AddressInfoStep] Towns API failed:", result);
          }
        } catch (error) {
          console.error("❌ [AddressInfoStep] Error fetching towns:", error);
        } finally {
          setLoadingTowns(false);
          console.log("🟣 [AddressInfoStep] Towns loading completed");
        }
      };

      fetchTowns();
    } else {
      console.log("🟣 [AddressInfoStep] No township selected, clearing towns");
      setTowns([]);
    }
  }, [townshipName]);

  // Sync current address with permanent address when checkbox is checked
  useEffect(() => {
    if (sameAsPermanent && permanentAddress) {
      console.log("📋 [AddressInfoStep] Copying permanent address to current address:", permanentAddress);
      setValue("currentAddress", permanentAddress);
    }
  }, [sameAsPermanent, permanentAddress, setValue]);

  // Handle "Same as Permanent Address" checkbox change
  const handleSameAsPermanentChange = (checked: boolean) => {
    console.log("☑️ [AddressInfoStep] Same as permanent checkbox:", checked);
    setSameAsPermanent(checked);
    if (checked && permanentAddress) {
      setValue("currentAddress", permanentAddress);
    }
  };

  // ESC key handler for Select fields
  const handleSelectEscKey = (fieldName: string, currentValue: string) => (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && currentValue) {
      e.preventDefault();
      e.stopPropagation();
      setValue(fieldName, "");
    }
  };

  // ESC key handler for input/textarea fields
  const handleInputEscKey = (fieldName: string) => (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLInputElement | HTMLTextAreaElement).value = "";
      setValue(fieldName, "");

      const event = new Event('input', { bubbles: true });
      e.target.dispatchEvent(event);
    } else if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      // Prevent Enter key from submitting the form on input fields
      e.preventDefault();
    }
  };

  return (
    <div className="space-y-6">
      {/* Row 1: State/Region, District, Township */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* State/Region */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            State/Region
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Controller
            name="stateRegionName"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || ""}
                onValueChange={(value) => {
                  console.log("📍 [AddressInfoStep] State/Region selected:", value);
                  field.onChange(value);
                  // Reset dependent fields
                  console.log("🔄 [AddressInfoStep] Resetting dependent fields (district, township, town)");
                  setValue("districtName", "");
                  setValue("townshipName", "");
                  setValue("townName", "");
                }}
              >
                <SelectTrigger
                  className={cn(
                    "w-full bg-white border border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1]",
                    errors.stateRegionName && "border-red-300 focus:border-red-500"
                  )}
                  onKeyDown={handleSelectEscKey("stateRegionName", field.value)}
                >
                  <SelectValue placeholder={loadingStates ? "Loading..." : "Select state/region"} />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300 max-h-[300px]">
                  {stateRegions.map((state) => (
                    <SelectItem key={state.pcode} value={state.displayValue}>
                      {state.displayValue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.stateRegionName && (
            <p className="text-sm text-red-600">{errors.stateRegionName.message as string}</p>
          )}
        </div>

        {/* District */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            District
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Controller
            name="districtName"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || ""}
                onValueChange={(value) => {
                  console.log("📍 [AddressInfoStep] District selected:", value);
                  field.onChange(value);
                  // Reset dependent fields
                  console.log("🔄 [AddressInfoStep] Resetting dependent fields (township, town)");
                  setValue("townshipName", "");
                  setValue("townName", "");
                }}
                disabled={!stateRegionName}
              >
                <SelectTrigger
                  className={cn(
                    "w-full bg-white border border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1]",
                    errors.districtName && "border-red-300 focus:border-red-500",
                    !stateRegionName && "bg-gray-50 cursor-not-allowed"
                  )}
                  onKeyDown={handleSelectEscKey("districtName", field.value)}
                >
                  <SelectValue placeholder={loadingDistricts ? "Loading..." : "Select district"} />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300 max-h-[300px]">
                  {districts.map((district) => (
                    <SelectItem key={district.pcode} value={district.displayValue}>
                      {district.displayValue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.districtName && (
            <p className="text-sm text-red-600">{errors.districtName.message as string}</p>
          )}
        </div>

        {/* Township */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Township
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Controller
            name="townshipName"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || ""}
                onValueChange={(value) => {
                  console.log("📍 [AddressInfoStep] Township selected:", value);
                  field.onChange(value);
                  // Reset dependent field
                  console.log("🔄 [AddressInfoStep] Resetting dependent field (town)");
                  setValue("townName", "");
                }}
                disabled={!districtName}
              >
                <SelectTrigger
                  className={cn(
                    "w-full bg-white border border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1]",
                    errors.townshipName && "border-red-300 focus:border-red-500",
                    !districtName && "bg-gray-50 cursor-not-allowed"
                  )}
                  onKeyDown={handleSelectEscKey("townshipName", field.value)}
                >
                  <SelectValue placeholder={loadingTownships ? "Loading..." : "Select township"} />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300 max-h-[300px]">
                  {townships.map((township) => (
                    <SelectItem key={township.pcode} value={township.displayValue}>
                      {township.displayValue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.townshipName && (
            <p className="text-sm text-red-600">{errors.townshipName.message as string}</p>
          )}
        </div>
      </div>

      {/* Row 2: Town/Village Tract, Ward/Village */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Town/Village Tract */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Town/Village Tract
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Controller
            name="townName"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || ""}
                onValueChange={(value) => {
                  console.log("📍 [AddressInfoStep] Town selected:", value);
                  field.onChange(value);
                }}
                disabled={!townshipName}
              >
                <SelectTrigger
                  className={cn(
                    "w-full bg-white border border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1]",
                    errors.townName && "border-red-300 focus:border-red-500",
                    !townshipName && "bg-gray-50 cursor-not-allowed"
                  )}
                  onKeyDown={handleSelectEscKey("townName", field.value)}
                >
                  <SelectValue placeholder={loadingTowns ? "Loading..." : "Select town"} />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300 max-h-[300px]">
                  {towns.map((town) => (
                    <SelectItem key={town.pcode} value={town.displayValue}>
                      {town.displayValue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.townName && (
            <p className="text-sm text-red-600">{errors.townName.message as string}</p>
          )}
        </div>

        {/* Ward/Village Name */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Ward/Village
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              {...register("wardVillageName")}
              placeholder="Enter ward or village name"
              className={cn(
                "pl-10 border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1]",
                errors.wardVillageName && "border-red-300 focus:border-red-500"
              )}
              onKeyDown={handleInputEscKey("wardVillageName")}
            />
          </div>
          {errors.wardVillageName && (
            <p className="text-sm text-red-600">{errors.wardVillageName.message as string}</p>
          )}
        </div>
      </div>

      {/* Row 3: Permanent Address, Current Address */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Permanent Address */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Permanent Address
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <textarea
            {...register("permanentAddress")}
            rows={3}
            placeholder="Enter full permanent address"
            className={cn(
              "w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 transition-all",
              "border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1]",
              errors.permanentAddress && "border-red-300 focus:border-red-500"
            )}
            onKeyDown={handleInputEscKey("permanentAddress")}
          />
          {errors.permanentAddress && (
            <p className="text-sm text-red-600">{errors.permanentAddress.message as string}</p>
          )}
        </div>

        {/* Current Address */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Current Address
            <span className="text-red-500 ml-1">*</span>
          </Label>

          <textarea
            {...register("currentAddress")}
            rows={3}
            placeholder="Enter full current address"
            className={cn(
              "w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 transition-all",
              "border-gray-300 focus:border-[#4C67E1] focus:ring-[#4C67E1]",
              errors.currentAddress && "border-red-300 focus:border-red-500",
              sameAsPermanent && "bg-gray-50"
            )}
            onKeyDown={handleInputEscKey("currentAddress")}
            disabled={sameAsPermanent}
          />

          {/* Checkbox: Same as Permanent Address */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="sameAsPermanent"
              checked={sameAsPermanent}
              onChange={(e) => handleSameAsPermanentChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#4C67E1] focus:ring-[#4C67E1] cursor-pointer"
            />
            <label
              htmlFor="sameAsPermanent"
              className="text-sm text-gray-600 cursor-pointer select-none"
            >
              Same as Permanent Address
            </label>
          </div>

          {errors.currentAddress && (
            <p className="text-sm text-red-600">{errors.currentAddress.message as string}</p>
          )}
        </div>
      </div>
    </div>
  );
}
