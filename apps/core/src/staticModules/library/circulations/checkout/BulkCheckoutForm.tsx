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
import { Input, Label, Textarea, Badge } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { toast } from "sonner";
import { bulkCheckoutBooks } from "../actions/circulation.actions";
import { BarcodeScanner } from "../components/BarcodeScanner";
import type { BulkCheckoutResponse } from "../types/circulation.types";

interface BulkCheckoutFormProps {
  onSuccess?: (result: BulkCheckoutResponse) => void;
  onCancel?: () => void;
}

export function BulkCheckoutForm({
  onSuccess,
  onCancel,
}: BulkCheckoutFormProps) {
  const [libraryCardNumber, setLibraryCardNumber] = useState("");
  const [accessionNos, setAccessionNos] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleAddBook = () => {
    const trimmed = currentInput.trim();

    if (!trimmed) {
      toast.error("Please enter an accession number");
      return;
    }

    if (accessionNos.includes(trimmed)) {
      toast.error("This book is already in the list");
      return;
    }

    setAccessionNos([...accessionNos, trimmed]);
    setCurrentInput("");
    toast.success("Book added to checkout list");
  };

  const handleRemoveBook = (accessionNo: string) => {
    setAccessionNos(accessionNos.filter((no) => no !== accessionNo));
    toast.info("Book removed from list");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddBook();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!libraryCardNumber) {
      toast.error("Please enter library card number");
      return;
    }

    if (accessionNos.length === 0) {
      toast.error("Please add at least one book");
      return;
    }

    setIsLoading(true);

    try {
      const response = await bulkCheckoutBooks({
        libraryCardNumber,
        accessionNos,
        notes: notes || undefined,
      });

      if (response.success && response.data) {
        const { successCount, failureCount, status } = response.data;

        if (status === "all_success") {
          toast.success(`All ${successCount} books checked out successfully!`);
        } else if (status === "partial_success") {
          toast.warning(
            `Partial success: ${successCount} succeeded, ${failureCount} failed`,
            {
              description: "Check the results for details",
            }
          );
        } else {
          toast.error(`All ${failureCount} checkouts failed`);
        }

        // Reset form
        setLibraryCardNumber("");
        setAccessionNos([]);
        setCurrentInput("");
        setNotes("");

        // Call success callback
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        toast.error("Bulk checkout failed", {
          description:
            response.error || "An error occurred during bulk checkout",
        });
      }
    } catch (error) {
      console.error("Bulk checkout error:", error);
      toast.error("Bulk checkout failed", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setLibraryCardNumber("");
    setAccessionNos([]);
    setCurrentInput("");
    setNotes("");
    if (onCancel) {
      onCancel();
    }
  };

  const handleScan = (barcode: string) => {
    const trimmed = barcode.trim();

    if (accessionNos.includes(trimmed)) {
      toast.error("This book is already in the list");
      return;
    }

    setAccessionNos([...accessionNos, trimmed]);
    setIsScannerOpen(false);
    toast.success("Book scanned and added", {
      description: barcode,
    });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconComponent name="BookMarked" className="w-5 h-5" />
          Bulk Checkout
        </CardTitle>
        <CardDescription>
          Check out multiple books to a single borrower
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Library Card Number */}
          <div className="space-y-2">
            <Label htmlFor="bulk-libraryCardNumber">
              Library Card Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bulk-libraryCardNumber"
              type="text"
              placeholder="Enter library card number"
              value={libraryCardNumber}
              onChange={(e) => setLibraryCardNumber(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Book List */}
          <div className="space-y-2">
            <Label>
              Books to Checkout <span className="text-destructive">*</span>
            </Label>

            {/* Add Book Input */}
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Scan or enter accession number"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="flex-1"
                autoFocus
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddBook}
                disabled={isLoading || !currentInput.trim()}
              >
                <IconComponent name="Plus" className="w-4 h-4 mr-2" />
                Add
              </Button>
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

            {/* Book List Display */}
            {accessionNos.length > 0 ? (
              <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">
                    {accessionNos.length}{" "}
                    {accessionNos.length === 1 ? "book" : "books"} in list
                  </p>
                  <Badge variant="secondary">{accessionNos.length}</Badge>
                </div>
                {accessionNos.map((accessionNo, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded hover:bg-muted/80"
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent
                        name="Book"
                        className="w-4 h-4 text-muted-foreground"
                      />
                      <span className="font-mono text-sm">{accessionNo}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBook(accessionNo)}
                      disabled={isLoading}
                    >
                      <IconComponent name="X" className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                <IconComponent
                  name="BookOpen"
                  className="w-12 h-12 mx-auto mb-2 opacity-50"
                />
                <p className="text-sm">No books added yet</p>
                <p className="text-xs">Scan or enter accession numbers above</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="bulk-notes">Notes (Optional)</Label>
            <Textarea
              id="bulk-notes"
              placeholder="Add notes for all checkouts..."
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
            disabled={isLoading || !libraryCardNumber || accessionNos.length === 0}
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
                Checkout All ({accessionNos.length})
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
        description="Scan multiple books quickly - each scan will be added to your list"
      />
    </Card>
  );
}
