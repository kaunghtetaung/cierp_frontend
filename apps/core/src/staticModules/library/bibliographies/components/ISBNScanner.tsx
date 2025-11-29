"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { Alert, AlertDescription } from "@repo/ui";
import { Badge } from "@repo/ui";
import {
  Loader2,
  Search,
  Camera,
  BookOpen,
  CheckCircle,
  AlertCircle,
  X,
  Scan,
} from "lucide-react";
import {
  searchGoogleBooksAction,
  downloadAndUploadBookCoverAction,
  type BookSearchResult,
} from "../google-books-actions";

interface ISBNScannerProps {
  onBookFound: (bookData: NonNullable<BookSearchResult["data"]>) => void;
  onCoverUploaded?: (coverData: {
    key: string;
    url: string;
    name: string;
  }) => void;
  tenantId: string;
  appId?: string;
  currentLanguage?: string;
  disabled?: boolean;
}

interface ScannerState {
  isSearching: boolean;
  isDownloadingCover: boolean;
  error: string | null;
  lastSearchedIsbn: string | null;
  foundBook: NonNullable<BookSearchResult["data"]> | null;
}

/**
 * ISBN Scanner Component with Barcode Support
 *
 * Features:
 * - Manual ISBN input with validation
 * - Barcode scanner support (USB/Bluetooth scanners work as keyboard input)
 * - Google Books API integration
 * - Automatic book cover download and upload
 */
