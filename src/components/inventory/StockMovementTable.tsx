"use client";

import React, { useRef, useState, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { StockMovement, HistoryEventType } from "@/types/inventory";
import { HISTORY_EVENT_TYPES } from "@/types/inventory";
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
  Filter,
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
  // Opens the detailed history of the item behind the movement
  onViewHistory?: (movement: StockMovement) => void;
  // Running stock level after each movement (movement id → qty left)
  stockLevels?: Map<string, number>;
}

const ROW_HEIGHT = 60;
const HEADER_HEIGHT = 44;

/* ---------- Sortable Header ---------- */
const MovementSortableHeader = ({
  columnKey,
  children,
  sortConfig,
  onSort,
  className,
}: {
  columnKey: MovementSortKey;
  children: React.ReactNode;
  sortConfig: MovementSortConfig;
  onSort: (key: MovementSortKey) => void;
  className?: string;
}) => (
  <Button
    variant="ghost"
    onClick={() => onSort(columnKey)}
    className={cn(
      "h-auto p-0 text-[10px] font-black uppercase tracking-widest hover:bg-transparent hover:text-primary dark:hover:text-primary transition-colors",
      sortConfig?.key === columnKey
        ? "text-primary"
        : "text-muted-foreground/60 dark:text-slate-400/60",
      className,
    )}
  >
    <div className="flex items-center gap-1.5">
      {children}
      <div
        className={cn(
          "transition-transform duration-200",
          sortConfig?.key === columnKey &&
            sortConfig.direction === "descending" &&
            "rotate-180",
        )}
      >
        {sortConfig?.key === columnKey ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-20" />
        )}
      </div>
    </div>
  </Button>
);

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
      className="absolute top-0 left-0 w-full flex items-center border-b border-gray-100 dark:border-slate-800 hover:bg-muted/5 dark:hover:bg-slate-800/30 transition-all duration-200 group"
      style={{
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      }}
    >
      {/* Movement Type (icon + color coding reused from InventoryHistoryDialog) */}
      <div className="w-52 pl-4 pr-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform",
              getEventColor(movement.type),
            )}
          >
            {getEventIcon(movement.type)}
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-foreground dark:text-slate-200 truncate">
            {t(`inventory.stockMovement.movementTypes.${movement.type}`, {
              defaultValue: movement.type,
            })}
          </span>
        </div>
      </div>

      {/* Item */}
      <div className="flex-[2] pr-2 min-w-0">
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
      <div className="flex-[1.4] pr-2 min-w-0">
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
      <div className="w-24 shrink-0 flex justify-center">
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
      <div className="w-20 shrink-0 flex justify-center">
        <span className="text-[11px] font-black text-foreground dark:text-slate-300 tabular-nums">
          {stockLevels?.get(movement.id) ?? "—"}
        </span>
      </div>

      {/* Unit price at the time of the movement */}
      <div className="flex-1 text-right pr-6 min-w-0">
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
      <div className="flex-1 text-right pr-6 min-w-0">
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
      <div className="w-44 shrink-0 pr-2">
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
      <div className="w-14 shrink-0 flex justify-center pr-2">
        {onViewHistory && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl text-muted-foreground/50 hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all"
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
  onViewHistory,
  stockLevels,
}: StockMovementTableProps) {
  const { t } = useTranslation();
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: movements.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
      <TooltipProvider>
        {/* Search and Filters Bar */}
        <div className="flex flex-col gap-4 px-6 py-4 border-b dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Item Name Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <Input
                placeholder={t("inventory.stockMovement.filters.searchItem")}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10 rounded-xl h-11 border-gray-200 dark:border-slate-800 focus:ring-primary/20 bg-white dark:bg-slate-950 font-bold text-sm"
              />
            </div>

            <div className="flex items-center gap-1">
              <Filter className="h-4 w-4 text-gray-500 dark:text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden sm:block">
                {t("common.filters")}
              </span>
            </div>

            {/* Movement Type Filter */}
            <Select
              value={selectedType}
              onValueChange={(value) =>
                setSelectedType(value as HistoryEventType | "All")
              }
            >
              <SelectTrigger className="w-full md:w-[170px] h-11 rounded-xl border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-black text-[10px] uppercase tracking-wider">
                <SelectValue placeholder={t("common.type")} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl dark:bg-slate-900">
                <SelectItem
                  value="All"
                  className="font-black text-[10px] uppercase tracking-widest py-3"
                >
                  {t("inventory.stockMovement.filters.allTypes")}
                </SelectItem>
                {HISTORY_EVENT_TYPES.map((type) => (
                  <SelectItem
                    key={type}
                    value={type}
                    className="font-black text-[10px] uppercase tracking-widest py-3"
                  >
                    {t(`inventory.stockMovement.movementTypes.${type}`, {
                      defaultValue: type,
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range Picker */}
            <DateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
              placeholder={t("inventory.stockMovement.filters.pickDates")}
              className="h-11 rounded-xl border-2 border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-black text-[10px] uppercase tracking-wider"
            />

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl h-11 w-11 bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-muted-foreground hover:text-red-500 transition-colors"
                onClick={clearFilters}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Price / Cost range row */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
              {t("inventory.stockMovement.filters.priceRange")}
            </span>
            <Select
              value={priceField}
              onValueChange={(value) =>
                setPriceField(value as MovementPriceField)
              }
            >
              <SelectTrigger className="w-[120px] h-9 rounded-xl border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-black text-[9px] uppercase tracking-wider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl dark:bg-slate-900">
                <SelectItem
                  value="unitPrice"
                  className="font-black text-[9px] uppercase tracking-widest py-2.5"
                >
                  {t("inventory.stockMovement.table.unit")}
                </SelectItem>
                <SelectItem
                  value="buyingPrice"
                  className="font-black text-[9px] uppercase tracking-widest py-2.5"
                >
                  {t("inventory.table.cost")}
                </SelectItem>
                <SelectItem
                  value="sellingPrice"
                  className="font-black text-[9px] uppercase tracking-widest py-2.5"
                >
                  {t("inventory.table.price")}
                </SelectItem>
                <SelectItem
                  value="value"
                  className="font-black text-[9px] uppercase tracking-widest py-2.5"
                >
                  {t("inventory.stockMovement.table.value")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              inputMode="decimal"
              placeholder={t("inventory.stockMovement.filters.min")}
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              className="w-[110px] h-9 rounded-xl border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-xs px-3"
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
              className="w-[110px] h-9 rounded-xl border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-xs px-3"
            />
            <span className="text-[9px] font-bold text-muted-foreground/50 opacity-70">
              {t("inventory.stockMovement.filters.equalHint")}
            </span>
          </div>
        </div>

        {/* Header */}
        <div
          className="bg-muted/10 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 z-10 shrink-0"
          style={{ height: HEADER_HEIGHT }}
        >
          <div className="flex w-full h-full items-center">
            <div className="w-52 pl-4 shrink-0">
              <MovementSortableHeader
                columnKey="type"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                {t("inventory.stockMovement.table.movement")}
              </MovementSortableHeader>
            </div>
            <div className="flex-[2] pr-2 min-w-0">
              <MovementSortableHeader
                columnKey="itemName"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                {t("inventory.table.product")}
              </MovementSortableHeader>
            </div>
            <div className="flex-[1.4] pr-2 min-w-0">
              <MovementSortableHeader
                columnKey="movementParty"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                {t("inventory.stockMovement.table.party")}
              </MovementSortableHeader>
            </div>
            <div className="w-24 shrink-0 flex justify-center">
              <MovementSortableHeader
                columnKey="quantityChange"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                {t("inventory.stockMovement.table.qty")}
              </MovementSortableHeader>
            </div>
            <div className="w-20 shrink-0 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              {t("inventory.stockMovement.table.qtyLeft")}
            </div>
            <div className="flex-1 text-right pr-6">
              <MovementSortableHeader
                columnKey="unitPrice"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                {t("inventory.stockMovement.table.unit")}
              </MovementSortableHeader>
            </div>
            <div className="flex-1 text-right pr-6">
              <MovementSortableHeader
                columnKey="value"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                {t("inventory.stockMovement.table.value")}
              </MovementSortableHeader>
            </div>
            <div className="w-44 shrink-0 pr-2">
              <MovementSortableHeader
                columnKey="date"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                {t("common.date")}
              </MovementSortableHeader>
            </div>
            <div className="w-14 shrink-0" />
          </div>
        </div>

        {/* Rows */}
        <div
          ref={parentRef}
          className="overflow-auto relative bg-[#fdfdfd] dark:bg-slate-950/20"
          style={{ height: "calc(100vh - 480px)", minHeight: "350px" }}
        >
          <div
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
