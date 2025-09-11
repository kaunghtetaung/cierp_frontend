import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
  Loader2Icon,
} from "lucide-react";

import { cn } from "../lib/utils";
import { Button, buttonVariants } from "./button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  allowedLimits?: number[];
  currentLanguage?: string;
  className?: string;
  isLoading?: boolean; // Loading state for pagination changes
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  allowedLimits,
  currentLanguage,
  className,
  isLoading = false,
  ...props
}: PaginationProps) {
  // Don't show pagination if there's only 1 page or no data
  console.log("🔍 Pagination component debug:", {
    totalPages,
    totalItems,
    currentPage,
    pageSize,
    isLoading: isLoading,
    shouldHide: totalPages <= 1 || totalItems === 0,
    willRender: totalPages > 1 && totalItems > 0
  });
  
  if (totalPages <= 1 || totalItems === 0) {
    console.log("Pagination HIDDEN: totalPages <= 1 or totalItems === 0");
    return null;
  }

  // Calculate display range
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  // Generate page numbers to display (max 5 pages)
  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    const pages = [];

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination with current page in center when possible
      const halfWindow = Math.floor(maxPagesToShow / 2);
      let startPage = Math.max(1, currentPage - halfWindow);
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      // Adjust if we're near the end
      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  console.log("paging is running!");

  // Show loading skeleton when isLoading is true
  if (isLoading) {
    console.log("🔄 PAGINATION LOADING SKELETON ACTIVATED!");
    return (
      <div className={cn("space-y-3 opacity-75 pointer-events-none", className)}>
        {/* Loading skeleton for pagination controls - Outside and above */}
        <div className="flex items-center justify-center md:justify-end gap-2 px-4">
          {/* Loading skeleton for Previous button */}
          <div className="h-8 bg-muted animate-pulse rounded w-20"></div>
          
          {/* Loading skeleton for page numbers */}
          {[1,2,3].map((i) => (
            <div key={i} className="h-8 bg-muted animate-pulse rounded w-10"></div>
          ))}
          
          {/* Loading skeleton for Next button */}
          <div className="h-8 bg-muted animate-pulse rounded w-16"></div>
        </div>

        {/* Loading skeleton for results info container - Two column layout */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-gradient-to-r from-muted/30 to-primary/10">
          {/* Loading skeleton for results info - Left aligned */}
          <div className="flex items-center gap-2">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <div className="h-4 bg-muted animate-pulse rounded w-48"></div>
          </div>
          
          {/* Loading skeleton for page size selector - Right aligned */}
          {allowedLimits && allowedLimits.length > 1 && onPageSizeChange && (
            <div className="flex items-center gap-2">
              <div className="h-4 bg-muted animate-pulse rounded w-16"></div>
              <div className="h-8 bg-muted animate-pulse rounded w-16"></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Pagination controls - Moved outside and above */}
      <div className="flex items-center justify-center md:justify-end gap-2 px-4">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm border border-border rounded-md bg-background hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed text-foreground flex items-center gap-1"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          {currentLanguage === "mm" ? "ပြီးခဲ့သော" : "Previous"}
        </button>

        {/* Page numbers */}
        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "px-3 py-1 text-sm border border-border rounded-md",
              currentPage === page
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-primary/10 text-foreground"
            )}
          >
            {page}
          </button>
        ))}

        {/* Next button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm border border-border rounded-md bg-background hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed text-foreground flex items-center gap-1"
        >
          {currentLanguage === "mm" ? "နောက်တစ်မျက်နှာ" : "Next"}
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Results info container - Two column layout */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-gradient-to-r from-muted/30 to-primary/10">
        {/* Results info - Left aligned */}
        <div className="text-sm text-muted-foreground">
          {currentLanguage === "mm"
            ? `${
                startIndex + 1
              } မှ ${endIndex} အထိ ပြသနေသည် (စুစုပေါင်း ${totalItems} ခု)`
            : `Showing ${
                startIndex + 1
              } to ${endIndex} of ${totalItems} results`}
        </div>

        {/* Page size selector - Right aligned */}
        {allowedLimits && allowedLimits.length > 1 && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {currentLanguage === "mm" ? "စာမျက်နှာအလိုက်" : "Per page"}:
            </span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
              className="px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
            >
              {allowedLimits.map((limit) => (
                <option key={limit} value={limit}>
                  {limit}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">;

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        className
      )}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pl-2.5", className)}
      {...props}
    >
      <ChevronLeftIcon />
      <span className="hidden sm:block">Previous</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pr-2.5", className)}
      {...props}
    >
      <span className="hidden sm:block">Next</span>
      <ChevronRightIcon />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
