"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Printer } from "lucide-react";
import { searchBibliographiesAction, type SearchField } from "./actions";
import "./barcode.css";
import {
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui";

// Paper size configurations (in mm)
const PAPER_SIZES = {
  A4: { width: 210, height: 297, label: "A4 (210 × 297mm)" },
  Letter: { width: 216, height: 279, label: "Letter (8.5 × 11in)" },
  Legal: { width: 216, height: 356, label: "Legal (8.5 × 14in)" },
  A5: { width: 148, height: 210, label: "A5 (148 × 210mm)" },
};

// Barcode label size (3 labels per A4 row)
const LABEL_SIZE = {
  width: 66, // mm (6.6cm) - calculated for 3 labels per A4 width
  height: 16.5, // mm (1.65cm)
  gap: 1, // mm gap between labels (narrow for cutting lines)
};

interface AccessionNumber {
  _id?: string;
  accessionNo: string;
  status: string;
  classNo?: string;
  accessionGroup: string;
  remark?: string;
}

interface BibliographySearchResult {
  _id: string;
  title: string;
  author?: { id: string; name: string };
  isbn?: string;
  callNo?: string;
  accessionNumbers?: AccessionNumber[];
}

interface BarcodeItem {
  bibliographyId: string;
  accessionNo: string;
  title: string;
  author?: string;
  callNo?: string;
  copies: number;
}

const STORAGE_KEY = 'barcode-queue-storage';

export default function BarcodePage({ module, user, tenant, appId }: any) {
  const [paperSize, setPaperSize] = useState<keyof typeof PAPER_SIZES>("A4");
  const [searchValue, setSearchValue] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("accessionNumber");
  const [searchResults, setSearchResults] = useState<BibliographySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [barcodeQueue, setBarcodeQueue] = useState<BarcodeItem[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Load barcode queue from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setBarcodeQueue(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load barcode queue from localStorage:', error);
    }
  }, []);

  // Save barcode queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(barcodeQueue));
    } catch (error) {
      console.error('Failed to save barcode queue to localStorage:', error);
    }
  }, [barcodeQueue]);

  // Search field options
  const searchFieldOptions: { value: SearchField; label: string; placeholder: string }[] = [
    { value: "accessionNumber", label: "Accession Number", placeholder: "e.g., MG0000022401" },
    { value: "isbn", label: "ISBN", placeholder: "e.g., 978-3-16-148410-0" },
    { value: "title", label: "Title", placeholder: "e.g., Introduction to..." },
  ];

  // Calculate how many labels fit on the selected paper
  const calculateLabelsPerPage = () => {
    const paper = PAPER_SIZES[paperSize];
    const labelsPerRow = Math.floor(
      (paper.width - LABEL_SIZE.gap) / (LABEL_SIZE.width + LABEL_SIZE.gap)
    );
    const labelsPerColumn = Math.floor(
      (paper.height - LABEL_SIZE.gap) / (LABEL_SIZE.height + LABEL_SIZE.gap)
    );
    return {
      labelsPerRow,
      labelsPerColumn,
      labelsPerPage: labelsPerRow * labelsPerColumn
    };
  };

  // Search for bibliographies by selected field (accessionNumber, isbn, or title)
  const handleSearch = async () => {
    if (!searchValue.trim()) {
      const fieldLabel = searchFieldOptions.find(f => f.value === searchField)?.label || "search term";
      setSearchError(`Please enter ${searchField === "isbn" ? "an" : "a"} ${fieldLabel.toLowerCase()}`);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const result = await searchBibliographiesAction(searchValue, searchField);

      if (result.success && result.data) {
        setSearchResults(result.data);
        if (result.data.length === 0) {
          setSearchError("No books found matching your search");
        }
      } else {
        const errorMsg = result.error || "Failed to search bibliographies";
        setSearchError(errorMsg);
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred";
      setSearchError(errorMsg);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Add accession number to barcode queue
  const addToQueue = (
    bibliography: BibliographySearchResult,
    accession: AccessionNumber,
    copies: number
  ) => {
    // Create multiple entries for each copy
    const newItems: BarcodeItem[] = [];
    for (let i = 0; i < copies; i++) {
      newItems.push({
        bibliographyId: bibliography._id,
        accessionNo: accession.accessionNo,
        title: bibliography.title,
        author: bibliography.author?.name,
        callNo: accession.classNo || bibliography.callNo,
        copies: 1, // Each item represents 1 barcode
      });
    }

    setBarcodeQueue((prev) => {
      // Remove any existing entries with the same accession number
      const filtered = prev.filter((item) => item.accessionNo !== accession.accessionNo);
      // Add all new copies
      return [...filtered, ...newItems];
    });
  };

  // Remove all copies of an accession number from queue
  const removeFromQueue = (accessionNo: string) => {
    setBarcodeQueue((prev) => prev.filter((item) => item.accessionNo !== accessionNo));
  };

  // Clear all queue
  const clearQueue = () => {
    setBarcodeQueue([]);
  };

  // Generate barcode preview with pagination
  const generateBarcodePreview = () => {
    const { labelsPerRow, labelsPerColumn, labelsPerPage } = calculateLabelsPerPage();
    const totalLabels = barcodeQueue.reduce((sum, item) => sum + item.copies, 0);
    const totalPages = Math.ceil(totalLabels / labelsPerPage);

    // Split barcodes into pages
    const pages: BarcodeItem[][] = [];
    for (let i = 0; i < totalLabels; i += labelsPerPage) {
      pages.push(barcodeQueue.slice(i, i + labelsPerPage));
    }

    return { labelsPerRow, labelsPerColumn, labelsPerPage, totalLabels, totalPages, pages };
  };

  const preview = generateBarcodePreview();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Barcode Management</h1>
          <p className="text-muted-foreground">
            Generate and print barcode labels for library materials
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Barcode
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Search Books</DialogTitle>
              </DialogHeader>

              {/* Search Input with Field Selector */}
              <div className="flex gap-2 mb-4">
                <Select value={searchField} onValueChange={(value: SearchField) => setSearchField(value)}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {searchFieldOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder={searchFieldOptions.find(f => f.value === searchField)?.placeholder || "Enter search term..."}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {/* Search Results */}
              <div className="space-y-4">
                {isSearching ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    <p className="text-muted-foreground">Searching bibliographies...</p>
                  </div>
                ) : searchError ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="rounded-full bg-destructive/10 p-3 mb-4">
                      <svg
                        className="h-6 w-6 text-destructive"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <p className="text-destructive font-medium mb-2">Search Error</p>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      {searchError}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchError(null);
                        setSearchValue("");
                      }}
                      className="mt-4"
                    >
                      Clear Search
                    </Button>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-center">
                      {searchValue
                        ? "No books found matching your search"
                        : `Select a field and enter a value to search`}
                    </p>
                  </div>
                ) : (
                  searchResults.map((bibliography) => (
                    <SearchResultCard
                      key={bibliography._id}
                      bibliography={bibliography}
                      onAdd={addToQueue}
                    />
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button
            onClick={() => window.print()}
            disabled={barcodeQueue.length === 0}
            className="print:hidden"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Barcodes
          </Button>
        </div>
      </div>

      {/* Top Row - Settings & Queue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Paper Size Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Paper Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium">Paper Size</label>
              <Select value={paperSize} onValueChange={(value: any) => setPaperSize(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAPER_SIZES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                {preview.labelsPerPage} labels per page
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Print Queue Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Print Queue</span>
              {barcodeQueue.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearQueue}>
                  Clear All
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unique Books:</span>
                <span className="font-medium">
                  {new Set(barcodeQueue.map(item => item.accessionNo)).size}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Labels:</span>
                <span className="font-medium">{preview.totalLabels}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Pages:</span>
                <span className="font-medium">{preview.totalPages}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Width Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Barcode Preview</CardTitle>
        </CardHeader>
        <CardContent>
              {barcodeQueue.length === 0 ? (
                <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">
                    Add barcodes to see preview here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Queue List */}
                  <Table className="barcode-queue-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Accession No.</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Call No.</TableHead>
                        <TableHead className="w-24">Copies</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        // Group items by accession number and count
                        const grouped = barcodeQueue.reduce((acc, item) => {
                          if (!acc[item.accessionNo]) {
                            acc[item.accessionNo] = { item, count: 0 };
                          }
                          acc[item.accessionNo].count += 1;
                          return acc;
                        }, {} as Record<string, { item: BarcodeItem; count: number }>);

                        return Object.values(grouped).map(({ item, count }) => (
                          <TableRow key={item.accessionNo}>
                            <TableCell className="font-mono">
                              {item.accessionNo}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                <p className="font-medium truncate">{item.title}</p>
                                {item.author && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {item.author}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{item.callNo || "-"}</TableCell>
                            <TableCell>{count}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromQueue(item.accessionNo)}
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>

                  {/* Visual Preview - Show all barcodes with pagination */}
                  <div className="border rounded-lg p-4 bg-muted/10">
                    <p className="text-sm text-muted-foreground mb-4 barcode-preview-text">
                      Preview layout on {PAPER_SIZES[paperSize].label} ({preview.labelsPerRow} labels per row, {preview.totalPages} page{preview.totalPages !== 1 ? 's' : ''})
                    </p>
                    {/* Multiple pages preview */}
                    <div className="space-y-4">
                      {preview.pages.map((pageItems, pageIndex) => (
                        <div key={pageIndex} className="flex flex-col items-center gap-2">
                          <p className="text-xs text-muted-foreground barcode-preview-text">
                            Page {pageIndex + 1} of {preview.totalPages}
                          </p>
                          <div className="barcode-page-wrapper">
                            <div
                              className="bg-white shadow-lg barcode-page-container"
                              style={{
                                width: `${PAPER_SIZES[paperSize].width}mm`,
                                aspectRatio: `${PAPER_SIZES[paperSize].width} / ${PAPER_SIZES[paperSize].height}`,
                                transform: 'scale(0.6)',
                                transformOrigin: 'top center',
                              }}
                            >
                              <div
                                className="barcode-grid barcode-grid-print"
                                style={{ '--labels-per-row': preview.labelsPerRow } as React.CSSProperties}
                              >
                                {pageItems.map((item, index) => (
                                  <div
                                    key={`${item.accessionNo}-${pageIndex}-${index}`}
                                    className="barcode-label bg-white"
                                  >
                                    {/* Class Number */}
                                    {item.callNo && (
                                      <div className="barcode-text">
                                        {item.callNo}
                                      </div>
                                    )}
                                    {/* Barcode with asterisks for Code 39 */}
                                    <div className="barcode-font">
                                      *{item.accessionNo}*
                                    </div>
                                    {/* Accession Number in plain text */}
                                    <div className="barcode-text">
                                      {item.accessionNo}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
        )}
      </CardContent>
    </Card>

    {/* Hidden Print-Only Section */}
    <div id="barcode-print-section" className="hidden print:block">
      {preview.pages.map((pageItems, pageIndex) => (
        <div
          key={`print-page-${pageIndex}`}
          className="printPage"
          style={{
            pageBreakAfter: pageIndex < preview.pages.length - 1 ? 'always' : 'auto',
            pageBreakInside: 'avoid',
            width: '100%',
            boxSizing: 'border-box',
            padding: '5mm'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${preview.labelsPerRow}, 6.6cm)`,
              gap: '1mm',
              justifyContent: 'center',
              alignContent: 'start'
            }}
          >
            {pageItems.map((item, index) => (
              <div
                key={`print-label-${pageIndex}-${index}`}
                style={{
                  width: '6.6cm',
                  height: '1.65cm',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  pageBreakInside: 'avoid',
                  gap: '3px'
                }}
              >
                {item.callNo && (
                  <div style={{ fontFamily: 'Times New Roman', fontSize: '13px', color: 'black', marginBottom: '3px' }}>
                    {item.callNo}
                  </div>
                )}
                <div className="barcode-font" style={{ fontFamily: 'IDAutomationC39S', fontSize: '10pt', color: 'black', margin: '0' }}>
                  *{item.accessionNo}*
                </div>
                <div style={{ fontFamily: 'Times New Roman', fontSize: '13px', color: 'black', marginTop: '3px' }}>
                  {item.accessionNo}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
    </div>
  );
}

// Search Result Card Component
function SearchResultCard({
  bibliography,
  onAdd,
}: {
  bibliography: BibliographySearchResult;
  onAdd: (bib: BibliographySearchResult, acc: AccessionNumber, copies: number) => void;
}) {
  const [selectedCopies, setSelectedCopies] = useState<Record<string, number>>({});

  const handleAdd = (accession: AccessionNumber) => {
    const copies = selectedCopies[accession.accessionNo] || 1;
    onAdd(bibliography, accession, copies);
    // Reset the copies input for this accession back to 1
    setSelectedCopies((prev) => ({ ...prev, [accession.accessionNo]: 1 }));
  };

  const updateCopies = (accessionNo: string, value: string) => {
    // Allow empty string for editing
    if (value === '') {
      setSelectedCopies((prev) => ({ ...prev, [accessionNo]: '' as any }));
      return;
    }
    const num = parseInt(value);
    if (!isNaN(num)) {
      setSelectedCopies((prev) => ({ ...prev, [accessionNo]: Math.max(1, Math.min(num, 99)) }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{bibliography.title}</CardTitle>
        {bibliography.author && (
          <p className="text-sm text-muted-foreground">{bibliography.author.name}</p>
        )}
      </CardHeader>
      <CardContent>
        {!bibliography.accessionNumbers || bibliography.accessionNumbers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No accession numbers available</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Accession No.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Class No.</TableHead>
                <TableHead className="w-32">Copies</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bibliography.accessionNumbers.map((accession) => (
                <TableRow key={accession.accessionNo}>
                  <TableCell className="font-mono">{accession.accessionNo}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        accession.status === "In"
                          ? "bg-green-100 text-green-800"
                          : accession.status === "Out"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {accession.status}
                    </span>
                  </TableCell>
                  <TableCell>{accession.classNo || "-"}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      max="99"
                      value={selectedCopies[accession.accessionNo] ?? 1}
                      onChange={(e) => updateCopies(accession.accessionNo, e.target.value)}
                      onBlur={(e) => {
                        // If empty on blur, reset to 1
                        if (e.target.value === '') {
                          setSelectedCopies((prev) => ({ ...prev, [accession.accessionNo]: 1 }));
                        }
                      }}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="sm" onClick={() => handleAdd(accession)}>
                      Add
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
