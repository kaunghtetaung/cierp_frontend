"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/styled-components/ui/Button";
import { Search, X } from "lucide-react";

interface SearchComponentProps {
  className?: string;
  variant?: "mobile" | "desktop";
}

/**
 * Mobile Search Component
 * Overlay-style search for mobile devices
 */
const MobileSearch: React.FC<SearchComponentProps> = ({ className = "" }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Search overlay mode for mobile
  if (isSearchOpen) {
    return (
      <div
        className={`fixed top-0 left-0 right-0 bg-background p-4 shadow-md z-50 flex items-center gap-3 ${className}`}
      >
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search..."
            className="w-full h-10 px-4 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="flex-shrink-0"
          onClick={() => setIsSearchOpen(false)}
          aria-label="Close search"
          type="button"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setIsSearchOpen(true)}
      aria-label="Open search"
      className={`h-8 w-8 ${className}`}
    >
      <Search className="h-4 w-4" />
    </Button>
  );
};

/**
 * Desktop Search Component
 * Expandable search bar for desktop
 */
const DesktopSearch: React.FC<SearchComponentProps> = ({ className = "" }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus when search opens
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search page with query
      const searchUrl = new URL("/search", window.location.origin);
      searchUrl.searchParams.set("q", searchQuery.trim());
      window.location.href = searchUrl.toString();
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle clear/close search
  const handleClearOrClose = () => {
    if (searchQuery.trim()) {
      // If there's text, clear it
      setSearchQuery("");
      inputRef.current?.focus();
    } else {
      // If empty, close the search
      setIsSearchOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {!isSearchOpen ? (
        <button
          className="px-2 py-1 text-sm font-medium transition-colors bg-transparent text-white hover:text-white/90"
          onClick={() => setIsSearchOpen(true)}
          type="button"
        >
          Search
        </button>
      ) : (
        <form onSubmit={handleSearchSubmit} className="flex items-center">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search..."
              className="w-64 h-8 pl-8 pr-8 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              <Search className="h-3.5 w-3.5" />
            </div>
            <button
              type="button"
              onClick={handleClearOrClose}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              aria-label={searchQuery.trim() ? "Clear search" : "Close search"}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

/**
 * Main Search Component
 * Note: Mobile search is handled directly in MobileHeaderActions for full-screen overlay behavior
 * This component is primarily used for desktop search functionality
 */
export const SearchComponent: React.FC<SearchComponentProps> = ({
  variant = "desktop",
  className = "",
}) => {
  // Mobile search is handled in MobileHeaderActions for proper overlay behavior
  if (variant === "mobile") {
    console.warn(
      "Mobile search should be handled directly in MobileHeaderActions"
    );
    return <MobileSearch className={className} />;
  }

  return <DesktopSearch className={className} />;
};