export function ISBNScanner({
  onBookFound,
  onCoverUploaded,
  tenantId,
  appId = "core",
  currentLanguage = "en",
  disabled = false,
}: ISBNScannerProps) {
  const [isbn, setIsbn] = useState("");
  const [state, setState] = useState<ScannerState>({
    isSearching: false,
    isDownloadingCover: false,
    error: null,
    lastSearchedIsbn: null,
    foundBook: null,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const scanBufferRef = useRef<string>("");
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Labels based on language
  const labels = {
    title: currentLanguage === "mm" ? "ISBN ရှာဖွေရန်" : "ISBN Lookup",
    subtitle:
      currentLanguage === "mm"
        ? "ISBN ထည့်ပါ သို့မဟုတ် ဘားကုဒ်ဖတ်ပါ"
        : "Enter ISBN or scan barcode",
    placeholder:
      currentLanguage === "mm"
        ? "ISBN ထည့်ပါ (ဥပမာ: 9783319284149)"
        : "Enter ISBN (e.g., 9783319284149)",
    search: currentLanguage === "mm" ? "ရှာဖွေမည်" : "Search",
    searching: currentLanguage === "mm" ? "ရှာဖွေနေသည်..." : "Searching...",
    bookFound: currentLanguage === "mm" ? "စာအုပ်တွေ့ရှိပါပြီ" : "Book Found",
    applyData:
      currentLanguage === "mm" ? "အချက်အလက်သုံးမည်" : "Apply Book Data",
    downloadingCover:
      currentLanguage === "mm"
        ? "မျက်နှာဖုံးပုံ ဒေါင်းလုတ်လုပ်နေသည်..."
        : "Downloading cover...",
    coverUploaded:
      currentLanguage === "mm"
        ? "မျက်နှာဖုံးပုံ တင်ပြီးပါပြီ"
        : "Cover uploaded",
    noBookFound:
      currentLanguage === "mm"
        ? "ဤ ISBN ဖြင့် စာအုပ်မတွေ့ပါ"
        : "No book found with this ISBN",
    scannerReady:
      currentLanguage === "mm"
        ? "ဘားကုဒ်စကင်နာ အသင့်ဖြစ်ပါပြီ"
        : "Barcode scanner ready",
    clear: currentLanguage === "mm" ? "ရှင်းမည်" : "Clear",
  };

  // Handle barcode scanner input
  // Barcode scanners typically send characters rapidly followed by Enter
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;

      // Check if the event is from the input field
      if (document.activeElement !== inputRef.current) return;

      // If Enter is pressed, check if we have a scanned barcode
      if (e.key === "Enter") {
        if (scanBufferRef.current.length >= 10) {
          // This looks like a barcode scan
          setIsbn(scanBufferRef.current);
          // Trigger search automatically after barcode scan
          handleSearch(scanBufferRef.current);
        }
        scanBufferRef.current = "";
        return;
      }

      // Accumulate characters for barcode detection
      // Barcode scanners typically send characters within 50ms of each other
      if (/^[0-9X]$/i.test(e.key)) {
        scanBufferRef.current += e.key.toUpperCase();

        // Clear buffer after 100ms of inactivity
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
        }
        scanTimeoutRef.current = setTimeout(() => {
          scanBufferRef.current = "";
        }, 100);
      }
    },
    [disabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [handleKeyDown]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSearch = async (searchIsbn?: string) => {
    const isbnToSearch = searchIsbn || isbn;

    if (!isbnToSearch.trim()) {
      setState((prev) => ({ ...prev, error: "Please enter an ISBN" }));
      return;
    }

    setState({
      isSearching: true,
      isDownloadingCover: false,
      error: null,
      lastSearchedIsbn: isbnToSearch,
      foundBook: null,
    });

    try {
      const result = await searchGoogleBooksAction(isbnToSearch);

      if (!result.success || !result.data) {
        setState((prev) => ({
          ...prev,
          isSearching: false,
          error: result.error || labels.noBookFound,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isSearching: false,
        foundBook: result.data!,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSearching: false,
        error: error instanceof Error ? error.message : "Search failed",
      }));
    }
  };

  const handleApplyData = async () => {
    if (!state.foundBook) return;

    // First, notify about the book data
    onBookFound(state.foundBook);

    // Then download and upload cover if available
    if (state.foundBook.largeThumbnailUrl && onCoverUploaded) {
      setState((prev) => ({ ...prev, isDownloadingCover: true }));

      try {
        const coverResult = await downloadAndUploadBookCoverAction({
          imageUrl: state.foundBook.largeThumbnailUrl!,
          isbn: state.foundBook.isbn13 || state.foundBook.isbn10 || isbn,
          tenantId,
          app: appId,
        });

        if (coverResult.success && coverResult.data) {
          onCoverUploaded(coverResult.data);
        }
      } catch (error) {
        console.error("Failed to download cover:", error);
        // Don't show error - cover is optional
      } finally {
        setState((prev) => ({ ...prev, isDownloadingCover: false }));
      }
    }

    // Clear the scanner after applying
    handleClear();
  };

  const handleClear = () => {
    setIsbn("");
    setState({
      isSearching: false,
      isDownloadingCover: false,
      error: null,
      lastSearchedIsbn: null,
      foundBook: null,
    });
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits and hyphens
    const value = e.target.value.replace(/[^0-9-]/g, "");
    setIsbn(value);
    // Clear error when user starts typing
    if (state.error) {
      setState((prev) => ({ ...prev, error: null }));
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isbn.trim()) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Scan className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{labels.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
            </div>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Camera className="h-3 w-3" />
            {labels.scannerReady}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ISBN Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              type="text"
              value={isbn}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              placeholder={labels.placeholder}
              disabled={disabled || state.isSearching}
              className="pr-10 font-mono text-lg"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            {isbn && (
              <button
                type="button"
                onClick={() => setIsbn("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            type="button"
            onClick={() => handleSearch()}
            disabled={disabled || state.isSearching || !isbn.trim()}
            className="min-w-[120px]"
          >
            {state.isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {labels.searching}
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                {labels.search}
              </>
            )}
          </Button>
        </div>

        {/* Error Message */}
        {state.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {/* Book Preview */}
        {state.foundBook && (
          <div className="rounded-lg border bg-card p-4 animate-in slide-in-from-top-2">
            <div className="flex gap-4">
              {/* Book Cover Thumbnail */}
              {state.foundBook.thumbnailUrl && (
                <div className="flex-shrink-0">
                  <img
                    src={state.foundBook.thumbnailUrl}
                    alt={state.foundBook.title}
                    className="w-20 h-28 object-cover rounded shadow-md"
                    onError={(e) => {
                      // Hide broken image
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* Book Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-2">
                      {state.foundBook.title}
                    </h3>
                    {state.foundBook.subtitle && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {state.foundBook.subtitle}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    {labels.bookFound}
                  </Badge>
                </div>

                <div className="mt-2 space-y-1 text-sm">
                  {state.foundBook.authors &&
                    state.foundBook.authors.length > 0 && (
                      <p>
                        <span className="text-muted-foreground">
                          {currentLanguage === "mm" ? "စာရေးသူ: " : "Author: "}
                        </span>
                        {state.foundBook.authors.join(", ")}
                      </p>
                    )}
                  {state.foundBook.publisher && (
                    <p>
                      <span className="text-muted-foreground">
                        {currentLanguage === "mm"
                          ? "ထုတ်ဝေသူ: "
                          : "Publisher: "}
                      </span>
                      {state.foundBook.publisher}
                    </p>
                  )}
                  {state.foundBook.year && (
                    <p>
                      <span className="text-muted-foreground">
                        {currentLanguage === "mm" ? "ထုတ်ဝေနှစ်: " : "Year: "}
                      </span>
                      {state.foundBook.year}
                    </p>
                  )}
                  {(state.foundBook.isbn13 || state.foundBook.isbn10) && (
                    <p>
                      <span className="text-muted-foreground">ISBN: </span>
                      <span className="font-mono">
                        {state.foundBook.isbn13 || state.foundBook.isbn10}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={state.isDownloadingCover}
              >
                {labels.clear}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleApplyData}
                disabled={state.isDownloadingCover}
                className="min-w-[150px]"
              >
                {state.isDownloadingCover ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {labels.downloadingCover}
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-2 h-4 w-4" />
                    {labels.applyData}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
