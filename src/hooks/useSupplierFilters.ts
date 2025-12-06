// hooks/useSupplierFilters.ts
import { useState, useMemo } from "react";
import type { Supplier } from "@/types/supplier";

export interface SupplierSortConfig {
  key: keyof Supplier | "outstandingBalance" | "status";
  direction: "asc" | "desc";
}

export interface SupplierFilters {
  searchTerm: string;
  active: boolean | "All";
}

export function useSupplierFilters(suppliers: Supplier[]) {
  const [filters, setFilters] = useState<SupplierFilters>({
    searchTerm: "",
    active: "All",
  });

  const [sortConfig, setSortConfig] = useState<SupplierSortConfig>({
    key: "name",
    direction: "asc",
  });

  const setSearchTerm = (term: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: term }));
  };

  const setActiveFilter = (active: boolean | "All") => {
    setFilters((prev) => ({ ...prev, active }));
  };

  const handleSort = (key: SupplierSortConfig["key"]) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      active: "All",
    });
    setSortConfig({
      key: "name",
      direction: "asc",
    });
  };

  const filteredAndSortedSuppliers = useMemo(() => {
    let filtered = suppliers.filter((supplier) => {
      const matchesSearch =
        !filters.searchTerm ||
        supplier.name
          .toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) ||
        supplier.contactName
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) ||
        supplier.email
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase());

      // Fix: Use status property instead of active
      const matchesActive =
        filters.active === "All" ||
        (filters.active === true && supplier.status === "active") ||
        (filters.active === false && supplier.status === "inactive");

      return matchesSearch && matchesActive;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      // Handle special cases for sorting
      if (sortConfig.key === "outstandingBalance") {
        aValue = a.outstandingBalance || 0;
        bValue = b.outstandingBalance || 0;
      } else if (sortConfig.key === "status") {
        aValue = a.status;
        bValue = b.status;
      } else {
        // Handle regular properties
        aValue = a[sortConfig.key as keyof Supplier];
        bValue = b[sortConfig.key as keyof Supplier];
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [suppliers, filters, sortConfig]);

  return {
    filteredAndSortedSuppliers,
    filters,
    sortConfig,
    setSearchTerm,
    setActiveFilter,
    handleSort,
    clearFilters,
  };
}
