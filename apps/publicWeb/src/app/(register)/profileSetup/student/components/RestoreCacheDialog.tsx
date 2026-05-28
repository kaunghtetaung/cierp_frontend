"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui";
import { Button } from "@repo/ui";
import { AlertCircle, RotateCcw, XCircle } from "lucide-react";
import { useActiveThemeClass } from "@/hooks/use-active-theme-class";

interface RestoreCacheDialogProps {
  open: boolean;
  cacheAge: string;
  currentStep: number;
  totalSteps: number;
  onRestore: () => void;
  onStartFresh: () => void;
}

export function RestoreCacheDialog({
  open,
  cacheAge,
  currentStep,
  totalSteps,
  onRestore,
  onStartFresh,
}: RestoreCacheDialogProps) {
  // The Radix Dialog portals to <body>, which loses the
  // `.theme-um1sf.theme-variant-cardinal` wrapper that `(register)/layout`
  // applies. Re-attach the active theme class on DialogContent so
  // `var(--color-primary)` resolves to the tenant's brand colour.
  const themeClass = useActiveThemeClass();

  return (
    <Dialog open={open} modal>
      <DialogContent
        className={`${themeClass} sm:max-w-md bg-white`}
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-full"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--color-primary, #4C67E1) 14%, transparent)",
              }}
            >
              <AlertCircle
                className="h-6 w-6"
                style={{ color: "var(--color-primary, #4C67E1)" }}
              />
            </div>
            <DialogTitle className="text-xl">Restore Previous Progress?</DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 mt-4">
            We found saved registration data from your previous session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Last saved:</span>
              <span className="text-sm text-gray-900">{cacheAge}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Progress:</span>
              <span className="text-sm text-gray-900">
                Step {currentStep + 1} of {totalSteps}
              </span>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>Would you like to continue where you left off, or start fresh?</p>
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onStartFresh}
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Start Fresh
          </Button>
          <Button
            type="button"
            onClick={onRestore}
            className="flex-1 hover:opacity-90 text-white"
            style={{ backgroundColor: "var(--color-primary, #4C67E1)" }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restore Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
