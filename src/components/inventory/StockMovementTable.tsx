"use client";

import React, { useRef, useState, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { StockMovement, HistoryEventType } from "@/types/inventory";
import type {
  MovementSortConfig,
  MovementSortKey,
  MovementPriceField,
} from "@/hooks/useStockMovementFilters";
import {
  getMovementValue,
  getMovementUnitPrice,
} from "@/hooks/useStockMovementFilters";
import {
  getEventIcon,
  getEventColor,
} from "@/components/inventory/InventoryHistoryDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Search,
  X,
  DollarSign,
  RotateCcw,
  ChevronDown,
  ArrowUpDown,
  ArrowLeftRight,
  User,
  Building2,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import type { DateRange } from "react-day-picker";

interface StockMovementTableProps {
  movements: StockMovement[];
  totalCount: number;
  sortConfig: MovementSortConfig;
  onSort: (key: MovementSortKey) => void;
  // Filters
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedType: HistoryEventType | "All";
  setSelectedType: (type: HistoryEventType | "All") => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  priceField: MovementPriceField;
  setPriceField: (field: MovementPriceField) => void;
  minPrice: string;
  setMinPrice: (value: string) => void;
  maxPrice: string;
  setMaxPrice: (value: string) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  // Per movement-type counts (full ledger) for the Tier 1 tabs
  typeCounts: Record<string, number>;
  // Opens the detailed history of the item behind the movement
  onViewHistory?: (movement: StockMovement) => void;
  // Running stock level after each movement (movement id → qty left)
  stockLevels?: Map<string, number>;
}

const ROW_HEIGHT = 60;
const HEADER_HEIGHT = 44;

/* Shared column template — header and rows must use the exact same grid so
   every title sits perfectly above its cell content, scrollbar or not. */
const TABLE_GRID =
  "grid min-w-[64rem] grid-cols-[10.5rem_minmax(0,2.2fr)_minmax(0,1.5fr)_5.5rem_5.5rem_6rem_6.5rem_8.5rem_3rem] items-center";

/* ---------- Movement Type Filter Tabs (Tier 1) ---------- */
const TYPE_TABS = [
  {
    value: "All",
    solid: "bg-primary text-primary-foreground shadow-primary/20",
    dot: "bg-primary",
  },
  {
    value: "Purchased",
    solid: "bg-emerald-500 text-white shadow-emerald-500/20",
    dot: "bg-emerald-500",
  },
  {
    value: "Sold",
    solid: "bg-blue-500 text-white shadow-blue-500/20",
    dot: "bg-blue-500",
  },
  {
    value: "Used in Repair",
    solid: "bg-orange-500 text-white shadow-orange-500/20",
    dot: "bg-orange-500",
  },
  {
    value: "Returned",
    solid: "bg-purple-500 text-white shadow-purple-500/20",
    dot: "bg-purple-500",
  },
  {
    value: "Manual Correction",
    solid: "bg-slate-500 text-white shadow-slate-500/20",
    dot: "bg-slate-500",
  },
  {
    value: "Adjustment",
    solid: "bg-teal-500 text-white shadow-teal-500/20",
    dot: "bg-teal-500",
  },
] as const;

/* ---------- Sortable Header ---------- */
const MovementSortableHeader = ({
  columnKey,
  children,
  sortConfig,
  onSort,
  align = "left",
}: {
  columnKey: MovementSortKey;
  children: React.ReactNode;
  sortConfig: MovementSortConfig;
  onSort: (key: MovementSortKey) => void;
  align?: "left" | "center" | "right";
}) => {
  const active = sortConfig?.key === columnKey;
  const icon = (
    <span
      className={cn(
        "shrink-0 transition-transform duration-200",
        active && sortConfig?.direction === "descending" && "rotate-180",
      )}
    >
      {active ? (
        <ChevronDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-30" />
      )}
    </span>
  );

  return (
    <button
      type="button"
      onClick={() => onSort(columnKey)}
      className={cn(
        "relative inline-flex items-center gap-1.5 h-full cursor-pointer",
        "text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors hover:text-primary",
        active
          ? "text-primary"
          : "text-muted-foreground/60 dark:text-slate-400/60",
      )}
    >
      {align === "right" && icon}
      <span>{children}</span>
      {align === "left" && icon}
      {align === "center" && (
        <span className="absolute left-full ml-1 top-1/2 -translate-y-1/2">
          {icon}
        </span>
      )}
    </button>
  );
};

/* ---------- Row Component ---------- */
const MovementRow = memo(function MovementRow({
  movement,
  virtualRow,
  onViewHistory,
  stockLevels,
}: {
  movement: StockMovement;
  virtualRow: import("@tanstack/react-virtual").VirtualItem;
  onViewHistory?: (movement: StockMovement) => void;
  stockLevels?: Map<string, number>;
}) {
  const { t } = useTranslation();
  const isInbound = movement.quantityChange > 0;
  const value = getMovementValue(movement);
  const unitPrice = getMovementUnitPrice(movement);
  // True when the ledger shows the price recorded on the source document
  const hasRecordedPrice = movement.movementPrice != null;
  const isSupplier =
    movement.type === "Purchased" || movement.type === "Returned";

  return (
    <div
      role="row"
      className={cn(
        "absolute top-0 left-0 w-full border-b border-gray-100 dark:border-slate-800 hover:bg-muted/5 dark:hover:bg-slate-800/30 transition-all duration-200 group",
        TABLE_GRID,
      )}
      style={{
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      }}
    >
      {/* Movement Type (icon + color coding reused from InventoryHistoryDialog) */}
      <div className="pl-4 pr-2 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform",
              getEventColor(movement.type),
            )}
          >
            {getEventIcon(movement.type)}
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider leading-tight text-foreground dark:text-slate-200 line-clamp-2">
            {t(`inventory.stockMovement.movementTypes.${movement.type}`, {
              defaultValue: movement.type,
            })}
          </span>
        </div>
      </div>

      {/* Item */}
      <div className="pr-2 min-w-0">
        <div className="flex flex-col min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-black text-sm text-foreground dark:text-slate-200 truncate uppercase tracking-tight cursor-help">
                {movement.itemName ?? t("inventory.stockMovement.deletedItem")}
              </span>
            </TooltipTrigger>
            {movement.itemName && (
              <TooltipContent
                side="top"
                align="start"
                sideOffset={4}
                className="rounded-lg border-none shadow-xl font-black text-[11px] uppercase tracking-wider max-w-[300px] text-wrap bg-foreground text-background dark:bg-slate-800 dark:text-slate-200"
              >
                {movement.itemName}
              </TooltipContent>
            )}
          </Tooltip>
          <div className="flex items-center gap-1.5 min-w-0">
            {movement.phoneBrand && (
              <span className="text-[10px] font-bold text-muted-foreground dark:text-slate-500 uppercase opacity-60 truncate">
                {movement.phoneBrand}
              </span>
            )}
            {movement.itemType && (
              <Badge
                variant="secondary"
                className="bg-muted dark:bg-slate-800 px-1.5 py-0 rounded-md text-[8px] font-black uppercase tracking-widest dark:text-slate-300 shrink-0"
              >
                {movement.itemType}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Counterparty: supplier for purchases, buyer/customer for sales & repairs */}
      <div className="pr-2 min-w-0">
        {movement.movementParty ? (
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={cn(
                "w-6 h-6 rounded-lg border flex items-center justify-center shrink-0",
                isSupplier
                  ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/50"
                  : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50",
              )}
            >
              {isSupplier ? (
                <Building2 className="w-3 h-3" />
              ) : (
                <User className="w-3 h-3" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-black text-foreground dark:text-slate-200 truncate leading-none">
                {movement.movementParty}
              </span>
              <span className="text-[9px] font-bold text-muted-foreground dark:text-slate-500 opacity-60 uppercase tracking-wider mt-0.5 truncate">
                {isSupplier
                  ? t("inventory.stockMovement.party.supplier")
                  : t("inventory.stockMovement.party.buyer")}
                {movement.movementReference
                  ? ` · ${movement.movementReference}`
                  : ""}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest pl-8">
            —
          </span>
        )}
      </div>

      {/* Quantity change bubble */}
      <div className="flex justify-center min-w-0">
        <div
          className={cn(
            "px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm",
            isInbound ? "bg-green-500 text-white" : "bg-red-500 text-white",
          )}
        >
          {isInbound ? `+${movement.quantityChange}` : movement.quantityChange}
        </div>
      </div>

      {/* Quantity left after this movement */}
      <div className="flex justify-center min-w-0">
        <span className="text-[11px] font-black text-foreground dark:text-slate-300 tabular-nums">
          {stockLevels?.get(movement.id) ?? "—"}
        </span>
      </div>

      {/* Unit price at the time of the movement */}
      <div className="text-right pr-4 min-w-0">
        <div className="flex flex-col items-end">
          <span
            className={cn(
              "text-sm font-black tracking-tight",
              hasRecordedPrice
                ? "text-foreground dark:text-slate-200"
                : "text-muted-foreground/60 dark:text-slate-500",
            )}
          >
            {unitPrice.toFixed(2)}
          </span>
          {!hasRecordedPrice && unitPrice > 0 && (
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
              {t("inventory.stockMovement.table.current")}
            </span>
          )}
        </div>
      </div>

      {/* Movement value */}
      <div className="text-right pr-4 min-w-0">
        <span
          className={cn(
            "text-xs font-black tracking-tight",
            value > 0 && "text-green-600 dark:text-green-400",
            value < 0 && "text-red-600 dark:text-red-400",
            value === 0 &&
              "text-muted-foreground dark:text-slate-500 opacity-40",
          )}
        >
          {value > 0 ? "+" : ""}
          {value.toFixed(2)}
        </span>
      </div>

      {/* Date */}
      <div className="pr-2 min-w-0">
        <div className="flex flex-col items-start">
          <span className="text-[11px] font-black text-foreground dark:text-slate-300 leading-none">
            {format(new Date(movement.date), "MMM d, yyyy")}
          </span>
          <span className="text-[9px] font-bold text-muted-foreground dark:text-slate-500 opacity-60 mt-1">
            {format(new Date(movement.date), "p")}
          </span>
        </div>
      </div>

      {/* Actions: full item history */}
      <div className="flex justify-center min-w-0">
        {onViewHistory && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl text-muted-foreground/50 hover:text-primary hover:bg-primary/10 opacity-50 group-hover:opacity-100 focus-visible:opacity-100 transition-all"
                onClick={() => onViewHistory(movement)}
              >
                <History className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="left"
              className="rounded-lg border-none shadow-xl font-black text-[10px] uppercase tracking-wider bg-foreground text-background dark:bg-slate-800 dark:text-slate-200"
            >
              {t("inventory.stockMovement.table.itemHistory")}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
});

/* ---------- Main Table ---------- */
export const StockMovementTable = memo(function StockMovementTable({
  movements,
  totalCount,
  sortConfig,
  onSort,
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
  hasActiveFilters,
  clearFilters,
  typeCounts,
  onViewHistory,
  stockLevels,
}: StockMovementTableProps) {
  const { t } = useTranslation();
  const parentRef = useRef<HTMLDivElement>(null);

  // Number of currently active filters (shown on the Clear button badge)
  const activeFilterCount = [
    searchTerm !== "",
    selectedType !== "All",
    dateRange !== undefined &&
      (dateRange.from !== undefined || dateRange.to !== undefined),
    minPrice !== "",
    maxPrice !== "",
  ].filter(Boolean).length;

  const rowVirtualizer = useVirtualizer({
    count: movements.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
      <TooltipProvider>
        {/* Tier 1: Movement Type Tabs */}
        <div className="flex items-center gap-1.5 px-6 py-3 border-b border-gray-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm overflow-x-auto no-scrollbar">
          {TYPE_TABS.map((tab) => {
            const isActive = selectedType === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() =>
                  setSelectedType(tab.value as HistoryEventType | "All")
                }
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 shrink-0 cursor-pointer select-none",
                  isActive
                    ? cn("shadow-sm scale-[1.02]", tab.solid)
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-slate-800/60",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    isActive ? "bg-white" : tab.dot,
                  )}
                />
                <span>
                  {tab.value === "All"
                    ? t("common.all")
                    : t(`inventory.stockMovement.movementTypes.${tab.value}`, {
                        defaultValue: tab.value,
                      })}
                </span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-md text-[10px] font-black shrink-0",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-muted dark:bg-slate-800 text-muted-foreground",
                  )}
                >
                  {typeCounts[tab.value] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tier 2: Search, Deep Filters & Utilities */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between px-6 py-3 border-b dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
          {/* Item Name Search */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
            <Input
              placeholder={t("inventory.stockMovement.filters.searchItem")}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10 pr-9 rounded-xl h-10 border-gray-200 dark:border-slate-800 focus:ring-primary/20 bg-white dark:bg-slate-950 text-xs font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filters & Tools Cluster */}
          <div className="flex flex-wrap items-center gap-2.5 justify-start lg:justify-end">
            {/* Date Range Picker */}
            <DateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
              placeholder={t("inventory.stockMovement.filters.pickDates")}
              className="w-[170px] h-10 rounded-xl border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950"
              showPresets={true}
            />

            {/* Price / Cost Range */}
            <Select
              value={priceField}
              onValueChange={(value) =>
                setPriceField(value as MovementPriceField)
              }
            >
              <SelectTrigger
                className={cn(
                  "w-auto min-w-[140px] h-10 rounded-xl border font-bold text-xs uppercase tracking-wider px-3",
                  "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl dark:bg-slate-900">
                <SelectItem
                  value="unitPrice"
                  className="font-bold text-xs uppercase tracking-wider py-2.5"
                >
                  {t("inventory.stockMovement.table.unit")}
                </SelectItem>
                <SelectItem
                  value="buyingPrice"
                  className="font-bold text-xs uppercase tracking-wider py-2.5"
                >
                  {t("inventory.table.cost")}
                </SelectItem>
                <SelectItem
                  value="sellingPrice"
                  className="font-bold text-xs uppercase tracking-wider py-2.5"
                >
                  {t("inventory.table.price")}
                </SelectItem>
                <SelectItem
                  value="value"
                  className="font-bold text-xs uppercase tracking-wider py-2.5"
                >
                  {t("inventory.stockMovement.table.value")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              inputMode="decimal"
              placeholder={t("inventory.stockMovement.filters.min")}
              title={t("inventory.stockMovement.filters.equalHint")}
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              className="w-[92px] h-10 rounded-xl border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-xs px-3"
            />
            <span className="text-[10px] font-black text-muted-foreground/40">
              &ndash;
            </span>
            <Input
              type="number"
              inputMode="decimal"
              placeholder={t("inventory.stockMovement.filters.max")}
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              className="w-[92px] h-10 rounded-xl border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-xs px-3"
            />

            <div className="h-6 w-px bg-border/60 dark:bg-slate-800 mx-0.5 hidden sm:block" />

            {/* Clear Active Filters Button */}
            {(hasActiveFilters || activeFilterCount > 0) && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="h-10 px-3 rounded-xl border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-bold uppercase tracking-wider gap-1.5"
                title={t("common.clearAll") || "Reset all filters"}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {t("common.clear") || t("common.reset") || "Reset"}
                </span>
                <span className="h-4 w-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center">
                  {activeFilterCount || 1}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Rows — the sticky header lives inside the same scroller as the
            rows, so both share one content box (scrollbar included) and the
            column titles can never drift out of alignment. */}
        <div
          ref={parentRef}
          className="overflow-auto relative bg-[#fdfdfd] dark:bg-slate-950/20"
          style={{ height: "calc(100vh - 480px)", minHeight: "350px" }}
        >
          <div
            className={cn(
              TABLE_GRID,
              "sticky top-0 z-10 border-b border-gray-100 dark:border-slate-800 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur-sm",
            )}
            style={{ height: HEADER_HEIGHT }}
          >
            <div className="pl-4 pr-2 flex items-center h-full min-w-0">
              <MovementSortableHeader
                columnKey="type"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                {t("inventory.stockMovement.table.movement")}
              </MovementSortableHeader>
            </div>
            <div className="pr-2 flex items-center h-full min-w-0">
              <MovementSortableHeader
                columnKey="itemName"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                {t("inventory.table.product")}
              </MovementSortableHeader>
            </div>
            <div className="pr-2 flex items-center h-full min-w-0">
              <MovementSortableHeader
                columnKey="movementParty"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                {t("inventory.stockMovement.table.party")}
              </MovementSortableHeader>
            </div>
            <div className="flex items-center justify-center h-full min-w-0">
              <MovementSortableHeader
                columnKey="quantityChange"
                sortConfig={sortConfig}
                onSort={onSort}
                align="center"
              >
                {t("inventory.stockMovement.table.qty")}
              </MovementSortableHeader>
            </div>
            <div className="flex items-center justify-center h-full min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap text-muted-foreground/60 dark:text-slate-400/60">
                {t("inventory.stockMovement.table.qtyLeft")}
              </span>
            </div>
            <div className="flex items-center justify-end pr-4 h-full min-w-0">
              <MovementSortableHeader
                columnKey="unitPrice"
                sortConfig={sortConfig}
                onSort={onSort}
                align="right"
              >
                {t("inventory.stockMovement.table.unit")}
              </MovementSortableHeader>
            </div>
            <div className="flex items-center justify-end pr-4 h-full min-w-0">
              <MovementSortableHeader
                columnKey="value"
                sortConfig={sortConfig}
                onSort={onSort}
                align="right"
              >
                {t("inventory.stockMovement.table.value")}
              </MovementSortableHeader>
            </div>
            <div className="pr-2 flex items-center h-full min-w-0">
              <MovementSortableHeader
                columnKey="date"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                {t("common.date")}
              </MovementSortableHeader>
            </div>
            <div />
          </div>

          <div
            className="min-w-[64rem]"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {movements.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-24 px-8 text-center h-full">
                <div className="w-20 h-20 bg-muted/30 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                  <ArrowLeftRight className="w-10 h-10 text-muted-foreground dark:text-slate-600 opacity-20" />
                </div>
                <h3 className="text-lg font-black text-foreground dark:text-slate-100 uppercase tracking-tight mb-2">
                  {t("inventory.stockMovement.table.empty")}
                </h3>
                <p className="text-muted-foreground dark:text-slate-500 max-w-sm text-xs font-bold opacity-60 uppercase tracking-wider">
                  {t("inventory.stockMovement.table.emptyDesc")}
                </p>
              </div>
            ) : (
              rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const movement = movements[virtualRow.index];
                if (!movement) return null;
                return (
                  <MovementRow
                    key={movement.id}
                    movement={movement}
                    virtualRow={virtualRow}
                    onViewHistory={onViewHistory}
                    stockLevels={stockLevels}
                  />
                );
              })
            )}
          </div>
        </div>
      </TooltipProvider>

      {/* Footer Stats */}
      <div className="border-t border-gray-100 dark:border-slate-800 px-6 py-4 bg-muted/5 dark:bg-slate-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            {t("inventory.stockMovement.table.footer", {
              count: movements.length,
              total: totalCount,
            })}
          </span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
          {t("inventory.table.view")}
        </span>
      </div>
    </div>
  );
});
