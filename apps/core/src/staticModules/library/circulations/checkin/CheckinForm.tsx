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
import { checkinBook } from "../actions/circulation.actions";
import { BarcodeScanner } from "../components/BarcodeScanner";
import type { CirculationResponse } from "../types/circulation.types";

interface CheckinFormProps {
  onSuccess?: (circulation: CirculationResponse) => void;
  onCancel?: () => void;
}

export function CheckinForm({ onSuccess, onCancel }: CheckinFormProps) {
  const [accessionNo, setAccessionNo] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [result, setResult] = useState<CirculationResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessionNo) {
      toast.error("Please enter accession number");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await checkinBook({
        accessionNo,
        notes: notes || undefined,
      });

      if (response.success && response.data) {
        const data = response.data;

        // Check if there's a fine
        if (data.fineAmount > 0) {
          toast.warning("Book returned with overdue fine!", {
            description: `Fine: $${(data.fineAmount / 100).toFixed(2)} for ${data.overdueDays} overdue days`,
          });
        } else {
          toast.success("Book returned successfully!", {
            description: `${data.bibliography?.title || "Book"} returned by ${data.borrower?.firstName} ${data.borrower?.lastName}`,
          });
        }

        // Show result details
        setResult(data);

        // Reset form
        setAccessionNo("");
        setNotes("");

        // Call success callback
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        toast.error("Checkin failed", {
          description: response.error || "An error occurred during checkin",
        });
      }
    } catch (error) {
      console.error("Checkin error:", error);
      toast.error("Checkin failed", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAccessionNo("");
    setNotes("");
    setResult(null);
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
    <div className="space-y-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconComponent name="BookCheck" className="w-5 h-5" />
            Check In Book
          </CardTitle>
          <CardDescription>Return a checked-out book</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
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
                placeholder="Add any notes about this return..."
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
              Clear
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !accessionNo}
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
                  Check In
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
      </Card>

      {/* Result Display */}
      {result && (
        <Card className="w-full max-w-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <IconComponent name="CheckCircle" className="w-5 h-5 text-green-600" />
              Return Successful
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Book Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Book Title</p>
                <p className="text-sm font-semibold">{result.bibliography?.title || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Accession No</p>
                <p className="text-sm font-mono">{result.accessionNo}</p>
              </div>
            </div>

            {/* Borrower Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Borrower</p>
                <p className="text-sm font-semibold">
                  {result.borrower?.firstName} {result.borrower?.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Library Card No</p>
                <p className="text-sm font-mono">{result.borrower?.libraryCardNo || "N/A"}</p>
              </div>
            </div>

            {/* Checkout/Return Dates */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Checkout Date</p>
                <p className="text-sm">{new Date(result.checkoutDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                <p className="text-sm">{new Date(result.dueDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Return Date</p>
                <p className="text-sm">{result.checkinDate ? new Date(result.checkinDate).toLocaleDateString() : "N/A"}</p>
              </div>
            </div>

            {/* Fine Information */}
            {result.overdueDays > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
                <div className="flex gap-2">
                  <IconComponent name="AlertCircle" className="h-5 w-5 text-red-600" />
                  <div className="flex-1 space-y-2">
                    <p className="font-semibold text-red-900 dark:text-red-100">Overdue Fine Details</p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-red-800 dark:text-red-200">
                      <div>
                        <span className="text-muted-foreground">Overdue Days:</span>
                        <span className="ml-2 font-medium">{result.overdueDays} days</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fine Amount:</span>
                        <span className="ml-2 font-medium">${(result.fineAmount / 100).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fine Per Day:</span>
                        <span className="ml-2 font-medium">${(result.finePerDay / 100).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Grace Period:</span>
                        <span className="ml-2 font-medium">{result.gracePeriodDays} days</span>
                      </div>
                    </div>
                    {result.invoiceIssued && result.invoiceNo && (
                      <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-800 dark:text-red-200">
                          <span className="text-muted-foreground">Invoice No:</span>
                          <span className="ml-2 font-mono font-medium">{result.invoiceNo}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {result.overdueDays === 0 && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20">
                <div className="flex gap-2">
                  <IconComponent name="CheckCircle" className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Book returned on time. No fines charged.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
