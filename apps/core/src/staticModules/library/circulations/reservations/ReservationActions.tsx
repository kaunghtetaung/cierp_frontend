"use client";

import { useState } from "react";
import { Button, Input, Label, Textarea } from "@repo/ui";
import { Badge } from "@repo/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui";
import { Alert, AlertDescription } from "@repo/ui";
import { Separator } from "@repo/ui";
import { Calendar } from "@repo/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui";
import { CalendarIcon, CheckCircle, XCircle, Clock, User, Book, AlertTriangle } from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "sonner";
import {
  markReservationAsReady,
  cancelReservation,
  extendPickupDeadline,
  assignCopyToReservation,
} from "../actions/reservation.actions";
import type { Reservation, ReservationStatus } from "../types/reservation.types";

interface ReservationActionsProps {
  reservation: Reservation;
  onComplete: () => void;
  onClose: () => void;
}

// Status badge component
function StatusBadge({ status }: { status: ReservationStatus }) {
  const variants: Record<ReservationStatus, { color: string; label: string }> = {
    pending: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", label: "Pending" },
    ready: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", label: "Ready" },
    fulfilled: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", label: "Fulfilled" },
    cancelled: { color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200", label: "Cancelled" },
    expired: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "Expired" },
  };

  const variant = variants[status];

  return (
    <Badge className={variant.color} variant="outline">
      {variant.label}
    </Badge>
  );
}

export function ReservationActions({
  reservation,
  onComplete,
  onClose,
}: ReservationActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [accessionNo, setAccessionNo] = useState(reservation.accessionNo || "");
  const [cancelReason, setCancelReason] = useState("");
  const [newDeadline, setNewDeadline] = useState<Date | undefined>(
    reservation.pickupDeadline ? addDays(new Date(reservation.pickupDeadline), 2) : undefined
  );
  const [notes, setNotes] = useState("");

  const handleMarkReady = async () => {
    if (!accessionNo) {
      toast.error("Accession number is required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await markReservationAsReady(reservation.id, accessionNo);
      if (response.success) {
        toast.success("Reservation marked as ready", {
          description: "Borrower will be notified to pick up the book.",
        });
        onComplete();
      } else {
        toast.error("Failed to mark reservation as ready", {
          description: response.error,
        });
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignCopy = async () => {
    if (!accessionNo) {
      toast.error("Accession number is required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await assignCopyToReservation(reservation.id, accessionNo, notes);
      if (response.success) {
        toast.success("Copy assigned successfully");
        onComplete();
      } else {
        toast.error("Failed to assign copy", {
          description: response.error,
        });
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason) {
      toast.error("Cancellation reason is required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await cancelReservation(reservation.id, cancelReason);
      if (response.success) {
        toast.success("Reservation cancelled");
        onComplete();
      } else {
        toast.error("Failed to cancel reservation", {
          description: response.error,
        });
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtendDeadline = async () => {
    if (!newDeadline) {
      toast.error("New deadline is required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await extendPickupDeadline(
        reservation.id,
        newDeadline.toISOString(),
        notes
      );
      if (response.success) {
        toast.success("Pickup deadline extended");
        onComplete();
      } else {
        toast.error("Failed to extend deadline", {
          description: response.error,
        });
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-4 overflow-y-auto max-h-[calc(100vh-120px)]">
      {/* Reservation Details */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Reservation Details</CardTitle>
            <StatusBadge status={reservation.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Borrower Info */}
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">
                {reservation.borrowerName || `${reservation.borrower?.firstName || ''} ${reservation.borrower?.lastName || ''}`.trim() || '-'}
              </p>
              <p className="text-sm text-muted-foreground">
                {reservation.libraryCardNo || reservation.borrower?.libraryCardNo || reservation.borrower?.libraryCardNumber || '-'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Book Info */}
          <div className="flex items-start gap-3">
            <Book className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">{reservation.bibliography?.title}</p>
              {reservation.bibliography?.author && (
                <p className="text-sm text-muted-foreground">
                  by {reservation.bibliography.author.name}
                </p>
              )}
              {reservation.accessionNo && (
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Assigned: {reservation.accessionNo}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm">
                <span className="text-muted-foreground">Reserved on:</span>{" "}
                {format(new Date(reservation.reservationDate), "PPP")}
              </p>
              {reservation.status === "pending" && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Queue Position:</span>{" "}
                  <span className="font-medium">#{reservation.queuePosition}</span>
                </p>
              )}
              {reservation.pickupDeadline && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Pickup Deadline:</span>{" "}
                  {format(new Date(reservation.pickupDeadline), "PPP")}
                </p>
              )}
              {reservation.estimatedWaitTime && reservation.status === "pending" && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Est. Wait:</span>{" "}
                  {reservation.estimatedWaitTime}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions based on status */}
      {reservation.status === "pending" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Mark as Ready
            </CardTitle>
            <CardDescription>
              Assign a book copy and mark this reservation as ready for pickup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessionNo">Accession Number *</Label>
              <Input
                id="accessionNo"
                placeholder="Scan or enter accession number"
                value={accessionNo}
                onChange={(e) => setAccessionNo(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Enter the accession number of the available book copy
              </p>
            </div>
            <Button
              onClick={handleMarkReady}
              disabled={isLoading || !accessionNo}
              className="w-full"
            >
              {isLoading ? "Processing..." : "Mark as Ready for Pickup"}
            </Button>
          </CardContent>
        </Card>
      )}

      {reservation.status === "ready" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Extend Pickup Deadline
            </CardTitle>
            <CardDescription>
              Give the borrower more time to pick up the book
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>New Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newDeadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newDeadline ? format(newDeadline, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newDeadline}
                    onSelect={setNewDeadline}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isLoading}
                rows={2}
              />
            </div>
            <Button
              onClick={handleExtendDeadline}
              disabled={isLoading || !newDeadline}
              className="w-full"
            >
              {isLoading ? "Processing..." : "Extend Deadline"}
            </Button>
          </CardContent>
        </Card>
      )}

      {(reservation.status === "pending" || reservation.status === "ready") && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <XCircle className="w-5 h-5" />
              Cancel Reservation
            </CardTitle>
            <CardDescription>
              Cancel this reservation. The next person in queue will be notified.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone. The borrower will be notified of the cancellation.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="cancelReason">Reason for Cancellation *</Label>
              <Textarea
                id="cancelReason"
                placeholder="Enter reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                disabled={isLoading}
                rows={2}
              />
            </div>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isLoading || !cancelReason}
              className="w-full"
            >
              {isLoading ? "Processing..." : "Cancel Reservation"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Close button */}
      <Button variant="outline" onClick={onClose} className="w-full">
        Close
      </Button>
    </div>
  );
}
