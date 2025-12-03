"use client";

import { useState, useCallback, useEffect } from "react";
import { DataTable } from "@repo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@repo/ui";
import { getCirculationColumns } from "./columns";
import { CirculationFilters, type CirculationFilterValues } from "./CirculationFilters";
import { getCirculationHistory } from "../actions/circulation.actions";
import type { CirculationResponse, CirculationStatus } from "../types/circulation.types";
import { toast } from "sonner";

// Debug helper to find all nested objects in data
function debugFindObjects(data: any[], prefix: string = ''): void {
  if (!data || data.length === 0) return;

  const firstItem = data[0];
  console.log(`🔍 [DEBUG] Analyzing data structure at "${prefix || 'root'}":`);

  const analyzeValue = (value: any, path: string) => {
    if (value === null || value === undefined) return;
    if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      console.log(`📦 [DEBUG] Object at "${path}":`, {
        keys: Object.keys(value),
        hasId: 'id' in value,
        hasName: 'name' in value,
        has_id: '_id' in value,
      });
      // Recursively check nested objects
      Object.entries(value).forEach(([k, v]) => {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          analyzeValue(v, `${path}.${k}`);
        }
      });
    }
  };

  Object.entries(firstItem).forEach(([key, value]) => {
    analyzeValue(value, key);
  });
}

