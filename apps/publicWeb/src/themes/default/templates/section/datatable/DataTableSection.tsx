"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronUp, ChevronDown, Download, Filter } from "lucide-react";
import { DataTableSectionData, SectionProps } from "../types";
import { getLocalizedText } from "../utils";

/**
 * DataTable Section Component
 * Displays tabular data with sorting, filtering, and search functionality
 */
export function DataTableSection({
  section,
  currentLanguage = "en",
}: SectionProps<DataTableSectionData>) {
  const { table, features = {}, styling = {}, rowsPerPage = 10 } = section;

  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {}
  );

  const headline = section.headline
    ? getLocalizedText(section.headline, currentLanguage)
    : null;

  const description = section.description
    ? getLocalizedText(section.description, currentLanguage)
    : null;

  // Filter and sort data - moved before early return
  const filteredAndSortedData = useMemo(() => {
    if (!table || !table.columns || !table.rows) {
      return [];
    }

    let filtered = table.rows;

    // Apply search filter
    if ((features as any).search && searchQuery) {
      filtered = filtered.filter((row) =>
        table.columns.some((column) =>
          String(row[column.key] || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply column filters
    if ((features as any).filter) {
      Object.entries(columnFilters).forEach(([columnKey, filterValue]) => {
        if (filterValue) {
          filtered = filtered.filter((row) =>
            String(row[columnKey] || "")
              .toLowerCase()
              .includes(filterValue.toLowerCase())
          );
        }
      });
    }

    // Apply sorting
    if ((features as any).sort && sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [table, features, searchQuery, columnFilters, sortConfig]);

  // Calculate pagination - moved before early return
  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = filteredAndSortedData.slice(startIndex, endIndex);
  const paginatedData = (features as any).pagination
    ? filteredAndSortedData.slice(startIndex, startIndex + rowsPerPage)
    : filteredAndSortedData;

  const handleSort = (columnKey: string) => {
    const column = table.columns.find((col) => col.key === columnKey);
    if (!column?.sortable || !(features as any).sort) return;

    setSortConfig((prev) => ({
      key: columnKey,
      direction:
        prev?.key === columnKey && prev?.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleExport = () => {
    const csvContent = [
      table.columns
        .map((col) => getLocalizedText(col.label, currentLanguage))
        .join(","),
      ...filteredAndSortedData.map((row) =>
        table.columns.map((col) => String(row[col.key] || "")).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${section.name || "data"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!table || !table.columns || !table.rows) {
    return (
      <section className="py-16 bg-gradient-to-b from-muted/30 via-primary/10 to-muted/30">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Data Available
            </h3>
            <p className="text-muted-foreground">
              Table data will be displayed here when available.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const renderCellContent = (value: any, column: any) => {
    if (!value) return "—";

    switch (column.type) {
      case "number":
        return typeof value === "number" ? value.toLocaleString() : value;
      case "currency":
        return typeof value === "number" ? `$${value.toLocaleString()}` : value;
      case "date":
        return new Date(value).toLocaleDateString();
      case "url":
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {value}
          </a>
        );
      case "email":
        return (
          <a href={`mailto:${value}`} className="text-primary hover:underline">
            {value}
          </a>
        );
      default:
        return String(value);
    }
  };

  return (
    <section
      className="py-16 bg-gradient-to-b from-background via-primary/5 to-background"
      data-section-id={section._id}
      data-section-type={section.type}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        {(headline || description) && (
          <div className="text-center mb-8">
            {headline && (
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 relative">
                <span className="absolute -top-3 -left-3 w-8 h-8 bg-primary/20 rounded-full blur-sm"></span>
                {headline}
              </h2>
            )}
            {description && (
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          {(features as any).search && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary w-5 h-5" />
              <input
                type="text"
                placeholder="Search table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          )}

          {/* Export */}
          {(features as any).export && (
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>

        {/* Column Filters */}
        {(features as any).filter && (
          <div className="mb-6 p-4 bg-gradient-to-r from-muted/50 to-primary/10 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-foreground">
                Column Filters
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {table.columns
                .filter((col) => col.filterable)
                .map((column) => (
                  <div key={column.key}>
                    <label className="block text-xs text-muted-foreground mb-1">
                      {getLocalizedText(column.label, currentLanguage)}
                    </label>
                    <input
                      type="text"
                      placeholder={`Filter ${getLocalizedText(
                        column.label,
                        currentLanguage
                      )}`}
                      value={columnFilters[column.key] || ""}
                      onChange={(e) =>
                        setColumnFilters((prev) => ({
                          ...prev,
                          [column.key]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-1 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table
              className={`w-full ${(styling as any).compact ? "text-sm" : ""}`}
            >
              <thead>
                <tr className="bg-gradient-to-r from-primary/10 to-primary/5">
                  {table.columns.map((column) => (
                    <th
                      key={column.key}
                      style={{ width: column.width }}
                      className={`
                        px-4 py-3 text-left font-semibold text-foreground
                        ${
                          column.sortable && (features as any).sort
                            ? "cursor-pointer hover:bg-primary/10"
                            : ""
                        }
                      `}
                      onClick={() => handleSort(column.key)}
                    >
                      <div className="flex items-center gap-2">
                        {getLocalizedText(column.label, currentLanguage)}
                        {column.sortable && (features as any).sort && (
                          <div className="flex flex-col">
                            <ChevronUp
                              className={`w-3 h-3 ${
                                sortConfig?.key === column.key &&
                                sortConfig?.direction === "asc"
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <ChevronDown
                              className={`w-3 h-3 -mt-1 ${
                                sortConfig?.key === column.key &&
                                sortConfig?.direction === "desc"
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={`
                      border-t border-border
                      ${
                        (styling as any).striped && rowIndex % 2 === 1
                          ? "bg-muted/30"
                          : ""
                      }
                      ${(styling as any).hover ? "hover:bg-muted/50" : ""}
                    `}
                  >
                    {table.columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 ${
                          (styling as any).compact ? "py-2" : "py-3"
                        } text-foreground`}
                      >
                        {renderCellContent(row[column.key], column)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {(features as any).pagination && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-gradient-to-r from-muted/30 to-primary/10">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to{" "}
                {Math.min(
                  startIndex + rowsPerPage,
                  filteredAndSortedData.length
                )}{" "}
                of {filteredAndSortedData.length} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-border rounded-md bg-background hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm border border-border rounded-md ${
                        currentPage === page
                          ? "bg-primary text-primary-foreground"
                          : "bg-background hover:bg-primary/10 text-foreground"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-border rounded-md bg-background hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results info */}
        {filteredAndSortedData.length === 0 &&
          (searchQuery || Object.values(columnFilters).some(Boolean)) && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No results found matching your criteria.
              </p>
            </div>
          )}
      </div>
    </section>
  );
}

export default DataTableSection;
