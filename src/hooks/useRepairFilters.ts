import { useState, useMemo, useCallback } from "react";
import type {
  Repair,
  RepairStatus,
  PaymentStatus,
  DateRangeFilter,
} from "@/types/repair";
import { DateRange } from "react-day-picker";

// ✅ Types - Adjusted to match context structure
export type RepairSortConfig = {
  key:
    | Exclude<keyof Repair, "payments" | "usedParts" | "history">
    | "remainingBalance"
    | "duration"
    | "urgency";
  direction: "ascending" | "descending";
};

export interface RepairFilterConfig {
  searchTerm: string;
  status: RepairStatus | "All";
  paymentStatus: PaymentStatus | "All";
  dateRange: DateRange | undefined;
}

// ✅ Hook - Refactored for context integration
export function useRepairFilters(repairs: Repair[]) {
  // -------------------- State --------------------
  const [filters, setFilters] = useState<RepairFilterConfig>({
    searchTerm: "",
    status: "All",
    paymentStatus: "All",
    dateRange: undefined,
  });

  const [sortConfig, setSortConfig] = useState<RepairSortConfig>({
    key: "createdAt",
    direction: "descending",
  });

  // -------------------- Derived repairs --------------------
  const repairsWithCalculations = useMemo(() => {
    return repairs.map((repair) => {
      const totalCost = repair.estimatedCost || 0;
      // Use pre-calculated values from context if available, otherwise fallback to manual calculation
      const amountPaid =
        repair.totalPaid ??
        (repair.payments?.reduce((sum, p) => sum + p.amount, 0) || 0);
      const remainingBalance =
        repair.remainingBalance ?? Math.max(0, totalCost - amountPaid);

      const createdAt = new Date(repair.createdAt);
      const updatedAt = new Date(repair.updatedAt);

      // Use updatedAt as promised date for urgency calculation
      const promisedDate = updatedAt;
      const completedAt = ["completed", "delivered"].includes(repair.status)
        ? updatedAt
        : null;

      const duration = completedAt
        ? completedAt.getTime() - createdAt.getTime()
        : Date.now() - createdAt.getTime();

      const urgency = promisedDate.getTime() - Date.now();

      return {
        ...repair,
        _calculated: {
          totalCost,
          amountPaid,
          remainingBalance,
          duration,
          urgency,
          isUrgent: urgency < 24 * 60 * 60 * 1000, // Less than 24 hours
          isOverdue: promisedDate.getTime() < Date.now(),
        },
      };
    });
  }, [repairs]);

  // -------------------- Filtering & Sorting --------------------
  const filteredAndSortedRepairs = useMemo(() => {
    const term = (filters.searchTerm || "").toLowerCase();

    const filtered = repairsWithCalculations.filter((r) => {
      // Safe access to string properties
      const customerName = (r.customerName || "").toLowerCase();
      const customerPhone = (r.customerPhone || "").toLowerCase();
      const deviceBrand = (r.deviceBrand || "").toLowerCase();
      const deviceModel = (r.deviceModel || "").toLowerCase();
      const repairId = (r.id || "").toLowerCase();

      const matchesSearch =
        customerName.includes(term) ||
        customerPhone.includes(term) ||
        deviceBrand.includes(term) ||
        deviceModel.includes(term) ||
        repairId.includes(term);

      const matchesStatus =
        filters.status === "All" || r.status === filters.status;

      const matchesPaymentStatus =
        filters.paymentStatus === "All" ||
        r.paymentStatus === filters.paymentStatus;

      // Enhanced date filtering with proper null safety
      let repairDate: Date;
      try {
        repairDate = r.createdAt ? new Date(r.createdAt) : new Date(0);
      } catch {
        repairDate = new Date(0);
      }

      const matchesDateRange =
        !filters.dateRange?.from ||
        (repairDate >= filters.dateRange.from &&
          (!filters.dateRange.to || repairDate <= filters.dateRange.to));

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPaymentStatus &&
        matchesDateRange
      );
    });

    const { key, direction } = sortConfig;
    const dirMultiplier = direction === "ascending" ? 1 : -1;

    return [...filtered].sort((a, b) => {
      let aValue: any = "";
      let bValue: any = "";

      if (key === "remainingBalance") {
        aValue = a._calculated?.remainingBalance ?? 0;
        bValue = b._calculated?.remainingBalance ?? 0;
      } else if (key === "duration") {
        aValue = a._calculated?.duration ?? 0;
        bValue = b._calculated?.duration ?? 0;
      } else if (key === "urgency") {
        aValue = a._calculated?.urgency ?? 0;
        bValue = b._calculated?.urgency ?? 0;
      } else {
        aValue = a[key] ?? "";
        bValue = b[key] ?? "";
      }

      // Handle Date comparison
      if (aValue instanceof Date && bValue instanceof Date) {
        return dirMultiplier * (aValue.getTime() - bValue.getTime());
      }

      // Handle string comparison
      if (typeof aValue === "string" && typeof bValue === "string") {
        return dirMultiplier * aValue.localeCompare(bValue);
      }

      // Handle number comparison
      if (typeof aValue === "number" && typeof bValue === "number") {
        return dirMultiplier * (aValue - bValue);
      }

      return 0;
    });
  }, [repairsWithCalculations, filters, sortConfig]);

  // -------------------- Handlers --------------------
  const handleSort = useCallback((key: RepairSortConfig["key"]) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: term }));
  }, []);

  const setStatusFilter = useCallback((status: RepairStatus | "All") => {
    setFilters((prev) => ({ ...prev, status }));
  }, []);

  const setPaymentStatusFilter = useCallback(
    (paymentStatus: PaymentStatus | "All") => {
      setFilters((prev) => ({ ...prev, paymentStatus }));
    },
    []
  );

  const setDateRange = useCallback((range: DateRange | undefined) => {
    setFilters((prev) => ({ ...prev, dateRange: range }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: "",
      status: "All",
      paymentStatus: "All",
      dateRange: undefined,
    });
    setSortConfig({ key: "createdAt", direction: "descending" });
  }, []);

  // -------------------- Statistics --------------------
  const statistics = useMemo(() => {
    const total = repairs.length;
    const filtered = filteredAndSortedRepairs.length;

    const byStatus = repairs.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<RepairStatus, number>);

    const byPaymentStatus = repairs.reduce((acc, r) => {
      acc[r.paymentStatus] = (acc[r.paymentStatus] || 0) + 1;
      return acc;
    }, {} as Record<PaymentStatus, number>);

    const totalRevenue = repairsWithCalculations.reduce(
      (sum, r) => sum + (r._calculated?.amountPaid || 0),
      0
    );

    const pendingRevenue = repairsWithCalculations.reduce(
      (sum, r) => sum + (r._calculated?.remainingBalance || 0),
      0
    );

    const completedCount =
      (byStatus.Completed || 0) + (byStatus.Delivered || 0);

    return {
      total,
      filtered,
      byStatus,
      byPaymentStatus,
      totalRevenue,
      pendingRevenue,
      completionRate: total > 0 ? (completedCount / total) * 100 : 0,
      averageRepairTime:
        repairsWithCalculations.reduce(
          (sum, r) => sum + (r._calculated?.duration || 0),
          0
        ) / Math.max(1, completedCount),
    };
  }, [repairs, filteredAndSortedRepairs, repairsWithCalculations]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchTerm !== "" ||
      filters.status !== "All" ||
      filters.paymentStatus !== "All" ||
      !!filters.dateRange?.from
    );
  }, [filters]);

  // -------------------- Return --------------------
  return {
    // State
    filters,
    sortConfig,
    filteredAndSortedRepairs,
    statistics,
    hasActiveFilters,
    resultCount: filteredAndSortedRepairs.length,
    totalCount: repairs.length,

    // Filter actions
    setSearchTerm,
    setStatusFilter,
    setPaymentStatusFilter,
    setDateRange,
    handleSort,
    clearFilters,
  };
}

// // ✅ Context integration helper
// export function useRepairFiltersWithContext() {
//   const { repairs } = useRepairContext();
//   return useRepairFilters(repairs);
// }
