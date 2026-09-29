import { useState, useMemo, useCallback } from "react";
import type { DateRange } from "react-day-picker";
import { startOfDay, endOfDay, isWithinInterval } from "date-fns";
import type { StockMovement, HistoryEventType } from "@/types/inventory";
import { useDebouncedSearch } from "./useDebouncedSearch";
import {
  prepareSearchableItems,
  searchSearchableItems,
} from "@/lib/flexibleSearch";

export type MovementSortKey =
  | "itemName"
  | "type"
  | "date"
  | "quantityChange"
  | "movementParty"
  | "unitPrice"
  | "value";

export type MovementSortConfig = {
  key: MovementSortKey;
  direction: "ascending" | "descending";
};

export type MovementPriceField =
  | "buyingPrice"
  | "sellingPrice"
  | "unitPrice"
  | "value";

// Unit price applied to a movement: the price actually charged/paid at the
// time of the movement when available, otherwise the item default
// (cost for inbound events, selling price for everything else).
export function getMovementUnitPrice(movement: StockMovement): number {
  if (movement.movementPrice != null) return movement.movementPrice;
  if (movement.type === "Purchased" || movement.type === "Returned") {
    return movement.buyingPrice ?? 0;
  }
  return movement.sellingPrice ?? 0;
}

export function getMovementValue(movement: StockMovement): number {
  return movement.quantityChange * getMovementUnitPrice(movement);
}

// Running stock level after each movement (per item, oldest → newest).
// Pass the complete ledger for accurate results; returns movement id → qty left.
export function computeStockLevels(
  movements: StockMovement[],
): Map<string, number> {
  const byItem = new Map<string, StockMovement[]>();
  for (const m of movements) {
    const list = byItem.get(m.itemId) ?? [];
    list.push(m);
    byItem.set(m.itemId, list);
  }

  const levels = new Map<string, number>();
  for (const [, list] of byItem) {
    const chronological = [...list].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    let running = 0;
    for (const m of chronological) {
      running += m.quantityChange;
      levels.set(m.id, running);
    }
  }
  return levels;
}

export function useStockMovementFilters(movements: StockMovement[]) {
  const [searchTerm, debouncedSearchTerm, setSearchTerm] = useDebouncedSearch(
    "",
    300,
  );
  const [selectedType, setSelectedType] = useState<HistoryEventType | "All">(
    "All",
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [priceField, setPriceField] = useState<MovementPriceField>("unitPrice");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortConfig, setSortConfig] = useState<MovementSortConfig>({
    key: "date",
    direction: "descending",
  });

  // 1. Filter by event type, date range and price/value range
  const filteredByFacets = useMemo(() => {
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    const hasMin = !Number.isNaN(min);
    const hasMax = !Number.isNaN(max);

    return movements.filter((movement) => {
      if (selectedType !== "All" && movement.type !== selectedType) {
        return false;
      }

      if (dateRange?.from) {
        const eventDate = new Date(movement.date);
        const from = startOfDay(dateRange.from);
        const to = endOfDay(dateRange.to ?? dateRange.from);
        if (!isWithinInterval(eventDate, { start: from, end: to })) {
          return false;
        }
      }

      if (hasMin || hasMax) {
        let value: number;
        switch (priceField) {
          case "value":
            value = Math.abs(getMovementValue(movement));
            break;
          case "buyingPrice":
            value = movement.buyingPrice ?? 0;
            break;
          case "sellingPrice":
            value = movement.sellingPrice ?? 0;
            break;
          default:
            value = Math.abs(getMovementUnitPrice(movement));
        }
        if (hasMin && value < min) return false;
        // min === max behaves as an exact match
        if (hasMax && value > max) return false;
      }

      return true;
    });
  }, [movements, selectedType, dateRange, priceField, minPrice, maxPrice]);

  // 2. Flexible tokenized search on item name and metadata
  const searchableMovements = useMemo(() => {
    return prepareSearchableItems(filteredByFacets, (movement) => [
      movement.itemName ?? "",
      movement.phoneBrand ?? "",
      movement.itemType ?? "",
      movement.notes ?? "",
      movement.type,
      movement.movementParty ?? "",
      movement.movementReference ?? "",
    ]);
  }, [filteredByFacets]);

  const filteredMovements = useMemo(() => {
    if (!debouncedSearchTerm) return filteredByFacets;
    return searchSearchableItems(debouncedSearchTerm, searchableMovements);
  }, [debouncedSearchTerm, filteredByFacets, searchableMovements]);

  // 3. Sort
  const filteredAndSortedMovements = useMemo(() => {
    const { key, direction } = sortConfig;
    const multiplier = direction === "ascending" ? 1 : -1;

    return [...filteredMovements].sort((a, b) => {
      switch (key) {
        case "itemName":
          return (
            multiplier * (a.itemName ?? "").localeCompare(b.itemName ?? "")
          );
        case "type":
          return multiplier * a.type.localeCompare(b.type);
        case "date":
          return (
            multiplier *
            (new Date(a.date).getTime() - new Date(b.date).getTime())
          );
        case "quantityChange":
          return multiplier * (a.quantityChange - b.quantityChange);
        case "movementParty":
          return (
            multiplier *
            (a.movementParty ?? "").localeCompare(b.movementParty ?? "")
          );
        case "unitPrice":
          return (
            multiplier * (getMovementUnitPrice(a) - getMovementUnitPrice(b))
          );
        case "value":
          return multiplier * (getMovementValue(a) - getMovementValue(b));
        default:
          return 0;
      }
    });
  }, [filteredMovements, sortConfig]);

  const handleSort = useCallback((key: MovementSortKey) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction:
            prev.direction === "ascending" ? "descending" : "ascending",
        };
      }
      return { key, direction: "ascending" };
    });
  }, []);

  const hasActiveFilters =
    searchTerm !== "" ||
    selectedType !== "All" ||
    !!dateRange?.from ||
    minPrice !== "" ||
    maxPrice !== "";

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedType("All");
    setDateRange(undefined);
    setPriceField("unitPrice");
    setMinPrice("");
    setMaxPrice("");
    setSortConfig({ key: "date", direction: "descending" });
  }, [setSearchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    selectedType,
    setSelectedType,
    dateRange,
    setDateRange,
    priceField,
    setPriceField,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    sortConfig,
    handleSort,
    hasActiveFilters,
    clearFilters,
    filteredAndSortedMovements,
    resultCount: filteredAndSortedMovements.length,
    totalCount: movements.length,
  };
}
