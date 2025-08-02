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

  // Handle clear search input
  const clearSearch = () => {
    setSearchQuery("");
    inputRef.current?.focus();
  };

  // Handle close search
  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={`relative ${className}`}>
      {!isSearchOpen ? (
        <button
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
          onClick={() => setIsSearchOpen(true)}
          type="button"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
        </button>
      ) : (
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search..."
              className="w-80 h-10 pl-10 pr-10 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              <Search className="h-4 w-4" />
            </div>
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!searchQuery.trim()}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleCloseSearch}
            className="h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
            aria-label="Close search"
            type="button"
          >
            <X className="h-4 w-4 hover:font-bold transition-all" />
          </button>
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
