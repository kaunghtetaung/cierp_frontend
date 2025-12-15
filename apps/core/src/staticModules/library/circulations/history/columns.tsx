"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@repo/ui";
import { Badge } from "@repo/ui";
import { MoreHorizontal, RotateCcw, CheckCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui";
import { format } from "date-fns";
import type { CirculationResponse, CirculationStatus } from "../types/circulation.types";

// Helper to safely render any value (prevents React error #31)
function safeRender(value: any, fieldName?: string): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    console.error(`🚨 [COLUMNS] Object passed to render for field "${fieldName}":`, {
      keys: Object.keys(value),
      value,
    });
    // Try to extract name property if it exists
    if ('name' in value) return value.name;
    if ('title' in value) return value.title;
    // Fallback to JSON for debugging
    return '[Object]';
  }
  return String(value);
}

// Status badge component
function StatusBadge({ status }: { status: CirculationStatus }) {
  const variants = {
    checked_out: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", label: "Active" },
    overdue: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "Overdue" },
    checked_in: { color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200", label: "Returned" },
  };

  const variant = variants[status];

  return (
    <Badge className={variant.color} variant="outline">
      {variant.label}
    </Badge>
  );
}

// Format currency (cents to dollars)
function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
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

export interface CirculationColumnsProps {
  onRenew?: (circulation: CirculationResponse) => void;
  onReturn?: (circulation: CirculationResponse) => void;
  onViewDetails?: (circulation: CirculationResponse) => void;
  currentPage?: number;
  pageSize?: number;
}

export function getCirculationColumns({
  onRenew,
  onReturn,
  onViewDetails,
  currentPage = 1,
  pageSize = 10,
}: CirculationColumnsProps = {}): ColumnDef<CirculationResponse>[] {
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
      accessorKey: "accessionNo",
      header: "Accession No.",
      cell: ({ row }) => (
        <div className="font-medium">{safeRender(row.original.accessionNo, 'accessionNo')}</div>
      ),
      size: 120,
    },
    {
      id: "borrower",
      header: "Borrower",
      accessorKey: "borrowerName",
      cell: ({ row }) => {
        const borrowerName = row.original.borrowerName;
        const borrower = row.original.borrower;

        // Debug: Check if borrowerName is an object
        if (borrowerName && typeof borrowerName === 'object') {
          console.error('🚨 [COLUMNS] borrowerName is an object!', borrowerName);
        }

        // Safe extraction of borrower name
        const displayName = (() => {
          if (typeof borrowerName === 'string') return borrowerName;
          if (borrowerName && typeof borrowerName === 'object' && 'name' in borrowerName) {
            return (borrowerName as any).name;
          }
          if (borrower) {
            const firstName = typeof borrower.firstName === 'string' ? borrower.firstName : '';
            const lastName = typeof borrower.lastName === 'string' ? borrower.lastName : '';
            return `${firstName} ${lastName}`.trim() || '-';
          }
          return '-';
        })();

        // Safe extraction of library card number
        const cardNo = (() => {
          if (!borrower?.libraryCardNo) return null;
          if (typeof borrower.libraryCardNo === 'string') return borrower.libraryCardNo;
          if (typeof borrower.libraryCardNo === 'object' && 'name' in borrower.libraryCardNo) {
            return (borrower.libraryCardNo as any).name;
          }
          return null;
        })();

        return (
          <div>
            <div className="font-medium">{displayName}</div>
            {cardNo && (
              <div className="text-xs text-muted-foreground">{cardNo}</div>
            )}
          </div>
        );
      },
      size: 180,
    },
    {
      id: "book",
      header: "Book Title",
      accessorFn: (row) => row.bibliography?.title || "-",
      cell: ({ row }) => {
        const book = row.original.bibliography;
        // Handle author which might be a string or an object with name property
        const getAuthorName = (author: any): string | null => {
          if (!author) return null;
          if (typeof author === 'string') return author;
          if (typeof author === 'object' && author.name) return author.name;
          return null;
        };
        const authorName = book ? getAuthorName(book.author) : null;

        return book ? (
          <div>
            <div className="font-medium line-clamp-1">{book.title}</div>
            {authorName && (
              <div className="text-xs text-muted-foreground">
                by {authorName}
              </div>
            )}
          </div>
        ) : (
          "-"
        );
      },
      size: 200,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      size: 100,
    },
    {
      accessorKey: "checkoutDate",
      header: "Checkout Date",
      cell: ({ row }) => formatDate(row.original.checkoutDate),
      size: 120,
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => formatDate(row.original.dueDate),
      size: 120,
    },
    {
      accessorKey: "checkinDate",
      header: "Return Date",
      cell: ({ row }) => formatDate(row.original.checkinDate),
      size: 120,
    },
    {
      accessorKey: "overdueDays",
      header: "Overdue Days",
      cell: ({ row }) => {
        const days = row.original.overdueDays;
        return days > 0 ? (
          <span className="text-red-600 dark:text-red-400 font-medium">
            {days} {days === 1 ? "day" : "days"}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
      size: 100,
    },
    {
      accessorKey: "fineAmount",
      header: "Fine Amount",
      cell: ({ row }) => {
        const fine = row.original.fineAmount;
        return fine > 0 ? (
          <span className="text-red-600 dark:text-red-400 font-medium">
            {formatCurrency(fine)}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
      size: 100,
    },
    {
      accessorKey: "renewalCount",
      header: "Renewals",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.renewalCount} / {row.original.maxRenewals}
        </div>
      ),
      size: 80,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const circulation = row.original;
        const canRenew =
          circulation.status !== "checked_in" &&
          circulation.renewalCount < circulation.maxRenewals;
        const canReturn = circulation.status !== "checked_in";

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
              <DropdownMenuItem
                onClick={() => onViewDetails?.(circulation)}
              >
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canRenew && (
                <DropdownMenuItem
                  onClick={() => onRenew?.(circulation)}
                  className="text-blue-600"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Renew Book
                </DropdownMenuItem>
              )}
              {canReturn && (
                <DropdownMenuItem
                  onClick={() => onReturn?.(circulation)}
                  className="text-green-600"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Return Book
                </DropdownMenuItem>
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
