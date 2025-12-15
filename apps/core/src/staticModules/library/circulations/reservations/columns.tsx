"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@repo/ui";
import { Badge } from "@repo/ui";
import { MoreHorizontal, CheckCircle, XCircle, Eye, Clock, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui";
import { format, differenceInDays, isPast } from "date-fns";
import type { Reservation, ReservationStatus } from "../types/reservation.types";

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

// Queue position badge
function QueueBadge({ position }: { position: number }) {
  return (
    <Badge variant="secondary" className="font-mono">
      #{position}
    </Badge>
  );
}

// Pickup deadline display
function PickupDeadline({ deadline, status }: { deadline?: string; status: ReservationStatus }) {
  if (!deadline || status !== "ready") return <span className="text-muted-foreground">-</span>;

  try {
    const deadlineDate = new Date(deadline);
    const daysLeft = differenceInDays(deadlineDate, new Date());
    const isExpired = isPast(deadlineDate);
    const isUrgent = daysLeft <= 1 && !isExpired;

    return (
      <div className="flex flex-col gap-1">
        <span className={isUrgent || isExpired ? "text-red-600 dark:text-red-400 font-medium" : ""}>
          {format(deadlineDate, "MMM d, yyyy")}
        </span>
        {isExpired ? (
          <Badge variant="destructive" className="text-xs w-fit">
            Expired
          </Badge>
        ) : isUrgent ? (
          <Badge variant="destructive" className="text-xs w-fit">
            {daysLeft === 0 ? "Today!" : "Tomorrow!"}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">
            {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
          </span>
        )}
      </div>
    );
  } catch {
    return <span className="text-muted-foreground">-</span>;
  }
}

// Format date
function formatDate(dateString: string | undefined): string {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "MMM d, yyyy");
  } catch {
    return "-";
  }
}

export interface ReservationColumnsProps {
  onViewDetails?: (reservation: Reservation) => void;
  onMarkReady?: (reservation: Reservation) => void;
  onCancel?: (reservation: Reservation) => void;
  currentPage?: number;
  pageSize?: number;
}

export function getReservationColumns({
  onViewDetails,
  onMarkReady,
  onCancel,
  currentPage = 1,
  pageSize = 10,
}: ReservationColumnsProps = {}): ColumnDef<Reservation>[] {
  return [
    {
      id: "sr",
      header: "No.",
      cell: ({ row }) => {
        const offset = (currentPage - 1) * pageSize;
        return <div className="text-center">{offset + row.index + 1}</div>;
      },
      enableSorting: false,
      enableHiding: false,
      size: 60,
    },
    {
      id: "queuePosition",
      header: "Queue",
      accessorKey: "queuePosition",
      cell: ({ row }) => {
        const status = row.original.status;
        // Only show queue position for pending status
        if (status === "pending") {
          return <QueueBadge position={row.original.queuePosition} />;
        }
        return <span className="text-muted-foreground">-</span>;
      },
      size: 80,
    },
    {
      id: "borrower",
      header: "Borrower",
      cell: ({ row }) => {
        const borrowerName = row.original.borrowerName;
        const libraryCardNo = row.original.libraryCardNo || row.original.borrower?.libraryCardNo;

        return borrowerName ? (
          <div>
            <div className="font-medium">{borrowerName}</div>
            {libraryCardNo && (
              <div className="text-xs text-muted-foreground">
                {libraryCardNo}
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
      size: 180,
    },
    {
      id: "book",
      header: "Book Title",
      cell: ({ row }) => {
        const book = row.original.bibliography;
        const accessionNo = row.original.accessionNo;
        return book ? (
          <div>
            <div className="font-medium line-clamp-1">{book.title}</div>
            {book.author && (
              <div className="text-xs text-muted-foreground">
                by {book.author.name}
              </div>
            )}
            {accessionNo && (
              <div className="text-xs text-blue-600 dark:text-blue-400">
                Assigned: {accessionNo}
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
      size: 220,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      size: 100,
    },
    {
      accessorKey: "reservationDate",
      header: "Reserved On",
      cell: ({ row }) => formatDate(row.original.reservationDate),
      size: 120,
    },
    {
      id: "pickupDeadline",
      header: "Pickup Deadline",
      cell: ({ row }) => (
        <PickupDeadline
          deadline={row.original.pickupDeadline}
          status={row.original.status}
        />
      ),
      size: 140,
    },
    {
      id: "estimatedWait",
      header: "Est. Wait",
      cell: ({ row }) => {
        const status = row.original.status;
        const waitTime = row.original.estimatedWaitTime;
        if (status !== "pending") return <span className="text-muted-foreground">-</span>;
        return waitTime ? (
          <span className="text-sm">{waitTime}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
      size: 100,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const reservation = row.original;
        const canMarkReady = reservation.status === "pending";
        const canCancel = reservation.status === "pending" || reservation.status === "ready";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onViewDetails?.(reservation)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canMarkReady && (
                <DropdownMenuItem
                  onClick={() => onMarkReady?.(reservation)}
                  className="text-green-600"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Ready
                </DropdownMenuItem>
              )}
              {reservation.status === "ready" && (
                <DropdownMenuItem
                  onClick={() => onViewDetails?.(reservation)}
                  className="text-blue-600"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Extend Deadline
                </DropdownMenuItem>
              )}
              {canCancel && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onCancel?.(reservation)}
                    className="text-red-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Reservation
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableHiding: false,
      size: 80,
    },
  ];
}
