// hooks/useSupplierFilters.ts
import { useState, useMemo } from "react";

export interface SupplierSortConfig {
  key: "name" | "creditBalance" | "createdAt" | "updatedAt";
  direction: "asc" | "desc";
}

export interface SupplierFilters {
  searchTerm: string;
  active: boolean | "All";
}

export function useSupplierFilters(suppliers: any[]) {
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

      const matchesActive =
        filters.active === "All" || supplier.active === filters.active;

      return matchesSearch && matchesActive;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "creditBalance") {
        aValue = aValue || 0;
        bValue = bValue || 0;
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