export default function CirculationHistoryPage() {
  const [data, setData] = useState<CirculationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [activeTab, setActiveTab] = useState<CirculationStatus | "all">("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<CirculationFilterValues>({});

  // Count active filters (excluding status which is handled by tabs)
  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) =>
      key !== "status" && value !== undefined && value !== "" && value !== "all"
  ).length;

  // Fetch data function
  const fetchData = useCallback(
    async (page: number = 1, tabStatus: CirculationStatus | "all" = "all") => {
      setIsLoading(true);
      try {
        // Build query params
        const queryParams: any = {
          page,
          limit: 10,
        };

        // Add status from tab (unless it's 'all')
        if (tabStatus !== "all") {
          queryParams.status = tabStatus;
        }

        // Add filters from advanced filter panel
        if (filters.accessionNo) {
          queryParams.accessionNo = filters.accessionNo;
        }
        if (filters.startDate) {
          queryParams.startDate = filters.startDate.toISOString();
        }
        if (filters.endDate) {
          queryParams.endDate = filters.endDate.toISOString();
        }
        if (filters.overdue) {
          queryParams.overdue = true;
        }

        const response = await getCirculationHistory(queryParams);

        console.log('📊 [CIRCULATION HISTORY] API Response:', {
          success: response.success,
          hasData: !!response.data,
          dataLength: response.data?.data?.length,
          error: response.error,
        });

        if (response.success && response.data) {
          // Debug: Comprehensive analysis of data structure
          debugFindObjects(response.data.data, 'circulation');

          // Debug: Log first item's structure to identify object fields
          if (response.data.data.length > 0) {
            const firstItem = response.data.data[0];
            console.log('📊 [CIRCULATION HISTORY] First item structure:', {
              id: firstItem.id,
              accessionNo: firstItem.accessionNo,
              status: firstItem.status,
              borrowerName: firstItem.borrowerName,
              borrowerNameType: typeof firstItem.borrowerName,
              borrower: firstItem.borrower,
              borrowerType: typeof firstItem.borrower,
              bibliography: firstItem.bibliography,
              bibliographyType: typeof firstItem.bibliography,
              bibliographyAuthor: firstItem.bibliography?.author,
              bibliographyAuthorType: typeof firstItem.bibliography?.author,
              lendingPolicy: firstItem.lendingPolicy,
              lendingPolicyType: typeof firstItem.lendingPolicy,
            });

            // Check for any object fields that might cause React error #31
            const checkForObjects = (obj: any, path: string = '') => {
              if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
                Object.entries(obj).forEach(([key, value]) => {
                  const currentPath = path ? `${path}.${key}` : key;
                  if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                    console.log(`⚠️ [CIRCULATION HISTORY] Object field found at: ${currentPath}`, {
                      keys: Object.keys(value),
                      value,
                    });
                  }
                });
              }
            };
            checkForObjects(firstItem);
          }

          setData(response.data.data);
          setTotalPages(response.data.pagination.totalPages);
          setTotalItems(response.data.pagination.total);
          setCurrentPage(response.data.pagination.page);
        } else {
          toast.error("Failed to fetch circulation history", {
            description: response.error || "An error occurred while fetching data",
          });
          setData([]);
        }
      } catch (error) {
        console.error("Error fetching circulation history:", error);
        toast.error("An unexpected error occurred", {
          description: "Please try again later",
        });
        setData([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, toast]
  );

  // Initial load
  useEffect(() => {
    fetchData(1, activeTab);
  }, [activeTab]); // Only re-fetch when tab changes

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as CirculationStatus | "all");
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchData(page, activeTab);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchData(currentPage, activeTab);
  };

  // Handle filter change
  const handleFilterChange = (newFilters: CirculationFilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1);
    // Manually fetch with new filters
    setIsLoading(true);
    const queryParams: any = {
      page: 1,
      limit: 10,
    };

    // Add status from tab
    if (activeTab !== "all") {
      queryParams.status = activeTab;
    }

    // Add new filters
    if (newFilters.accessionNo) {
      queryParams.accessionNo = newFilters.accessionNo;
    }
    if (newFilters.startDate) {
      queryParams.startDate = newFilters.startDate.toISOString();
    }
    if (newFilters.endDate) {
      queryParams.endDate = newFilters.endDate.toISOString();
    }
    if (newFilters.overdue) {
      queryParams.overdue = true;
    }

    getCirculationHistory(queryParams)
      .then((response) => {
        if (response.success && response.data) {
          setData(response.data.data);
          setTotalPages(response.data.pagination.totalPages);
          setTotalItems(response.data.pagination.total);
          setCurrentPage(response.data.pagination.page);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Quick action handlers
  const handleRenew = (circulation: CirculationResponse) => {
    toast.info("Renew Book", {
      description: `Renewing book ${circulation.accessionNo}...`,
    });
    // TODO: Implement renewal logic
  };

  const handleReturn = (circulation: CirculationResponse) => {
    toast.info("Return Book", {
      description: `Opening return form for ${circulation.accessionNo}...`,
    });
    // TODO: Implement return logic
  };

  const handleViewDetails = (circulation: CirculationResponse) => {
    toast.info("View Details", {
      description: `Opening details for ${circulation.accessionNo}...`,
    });
    // TODO: Implement view details logic
  };

  // Get columns with action handlers
  const columns = getCirculationColumns({
    onRenew: handleRenew,
    onReturn: handleReturn,
    onViewDetails: handleViewDetails,
  });

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <IconComponent name="History" className="w-8 h-8" />
          Circulation History
        </h1>
        <p className="text-muted-foreground">
          View and manage checkout and return history
        </p>
      </div>

      {/* Main Card Container */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction Records</CardTitle>
              <CardDescription>
                Browse all circulation transactions with advanced filtering
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {totalItems > 0 && (
                <span className="inline-flex items-center gap-1">
                  <IconComponent name="Database" className="w-4 h-4" />
                  {totalItems} total records
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-4 h-auto">
              <TabsTrigger
                value="all"
                className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <IconComponent name="List" className="w-4 h-4" />
                <span className="text-xs font-medium">All Records</span>
                {activeTab === "all" && totalItems > 0 && (
                  <span className="text-xs opacity-80">({totalItems})</span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="checked_out"
                className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <IconComponent name="BookOpen" className="w-4 h-4" />
                <span className="text-xs font-medium">Active</span>
              </TabsTrigger>
              <TabsTrigger
                value="overdue"
                className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground"
              >
                <IconComponent name="AlertCircle" className="w-4 h-4" />
                <span className="text-xs font-medium">Overdue</span>
              </TabsTrigger>
              <TabsTrigger
                value="checked_in"
                className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-green-600 data-[state=active]:text-white"
              >
                <IconComponent name="CheckCircle" className="w-4 h-4" />
                <span className="text-xs font-medium">Returned</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {/* Data Table */}
              <div className="w-full">
                <DataTable
                  columns={columns}
                  data={data}
                  searchKey="accessionNo"
                  searchPlaceholder="Search by accession number..."
                  printTitle="Circulation History"
                  moduleId="circulation-history"
                  isLoading={isLoading}
                  onRefresh={handleRefresh}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                  showAdvancedFilter={true}
                  onAdvancedFilterToggle={() => setIsFilterOpen(!isFilterOpen)}
                  isAdvancedFilterOpen={isFilterOpen}
                  activeFilterCount={activeFilterCount}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Advanced Filters Sheet */}
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Advanced Filters</SheetTitle>
          </SheetHeader>
          <CirculationFilters
            onFilterChange={handleFilterChange}
            onClose={() => setIsFilterOpen(false)}
            initialFilters={filters}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
