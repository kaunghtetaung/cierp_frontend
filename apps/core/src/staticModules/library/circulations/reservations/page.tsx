"use client";

import { useState, useCallback, useEffect } from "react";
import { DataTable } from "@repo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { Badge } from "@repo/ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@repo/ui";
import { Alert, AlertDescription } from "@repo/ui";
import { getReservationColumns } from "./columns";
import { ReservationFilters, type ReservationFilterValues } from "./ReservationFilters";
import { ReservationActions } from "./ReservationActions";
import { getReservations, getReservationStats } from "../actions/reservation.actions";
import type { Reservation, ReservationStatus, ReservationStats } from "../types/reservation.types";
import { toast } from "sonner";

export default function ReservationsPage() {
  const [data, setData] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<ReservationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [activeTab, setActiveTab] = useState<ReservationStatus | "all" | "expiring">("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<ReservationFilterValues>({});
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) =>
      key !== "status" && value !== undefined && value !== "" && value !== "all"
  ).length;

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await getReservationStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching reservation stats:", error);
    }
  }, []);

  // Fetch data function
  const fetchData = useCallback(
    async (page: number = 1, tabStatus: ReservationStatus | "all" | "expiring" = "all") => {
      setIsLoading(true);
      try {
        const queryParams: any = {
          page,
          limit: 10,
          sortBy: "reservationDate",
          sortOrder: "desc",
        };

        // Handle tab-based status filters
        if (tabStatus === "expiring") {
          queryParams.status = "ready";
          queryParams.expiringWithinDays = 2;
        } else if (tabStatus !== "all") {
          queryParams.status = tabStatus;
        }

        // Add filters from advanced filter panel
        if (filters.searchQuery) {
          queryParams.searchQuery = filters.searchQuery;
        }
        if (filters.libraryCardNumber) {
          queryParams.libraryCardNumber = filters.libraryCardNumber;
        }
        if (filters.startDate) {
          queryParams.startDate = filters.startDate.toISOString();
        }
        if (filters.endDate) {
          queryParams.endDate = filters.endDate.toISOString();
        }

        const response = await getReservations(queryParams);

        if (response.success && response.data) {
          setData(response.data.data);
          setTotalPages(response.data.pagination.totalPages);
          setTotalItems(response.data.pagination.total);
          setCurrentPage(response.data.pagination.page);
        } else {
          toast.error("Failed to fetch reservations", {
            description: response.error || "An error occurred while fetching data",
          });
          setData([]);
        }
      } catch (error) {
        console.error("Error fetching reservations:", error);
        toast.error("An unexpected error occurred", {
          description: "Please try again later",
        });
        setData([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filters]
  );

  // Initial load
  useEffect(() => {
    fetchData(1, activeTab);
    fetchStats();
  }, [activeTab]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as ReservationStatus | "all" | "expiring");
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchData(page, activeTab);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchData(currentPage, activeTab);
    fetchStats();
  };

  // Handle filter change
  const handleFilterChange = (newFilters: ReservationFilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1);
    fetchData(1, activeTab);
  };

  // Handle actions
  const handleViewDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsActionsOpen(true);
  };

  const handleMarkReady = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsActionsOpen(true);
  };

  const handleCancel = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsActionsOpen(true);
  };

  const handleActionComplete = () => {
    setIsActionsOpen(false);
    setSelectedReservation(null);
    handleRefresh();
  };

  // Get columns with action handlers
  const columns = getReservationColumns({
    onViewDetails: handleViewDetails,
    onMarkReady: handleMarkReady,
    onCancel: handleCancel,
  });

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <IconComponent name="CalendarClock" className="w-8 h-8" />
          Reservations Management
        </h1>
        <p className="text-muted-foreground">
          Manage book reservations and pickup queue
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <IconComponent name="Clock" className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalPending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <IconComponent name="CheckCircle" className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalReady}</p>
                  <p className="text-xs text-muted-foreground">Ready</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={stats.expiringSoon > 0 ? "border-orange-300 dark:border-orange-700" : ""}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <IconComponent name="AlertTriangle" className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.expiringSoon}</p>
                  <p className="text-xs text-muted-foreground">Expiring Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <IconComponent name="TrendingUp" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.fulfillmentRate}%</p>
                  <p className="text-xs text-muted-foreground">Fulfillment Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Expiring Alert */}
      {stats && stats.expiringToday > 0 && (
        <Alert variant="destructive" className="mb-6">
          <IconComponent name="AlertCircle" className="w-4 h-4" />
          <AlertDescription>
            <strong>{stats.expiringToday} reservation(s)</strong> are expiring today!
            Please notify borrowers to pick up their books.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Card Container */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reservation Queue</CardTitle>
              <CardDescription>
                View and manage all book reservations
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {totalItems > 0 && (
                <span className="inline-flex items-center gap-1">
                  <IconComponent name="Database" className="w-4 h-4" />
                  {totalItems} total reservations
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-5 h-auto">
              <TabsTrigger
                value="all"
                className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <IconComponent name="List" className="w-4 h-4" />
                <span className="text-xs font-medium">All</span>
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-yellow-500 data-[state=active]:text-white"
              >
                <IconComponent name="Clock" className="w-4 h-4" />
                <span className="text-xs font-medium">Pending</span>
                {stats && stats.totalPending > 0 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {stats.totalPending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="ready"
                className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-green-600 data-[state=active]:text-white"
              >
                <IconComponent name="CheckCircle" className="w-4 h-4" />
                <span className="text-xs font-medium">Ready</span>
                {stats && stats.totalReady > 0 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {stats.totalReady}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="expiring"
                className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              >
                <IconComponent name="AlertTriangle" className="w-4 h-4" />
                <span className="text-xs font-medium">Expiring</span>
                {stats && stats.expiringSoon > 0 && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0">
                    {stats.expiringSoon}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="fulfilled"
                className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <IconComponent name="BookCheck" className="w-4 h-4" />
                <span className="text-xs font-medium">Fulfilled</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {/* Data Table */}
              <div className="w-full">
                <DataTable
                  columns={columns}
                  data={data}
                  searchKey="borrower.libraryCardNumber"
                  searchPlaceholder="Search by library card or book title..."
                  printTitle="Reservations"
                  moduleId="reservations"
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
          <ReservationFilters
            onFilterChange={handleFilterChange}
            onClose={() => setIsFilterOpen(false)}
            initialFilters={filters}
          />
        </SheetContent>
      </Sheet>

      {/* Reservation Actions Sheet */}
      <Sheet open={isActionsOpen} onOpenChange={setIsActionsOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Reservation Details</SheetTitle>
          </SheetHeader>
          {selectedReservation && (
            <ReservationActions
              reservation={selectedReservation}
              onComplete={handleActionComplete}
              onClose={() => setIsActionsOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
