import { useState, useMemo, useCallback, useEffect } from "react";
import type { InventoryItem, PhoneBrand, ItemType } from "@/types/inventory";

// Custom hook for debounced search
function useDebouncedSearch(initialValue: string, delay = 500): [string, string, (value: string) => void] {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  return [searchTerm, debouncedSearchTerm, setSearchTerm];
}

// ✅ Export so it can be reused in the context or components
export type SortConfig = {
  key: keyof InventoryItem | "profit";
  direction: "ascending" | "descending";
};

export function useInventoryFilters(items: InventoryItem[]) {
  const [searchTerm, debouncedSearchTerm, setSearchTerm] = useDebouncedSearch("");
  const [selectedBrand, setSelectedBrand] = useState<PhoneBrand>("All");
  const [selectedType, setSelectedType] = useState<ItemType>("All");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "itemName",
    direction: "ascending",
  });

  // Memoize the lowercase search term
  const searchTermLower = useMemo(() => debouncedSearchTerm.toLowerCase(), [debouncedSearchTerm]);

  // Separate filtering by brand and type
  const filteredByBrandAndType = useMemo(() => {
    return items.filter((item) => {
      const matchesBrand = selectedBrand === "All" || item.phoneBrand === selectedBrand;
      const matchesType = selectedType === "All" || item.itemType === selectedType;
      return matchesBrand && matchesType;
    });
  }, [items, selectedBrand, selectedType]);

  // Then filter by search term
  const filteredItems = useMemo(() => {
    if (!searchTermLower) return filteredByBrandAndType;
    
    return filteredByBrandAndType.filter((item) => {
      const itemNameLower = item.itemName.toLowerCase();
      return itemNameLower.includes(searchTermLower);
    });
  }, [filteredByBrandAndType, searchTermLower]);

  // Finally, sort the filtered items
  const filteredAndSortedItems = useMemo(() => {
    if (!sortConfig) return filteredItems;

    if (!sortConfig) return filteredItems;

    const { key, direction } = sortConfig;
    const dirMultiplier = direction === "ascending" ? 1 : -1;

    return [...filteredItems].sort((a, b) => {
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
  }, [filteredItems, sortConfig]);

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
  }, [setSearchTerm]);

  const setSearchTermWrapped: React.Dispatch<React.SetStateAction<string>> = useCallback((value: React.SetStateAction<string>) => {
    if (typeof value === 'function') {
      setSearchTerm(value(""));  // Initialize with empty string if it's a function
    } else {
      setSearchTerm(value);
    }
  }, [setSearchTerm]);

  return {
    searchTerm,
    selectedBrand,
    selectedType,
    sortConfig,
    filteredAndSortedItems,
    hasActiveFilters: searchTerm !== "" || selectedBrand !== "All" || selectedType !== "All",
    resultCount: filteredAndSortedItems.length,
    totalCount: items.length,
    setSearchTerm: setSearchTermWrapped,
    setSelectedBrand,
    setSelectedType,
    handleSort,
    clearFilters,
  };
}
