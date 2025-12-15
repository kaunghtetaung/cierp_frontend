"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Alert, AlertDescription } from "@repo/ui";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@repo/ui";
import { toast } from "sonner";
import { bulkCheckoutBooks } from "../actions/circulation.actions";
import { getBorrowerReservations, checkReservationForAccession } from "../actions/reservation.actions";
import { BarcodeScanner } from "../components/BarcodeScanner";
import type { BulkCheckoutResponse } from "../types/circulation.types";
import type { Reservation, BorrowerReservationSummary, ReservationCheckResult } from "../types/reservation.types";
import { format } from "date-fns";

interface BulkCheckoutFormProps {
  onSuccess?: (result: BulkCheckoutResponse) => void;
  onCancel?: () => void;
}

// Track reservation status for each accession number
interface BookWithReservation {
  accessionNo: string;
  reservationCheck?: ReservationCheckResult;
  isChecking?: boolean;
}

export function BulkCheckoutForm({
  onSuccess,
  onCancel,
}: BulkCheckoutFormProps) {
  const [libraryCardNumber, setLibraryCardNumber] = useState("");
  const [books, setBooks] = useState<BookWithReservation[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Reservation states
  const [borrowerReservations, setBorrowerReservations] = useState<BorrowerReservationSummary | null>(null);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [showReservations, setShowReservations] = useState(true);

  // Fetch borrower reservations when library card number changes
  const fetchBorrowerReservations = useCallback(async (cardNumber: string) => {
    if (!cardNumber || cardNumber.length < 3) {
      setBorrowerReservations(null);
      return;
    }

    setIsLoadingReservations(true);

    try {
      const response = await getBorrowerReservations(cardNumber);

      if (response.success && response.data) {
        setBorrowerReservations(response.data);
        // Auto-show if there are ready reservations
        if (response.data.readyCount > 0) {
          setShowReservations(true);
        }
      } else {
        setBorrowerReservations(null);
      }
    } catch (error) {
      console.error("Error fetching borrower reservations:", error);
      setBorrowerReservations(null);
    } finally {
      setIsLoadingReservations(false);
    }
  }, []);

  // Check reservation for a specific accession number
  const checkAccessionReservation = useCallback(async (accessionNo: string): Promise<ReservationCheckResult | null> => {
    try {
      const response = await checkReservationForAccession(accessionNo);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error checking reservation:", error);
      return null;
    }
  }, []);

  // Debounced effect for library card number
  useEffect(() => {
    const timer = setTimeout(() => {
      if (libraryCardNumber) {
        fetchBorrowerReservations(libraryCardNumber);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [libraryCardNumber, fetchBorrowerReservations]);

  // Quick add from reservation
  const handleQuickAddFromReservation = (reservation: Reservation) => {
    if (reservation.accessionNo) {
      const trimmed = reservation.accessionNo.trim();

      if (books.some((b) => b.accessionNo === trimmed)) {
        toast.error("This book is already in the list");
        return;
      }

      // Add with reservation info already known
      setBooks([
        ...books,
        {
          accessionNo: trimmed,
          reservationCheck: {
            hasReservation: true,
            reservation,
            isForCurrentBorrower: true,
          },
          isChecking: false,
        },
      ]);

      toast.success("Reserved book added to checkout list", {
        description: reservation.bibliography?.title,
      });
    }
  };

  // Get accession numbers array for submission
  const accessionNos = books.map((b) => b.accessionNo);

  // Check if any book has a reservation conflict
  const hasReservationConflict = books.some(
    (b) => b.reservationCheck?.hasReservation && !b.reservationCheck?.isForCurrentBorrower
  );

  const handleAddBook = async () => {
    const trimmed = currentInput.trim();

    if (!trimmed) {
      toast.error("Please enter an accession number");
      return;
    }

    if (books.some((b) => b.accessionNo === trimmed)) {
      toast.error("This book is already in the list");
      return;
    }

    // Add book with checking state
    const newBook: BookWithReservation = {
      accessionNo: trimmed,
      isChecking: true,
    };

    setBooks((prev) => [...prev, newBook]);
    setCurrentInput("");

    // Check reservation status
    const reservationCheck = await checkAccessionReservation(trimmed);

    setBooks((prev) =>
      prev.map((b) =>
        b.accessionNo === trimmed
          ? { ...b, reservationCheck: reservationCheck || undefined, isChecking: false }
          : b
      )
    );

    if (reservationCheck?.hasReservation && !reservationCheck.isForCurrentBorrower) {
      toast.warning("This book is reserved for another borrower", {
        description: `Reserved for: ${reservationCheck.reservation?.borrower?.firstName} ${reservationCheck.reservation?.borrower?.lastName}`,
      });
    } else {
      toast.success("Book added to checkout list");
    }
  };

  const handleRemoveBook = (accessionNo: string) => {
    setBooks((prev) => prev.filter((b) => b.accessionNo !== accessionNo));
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

    if (books.length === 0) {
      toast.error("Please add at least one book");
      return;
    }

    // Warn about reservation conflicts
    if (hasReservationConflict) {
      const conflictBooks = books.filter(
        (b) => b.reservationCheck?.hasReservation && !b.reservationCheck?.isForCurrentBorrower
      );
      toast.warning(
        `${conflictBooks.length} book(s) are reserved for other borrowers. They may fail to checkout.`
      );
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
        setBooks([]);
        setCurrentInput("");
        setNotes("");
        setBorrowerReservations(null);

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
    setBooks([]);
    setCurrentInput("");
    setNotes("");
    setBorrowerReservations(null);
    if (onCancel) {
      onCancel();
    }
  };

  const handleScan = async (barcode: string) => {
    const trimmed = barcode.trim();

    if (books.some((b) => b.accessionNo === trimmed)) {
      toast.error("This book is already in the list");
      return;
    }

    // Add book with checking state
    const newBook: BookWithReservation = {
      accessionNo: trimmed,
      isChecking: true,
    };

    setBooks((prev) => [...prev, newBook]);
    setIsScannerOpen(false);

    // Check reservation status
    const reservationCheck = await checkAccessionReservation(trimmed);

    setBooks((prev) =>
      prev.map((b) =>
        b.accessionNo === trimmed
          ? { ...b, reservationCheck: reservationCheck || undefined, isChecking: false }
          : b
      )
    );

    if (reservationCheck?.hasReservation && !reservationCheck.isForCurrentBorrower) {
      toast.warning("Scanned book is reserved for another borrower", {
        description: barcode,
      });
    } else {
      toast.success("Book scanned and added", {
        description: barcode,
      });
    }
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

          {/* Borrower Reservations Alert */}
          {isLoadingReservations && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconComponent name="Loader2" className="w-4 h-4 animate-spin" />
              Checking reservations...
            </div>
          )}

          {borrowerReservations && (borrowerReservations.readyCount > 0 || borrowerReservations.pendingCount > 0) && (
            <Collapsible open={showReservations} onOpenChange={setShowReservations}>
              <Alert className={borrowerReservations.readyCount > 0 ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30" : "border-blue-300 dark:border-blue-700"}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <IconComponent name="CalendarClock" className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="font-medium">
                        Active Reservations
                        {borrowerReservations.readyCount > 0 && (
                          <Badge variant="default" className="ml-2 bg-green-600">
                            {borrowerReservations.readyCount} Ready
                          </Badge>
                        )}
                        {borrowerReservations.pendingCount > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {borrowerReservations.pendingCount} Pending
                          </Badge>
                        )}
                      </AlertDescription>
                    </div>
                    <IconComponent
                      name={showReservations ? "ChevronUp" : "ChevronDown"}
                      className="w-4 h-4"
                    />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-3 space-y-2">
                  {/* Ready for Pickup - Priority */}
                  {borrowerReservations.readyForPickup.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <div>
                        <p className="font-medium text-sm">{reservation.bibliography?.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="default" className="text-xs bg-green-600">
                            Ready for Pickup
                          </Badge>
                          {reservation.accessionNo && (
                            <span className="text-xs text-muted-foreground">
                              Accession: {reservation.accessionNo}
                            </span>
                          )}
                        </div>
                        {reservation.pickupDeadline && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Pickup by: {format(new Date(reservation.pickupDeadline), "PPP")}
                          </p>
                        )}
                      </div>
                      {reservation.accessionNo && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleQuickAddFromReservation(reservation)}
                          disabled={books.some((b) => b.accessionNo === reservation.accessionNo)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <IconComponent name="Plus" className="w-3 h-3 mr-1" />
                          {books.some((b) => b.accessionNo === reservation.accessionNo) ? "Added" : "Add"}
                        </Button>
                      )}
                    </div>
                  ))}

                  {/* Pending Reservations */}
                  {borrowerReservations.activeReservations
                    .filter((r) => r.status === "pending")
                    .slice(0, 3)
                    .map((reservation) => (
                      <div
                        key={reservation.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium text-sm">{reservation.bibliography?.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              Queue #{reservation.queuePosition}
                            </Badge>
                            {reservation.estimatedWaitTime && (
                              <span className="text-xs text-muted-foreground">
                                ~{reservation.estimatedWaitTime}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </CollapsibleContent>
              </Alert>
            </Collapsible>
          )}

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
            {books.length > 0 ? (
              <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">
                    {books.length}{" "}
                    {books.length === 1 ? "book" : "books"} in list
                  </p>
                  <div className="flex items-center gap-2">
                    {hasReservationConflict && (
                      <Badge variant="destructive" className="text-xs">
                        <IconComponent name="AlertTriangle" className="w-3 h-3 mr-1" />
                        Conflicts
                      </Badge>
                    )}
                    <Badge variant="secondary">{books.length}</Badge>
                  </div>
                </div>
                {books.map((book, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded hover:bg-muted/80 ${
                      book.reservationCheck?.hasReservation && !book.reservationCheck?.isForCurrentBorrower
                        ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                        : book.reservationCheck?.isForCurrentBorrower
                        ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                        : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {book.isChecking ? (
                        <IconComponent
                          name="Loader2"
                          className="w-4 h-4 text-muted-foreground animate-spin"
                        />
                      ) : book.reservationCheck?.hasReservation && !book.reservationCheck?.isForCurrentBorrower ? (
                        <IconComponent
                          name="AlertTriangle"
                          className="w-4 h-4 text-red-500"
                        />
                      ) : book.reservationCheck?.isForCurrentBorrower ? (
                        <IconComponent
                          name="CheckCircle"
                          className="w-4 h-4 text-green-500"
                        />
                      ) : (
                        <IconComponent
                          name="Book"
                          className="w-4 h-4 text-muted-foreground"
                        />
                      )}
                      <div>
                        <span className="font-mono text-sm">{book.accessionNo}</span>
                        {book.reservationCheck?.hasReservation && !book.reservationCheck?.isForCurrentBorrower && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            Reserved for: {book.reservationCheck.reservation?.borrower?.firstName}{" "}
                            {book.reservationCheck.reservation?.borrower?.lastName}
                          </p>
                        )}
                        {book.reservationCheck?.isForCurrentBorrower && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Reserved for this borrower
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBook(book.accessionNo)}
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
            disabled={isLoading || !libraryCardNumber || books.length === 0}
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
                Checkout All ({books.length})
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