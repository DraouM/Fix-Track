import { useState, useMemo, useCallback } from "react";
import type { InventoryItem, PhoneBrand, ItemType } from "@/types/inventory";

// ✅ Export so it can be reused in the context or components
export type SortConfig = {
  key: keyof InventoryItem | "profit";
  direction: "ascending" | "descending";
};

export function useInventoryFilters(items: InventoryItem[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<PhoneBrand>("All");
  const [selectedType, setSelectedType] = useState<ItemType>("All");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "itemName",
    direction: "ascending",
  });

  const filteredAndSortedItems = useMemo(() => {
    const term = searchTerm.toLowerCase();

    const filtered = items.filter((item) => {
      const matchesSearch = item.itemName.toLowerCase().includes(term);
      const matchesBrand = selectedBrand === "All" || item.phoneBrand === selectedBrand;
      const matchesType = selectedType === "All" || item.itemType === selectedType;
      return matchesSearch && matchesBrand && matchesType;
    });

    if (!sortConfig) return filtered;

    const { key, direction } = sortConfig;
    const dirMultiplier = direction === "ascending" ? 1 : -1;

    return [...filtered].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (key === "profit") {
        aValue = (a.sellingPrice ?? 0) - (a.buyingPrice ?? 0);
        bValue = (b.sellingPrice ?? 0) - (b.buyingPrice ?? 0);
      } else {
        aValue = a[key as keyof Omit<InventoryItem, "history">] ?? "";
        bValue = b[key as keyof Omit<InventoryItem, "history">] ?? "";
      }

      if (key === "quantityInStock") {
        aValue = a.quantityInStock ?? -Infinity;
        bValue = b.quantityInStock ?? -Infinity;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return dirMultiplier * aValue.localeCompare(bValue);
      }

      return dirMultiplier * ((aValue as number) - (bValue as number));
    });
  }, [items, searchTerm, selectedBrand, selectedType, sortConfig]);

  const handleSort = useCallback((key: keyof InventoryItem | "profit") => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "ascending" ? "descending" : "ascending" };
      }
      return { key, direction: "ascending" };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedBrand("All");
    setSelectedType("All");
    setSortConfig({ key: "itemName", direction: "ascending" });
  }, []);

  return {
    searchTerm,
    selectedBrand,
    selectedType,
    sortConfig,
    filteredAndSortedItems,
    hasActiveFilters: searchTerm !== "" || selectedBrand !== "All" || selectedType !== "All",
    resultCount: filteredAndSortedItems.length,
    totalCount: items.length,
    setSearchTerm,
    setSelectedBrand,
    setSelectedType,
    handleSort,
    clearFilters,
  };
}
