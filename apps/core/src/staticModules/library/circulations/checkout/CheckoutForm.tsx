"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import { Input, Label, Textarea } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { toast } from "sonner";
import { checkoutBook } from "../actions/circulation.actions";
import { BarcodeScanner } from "../components/BarcodeScanner";
import type { CirculationResponse } from "../types/circulation.types";
import { isDebugEnabled } from "@/lib/env";

interface CheckoutFormProps {
  onSuccess?: (circulation: CirculationResponse) => void;
  onCancel?: () => void;
}

interface DebugInfo {
  requestUrl: string;
  requestData: any;
  responseData: any;
  error: string | null;
  timestamp: string;
}

export function CheckoutForm({ onSuccess, onCancel }: CheckoutFormProps) {
  const [libraryCardNumber, setLibraryCardNumber] = useState("");
  const [accessionNo, setAccessionNo] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!libraryCardNumber || !accessionNo) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    // Prepare request data
    const requestData = {
      libraryCardNumber,
      accessionNo,
      notes: notes || undefined,
    };

    // Set initial debug info
    setDebugInfo({
      requestUrl: "Loading...",
      requestData: requestData,
      responseData: null,
      error: null,
      timestamp: new Date().toISOString(),
    });

    try {
      const response = await checkoutBook(requestData);

      // Update debug info with response and actual URL
      setDebugInfo({
        requestUrl: (response as any).debugUrl || "URL not available",
        requestData: requestData,
        responseData: response,
        error: response.success ? null : (response.error || "Unknown error"),
        timestamp: new Date().toISOString(),
      });

      if (response.success && response.data) {
        toast.success("Book checked out successfully!", {
          description: `${
            response.data.bibliography?.title || "Book"
          } checked out to ${response.data.borrower?.firstName} ${
            response.data.borrower?.lastName
          }`,
        });

        // Reset form
        setLibraryCardNumber("");
        setAccessionNo("");
        setNotes("");

        // Call success callback
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        toast.error("Checkout failed", {
          description: response.error || "An error occurred during checkout",
        });
      }
    } catch (error) {
      console.error("Checkout error:", error);

      // Update debug info with caught error
      setDebugInfo((prev) => ({
        requestUrl: prev?.requestUrl || "URL not available",
        requestData: requestData,
        responseData: null,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      }));

      toast.error("Checkout failed", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setLibraryCardNumber("");
    setAccessionNo("");
    setNotes("");
    if (onCancel) {
      onCancel();
    }
  };

  const handleScan = (barcode: string) => {
    setAccessionNo(barcode);
    setIsScannerOpen(false);
    toast.success("Barcode scanned", {
      description: barcode,
    });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconComponent name="BookOpen" className="w-5 h-5" />
          Checkout Book
        </CardTitle>
        <CardDescription>Check out a single book to a borrower</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Library Card Number */}
          <div className="space-y-2">
            <Label htmlFor="libraryCardNumber">
              Library Card Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="libraryCardNumber"
              type="text"
              placeholder="Enter library card number"
              value={libraryCardNumber}
              onChange={(e) => setLibraryCardNumber(e.target.value)}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Enter the borrower's library card number
            </p>
          </div>

          {/* Accession Number */}
          <div className="space-y-2">
            <Label htmlFor="accessionNo">
              Accession Number <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="accessionNo"
                type="text"
                placeholder="Scan or enter accession number"
                value={accessionNo}
                onChange={(e) => setAccessionNo(e.target.value)}
                required
                disabled={isLoading}
                className="flex-1"
                autoFocus
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={isLoading}
                onClick={() => setIsScannerOpen(true)}
                title="Scan barcode"
              >
                <IconComponent name="Camera" className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Unique book copy identifier
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this checkout..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between mt-4 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
          >
            <IconComponent name="X" className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !libraryCardNumber || !accessionNo}
          >
            {isLoading ? (
              <>
                <IconComponent
                  name="Loader2"
                  className="w-4 h-4 mr-2 animate-spin"
                />
                Processing...
              </>
            ) : (
              <>
                <IconComponent name="Check" className="w-4 h-4 mr-2" />
                Checkout
              </>
            )}
          </Button>
        </CardFooter>
      </form>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
        title="Scan Accession Number"
        description="Position the barcode within the camera frame"
      />

      {/* Debug Information Panel - Only show in development */}
      {isDebugEnabled() && debugInfo && (
        <Card className="mt-4 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-900 dark:text-orange-100">
              <IconComponent name="Bug" className="w-4 h-4" />
              Debug Information
            </CardTitle>
            <CardDescription className="text-xs">
              Request and response details for debugging
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Request URL */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-orange-900 dark:text-orange-100">
                Request URL:
              </div>
              <div className="p-2 bg-white dark:bg-gray-900 rounded border border-orange-200 dark:border-orange-800">
                <code className="text-xs text-orange-800 dark:text-orange-200">
                  {debugInfo.requestUrl}
                </code>
              </div>
            </div>

            {/* Request Data */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-orange-900 dark:text-orange-100">
                Request Data:
              </div>
              <div className="p-2 bg-white dark:bg-gray-900 rounded border border-orange-200 dark:border-orange-800 max-h-32 overflow-auto">
                <pre className="text-xs text-orange-800 dark:text-orange-200">
                  {JSON.stringify(debugInfo.requestData, null, 2)}
                </pre>
              </div>
            </div>

            {/* Response Data */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-orange-900 dark:text-orange-100">
                Response Data:
              </div>
              <div className="p-2 bg-white dark:bg-gray-900 rounded border border-orange-200 dark:border-orange-800 max-h-48 overflow-auto">
                <pre className="text-xs text-orange-800 dark:text-orange-200">
                  {debugInfo.responseData
                    ? JSON.stringify(debugInfo.responseData, null, 2)
                    : "No response yet..."}
                </pre>
              </div>
            </div>

            {/* Error */}
            {debugInfo.error && (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-red-900 dark:text-red-100">
                  Error:
                </div>
                <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-800">
                  <code className="text-xs text-red-800 dark:text-red-200">
                    {debugInfo.error}
                  </code>
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-orange-600 dark:text-orange-400">
              Timestamp: {new Date(debugInfo.timestamp).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}
    </Card>
  );
}
