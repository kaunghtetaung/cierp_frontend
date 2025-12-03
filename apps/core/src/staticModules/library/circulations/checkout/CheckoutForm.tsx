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
import { Input, Label, Textarea } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { Alert, AlertDescription } from "@repo/ui";
import { Badge } from "@repo/ui";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@repo/ui";
import { toast } from "sonner";
import { checkoutBook } from "../actions/circulation.actions";
import { getBorrowerReservations, checkReservationForAccession } from "../actions/reservation.actions";
import { BarcodeScanner } from "../components/BarcodeScanner";
import type { CirculationResponse } from "../types/circulation.types";
import type { Reservation, BorrowerReservationSummary, ReservationCheckResult } from "../types/reservation.types";
import { format } from "date-fns";

interface CheckoutFormProps {
  onSuccess?: (circulation: CirculationResponse) => void;
  onCancel?: () => void;
}

export function CheckoutForm({ onSuccess, onCancel }: CheckoutFormProps) {
  const [libraryCardNumber, setLibraryCardNumber] = useState("");
  const [accessionNo, setAccessionNo] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Reservation states
  const [borrowerReservations, setBorrowerReservations] = useState<BorrowerReservationSummary | null>(null);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [reservationCheck, setReservationCheck] = useState<ReservationCheckResult | null>(null);
  const [isCheckingReservation, setIsCheckingReservation] = useState(false);
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

  // Check reservation when accession number changes
  const checkAccessionReservation = useCallback(async (accession: string) => {
    if (!accession || accession.length < 3) {
      setReservationCheck(null);
      return;
    }

    setIsCheckingReservation(true);
    try {
      const response = await checkReservationForAccession(accession);
      if (response.success && response.data) {
        setReservationCheck(response.data);
      } else {
        setReservationCheck(null);
      }
    } catch (error) {
      console.error("Error checking reservation:", error);
      setReservationCheck(null);
    } finally {
      setIsCheckingReservation(false);
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

  // Debounced effect for accession number
  useEffect(() => {
    const timer = setTimeout(() => {
      if (accessionNo) {
        checkAccessionReservation(accessionNo);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [accessionNo, checkAccessionReservation]);

  // Quick checkout from reservation
  const handleQuickCheckout = (reservation: Reservation) => {
    if (reservation.accessionNo) {
      setAccessionNo(reservation.accessionNo);
      toast.info("Book selected from reservation", {
        description: `${reservation.bibliography?.title}`,
      });
    }
  };

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

    try {
      const response = await checkoutBook(requestData);

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
    setBorrowerReservations(null);
    setReservationCheck(null);
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
                          onClick={() => handleQuickCheckout(reservation)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <IconComponent name="Zap" className="w-3 h-3 mr-1" />
                          Quick
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

          {/* Reservation Check Alert */}
          {isCheckingReservation && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconComponent name="Loader2" className="w-4 h-4 animate-spin" />
              Checking reservation status...
            </div>
          )}

          {reservationCheck?.hasReservation && reservationCheck.reservation && (
            <Alert
              variant={reservationCheck.isForCurrentBorrower ? "default" : "destructive"}
              className={
                reservationCheck.isForCurrentBorrower
                  ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30"
                  : ""
              }
            >
              <IconComponent
                name={reservationCheck.isForCurrentBorrower ? "CheckCircle" : "AlertTriangle"}
                className="w-4 h-4"
              />
              <AlertDescription>
                {reservationCheck.isForCurrentBorrower ? (
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-300">
                      This book is reserved for this borrower
                    </p>
                    <p className="text-sm mt-1">
                      Reservation will be fulfilled upon checkout.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">
                      This book is reserved for another borrower!
                    </p>
                    <p className="text-sm mt-1">
                      Reserved for: {reservationCheck.reservation.borrower?.firstName}{" "}
                      {reservationCheck.reservation.borrower?.lastName} (
                      {reservationCheck.reservation.borrower?.libraryCardNumber})
                    </p>
                    <p className="text-sm mt-1">
                      Please find an available copy or cancel the reservation first.
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

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

    </Card>
  );
}
