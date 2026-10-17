"use client";

import React, { useRef, useState, memo, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { InventoryItem } from "@/types/inventory";
import type { SortConfig } from "@/hooks/useInventoryFilters";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Package,
  ArrowUpDown,
  MoreHorizontal,
  Info,
  Pencil,
  Trash,
  ChevronDown,
  Printer,
  Search,
  RotateCcw,
  X,
  Columns2,
  Smartphone,
  Battery,
  Zap,
  Camera,
  Cpu,
  Shield,
  Headphones,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/context/SettingsContext";
import { CURRENCY_SYMBOLS } from "@/types/settings";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  PHONE_BRANDS,
  ITEM_TYPES,
  PhoneBrand,
  ItemType,
} from "@/types/inventory";
import { Input } from "@/components/ui/input";

/* ---------- Column Visibility Types ---------- */
type ColumnId = "brand" | "category" | "cost" | "price" | "profit" | "stock";

const DEFAULT_COLUMN_VISIBILITY: Record<ColumnId, boolean> = {
  brand: true,
  category: true,
  cost: true,
  price: true,
  profit: true,
  stock: true,
};

type StockHealth = "all" | "in_stock" | "low_stock" | "out_of_stock";

interface VirtualizedTableProps {
  items: InventoryItem[];
  sortConfig: SortConfig;
  onSort: (key: keyof InventoryItem | "profit") => void;
  onEdit: (item: InventoryItem) => void;
  onViewHistory: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onPrint?: (item: InventoryItem) => void;
  // Filter props
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedBrand: string;
  setSelectedBrand: (brand: PhoneBrand) => void;
  selectedType: string;
  setSelectedType: (type: ItemType) => void;
  clearFilters: () => void;
}

const ROW_HEIGHT = 64;
const HEADER_HEIGHT = 44;

/* ---------- Category Icon Helper ---------- */
const getItemTypeIcon = (type?: ItemType | string) => {
  switch (type) {
    case "Screen":
      return <Smartphone className="h-4 w-4 text-sky-500" />;
    case "Battery":
      return <Battery className="h-4 w-4 text-emerald-500" />;
    case "Charging Port":
      return <Zap className="h-4 w-4 text-amber-500" />;
    case "Camera":
      return <Camera className="h-4 w-4 text-purple-500" />;
    case "Motherboard":
      return <Cpu className="h-4 w-4 text-rose-500" />;
    case "Back Glass":
    case "Housing":
      return <Shield className="h-4 w-4 text-indigo-500" />;
    case "Speaker":
    case "Microphone":
      return <Headphones className="h-4 w-4 text-teal-500" />;
    default:
      return <Package className="h-4 w-4 text-muted-foreground/60" />;
  }
};

/* ---------- Sortable Header ---------- */
const SortableHeader = ({
  columnKey,
  children,
  sortConfig,
  onSort,
  className,
  tooltip,
}: {
  columnKey: keyof InventoryItem | "profit";
  children: React.ReactNode;
  sortConfig: SortConfig;
  onSort: (key: keyof InventoryItem | "profit") => void;
  className?: string;
  tooltip?: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
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
    </TooltipTrigger>
    {tooltip && (
      <TooltipContent
        side="top"
        align="center"
        className="rounded-lg border-none shadow-xl font-bold text-[10px] uppercase tracking-wider"
      >
        <p>{tooltip}</p>
      </TooltipContent>
    )}
  </Tooltip>
);

/* ---------- Row Component ---------- */
const InventoryRow = memo(function InventoryRow({
  item,
  virtualRow,
  onViewHistory,
  onEdit,
  onDelete,
  selectedIds,
  onSelectionChange,
  onPrint,
  columnVisibility,
}: {
  item: InventoryItem;
  virtualRow: import("@tanstack/react-virtual").VirtualItem;
  onViewHistory: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onPrint?: (item: InventoryItem) => void;
  currencySymbol: string;
  columnVisibility: Record<ColumnId, boolean>;
}) {
  const { t } = useTranslation();
  const sellingPrice = item.sellingPrice ?? 0;
  const buyingPrice = item.buyingPrice ?? 0;
  const profit = sellingPrice - buyingPrice;
  const isPositive = profit > 0;
  const isNegative = profit < 0;
  const marginPct =
    sellingPrice > 0 ? Math.round((profit / sellingPrice) * 100) : 0;

  const quantity = item.quantityInStock ?? 0;
  const threshold = item.lowStockThreshold ?? 0;
  const isOutOfStock = quantity === 0;
  const isLowStock = quantity > 0 && quantity <= threshold;

  const isSelected = selectedIds?.includes(item.id) || false;

  const handleSelect = () => {
    if (onSelectionChange) {
      if (isSelected) {
        onSelectionChange(selectedIds!.filter((id) => id !== item.id));
      } else {
        onSelectionChange([...(selectedIds || []), item.id]);
      }
    }
  };

  const sku = item.id ? item.id.split("-")[0] : "SKU";

  return (
    <div
      key={item.id}
      role="row"
      className={cn(
        "absolute top-0 left-0 w-full flex items-center border-b border-gray-100 dark:border-slate-800/80 transition-all duration-150 group cursor-pointer",
        isSelected
          ? "bg-primary/[0.04] dark:bg-primary/[0.08] border-l-[3px] border-l-primary"
          : "hover:bg-muted/30 dark:hover:bg-slate-800/40 border-l-[3px] border-l-transparent",
      )}
      style={{
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      }}
      onClick={handleSelect}
    >
      {/* Product with Category Squircle & SKU */}
      <div className="flex-[3] pl-3 pr-2 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Checkbox
            id={`select-${item.id}`}
            checked={isSelected}
            onCheckedChange={() => {
              handleSelect();
            }}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0"
          />

          {/* Visual Category Squircle Icon */}
          <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:shadow-sm transition-transform">
            {getItemTypeIcon(item.itemType)}
          </div>

          <div className="flex flex-col min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-bold text-xs sm:text-sm text-foreground dark:text-slate-200 truncate uppercase tracking-tight cursor-help">
                  {item.itemName}
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="start"
                sideOffset={4}
                className="rounded-lg border-none shadow-xl font-black text-[11px] uppercase tracking-wider max-w-[300px] text-wrap bg-foreground text-background dark:bg-slate-800 dark:text-slate-200"
              >
                {item.itemName}
              </TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-mono font-semibold px-1 py-0.2 rounded bg-muted/70 dark:bg-slate-800 text-muted-foreground">
                {sku}
              </span>
              {item.barcode && (
                <span className="text-[9px] font-mono text-muted-foreground/60 hidden sm:inline">
                  #{item.barcode}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Brand */}
      {columnVisibility.brand && (
        <div className="flex-1">
          <span className="text-[11px] font-bold text-muted-foreground/90 uppercase tracking-wider">
            {item.phoneBrand}
          </span>
        </div>
      )}

      {/* Category */}
      {columnVisibility.category && (
        <div className="flex-1">
          <Badge
            variant="secondary"
            className="bg-muted/70 dark:bg-slate-800/80 border border-border/40 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-300"
          >
            {item.itemType}
          </Badge>
        </div>
      )}

      {/* Cost */}
      {columnVisibility.cost && (
        <div className="flex-1 text-right pr-6">
          <span className="text-xs font-semibold text-muted-foreground/70 tracking-tight">
            {buyingPrice.toFixed(2)}
          </span>
        </div>
      )}

      {/* Price */}
      {columnVisibility.price && (
        <div className="flex-1 text-right pr-6">
          <span className="text-xs sm:text-sm font-bold text-foreground dark:text-slate-200 tracking-tight">
            {sellingPrice.toFixed(2)}
          </span>
        </div>
      )}

      {/* Profit & Margin */}
      {columnVisibility.profit && (
        <div className="flex-1 text-right pr-6">
          <div className="flex flex-col items-end">
            <span
              className={cn(
                "text-xs font-bold tracking-tight",
                isPositive && "text-emerald-600 dark:text-emerald-400",
                isNegative && "text-rose-600 dark:text-rose-400",
                !isPositive &&
                  !isNegative &&
                  "text-muted-foreground dark:text-slate-500 opacity-40",
              )}
            >
              {isPositive ? "+" : ""}
              {profit.toFixed(2)}
            </span>
            <span
              className={cn(
                "text-[9px] font-semibold tracking-tight",
                isPositive && "text-emerald-600/70 dark:text-emerald-400/70",
                isNegative && "text-rose-600/70 dark:text-rose-400/70",
                !isPositive && !isNegative && "text-muted-foreground/40",
              )}
            >
              {isPositive ? `+${marginPct}%` : `${marginPct}%`}
            </span>
          </div>
        </div>
      )}

      {/* Stock - High Visibility Badges */}
      {columnVisibility.stock && (
        <div className="flex-1 text-right pr-6">
          <div className="flex items-center justify-end">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                0 {t("inventory.table.stockLabels.empty")}
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {quantity} ({t("inventory.table.stockLabels.low")})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold text-foreground dark:text-slate-200 bg-muted/40 dark:bg-slate-800/40 border border-border/40">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {quantity}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="w-24 text-center pr-4 flex items-center justify-center gap-1">
        {/* Quick Print - Only visible on hover, subtle */}
        {item.barcode && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrint?.(item);
                }}
                className="h-8 w-8 p-0 rounded-xl hover:bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-all"
              >
                <Printer className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="rounded-lg font-bold text-[10px] uppercase tracking-wider"
            >
              {t("inventory.printSticker")}
            </TooltipContent>
          </Tooltip>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 p-0 rounded-xl hover:bg-white dark:hover:bg-slate-800 border-transparent hover:border-gray-100 dark:hover:border-slate-700 hover:shadow-sm transition-all opacity-40 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4 dark:text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="rounded-2xl border dark:border-slate-800 shadow-2xl p-2 min-w-[160px] dark:bg-slate-900"
          >
            <DropdownMenuItem
              onClick={() => onViewHistory(item)}
              className="rounded-xl font-bold text-xs uppercase tracking-wider py-2"
            >
              <Info className="h-4 w-4 mr-3 opacity-70" /> {t("common.view")}{" "}
              {t("common.history")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onEdit(item)}
              className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 text-primary focus:text-primary focus:bg-primary/5"
            >
              <Pencil className="h-4 w-4 mr-3 opacity-70" /> {t("common.edit")}{" "}
              {t("common.item")}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 mx-1 bg-muted dark:bg-slate-800" />
            <DropdownMenuItem
              onClick={() => onDelete(item.id)}
              className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash className="h-4 w-4 mr-3 opacity-70" /> {t("common.delete")}{" "}
              {t("common.item")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

/* ---------- Main Table ---------- */
export const VirtualizedTable = memo(function VirtualizedTable({
  items,
  sortConfig,
  onSort,
  onViewHistory,
  onEdit,
  onDelete,
  selectedIds,
  onSelectionChange,
  onPrint,
  searchTerm,
  setSearchTerm,
  selectedBrand,
  setSelectedBrand,
  selectedType,
  setSelectedType,
  clearFilters,
}: VirtualizedTableProps) {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const currencySymbol = CURRENCY_SYMBOLS[settings.currency] || "$";
  const parentRef = useRef<HTMLDivElement>(null);
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnId, boolean>
  >(DEFAULT_COLUMN_VISIBILITY);
  const [stockHealthFilter, setStockHealthFilter] =
    useState<StockHealth>("all");

  const toggleColumn = (col: ColumnId) =>
    setColumnVisibility((prev) => ({ ...prev, [col]: !prev[col] }));

  const hiddenCount = Object.values(columnVisibility).filter((v) => !v).length;

  // Number of currently active filters (shown on the Clear button badge)
  const activeFilterCount = [
    searchTerm !== "",
    selectedBrand !== "All",
    selectedType !== "All",
    stockHealthFilter !== "all",
  ].filter(Boolean).length;

  // Real-time stock health metrics
  const healthCounts = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    for (const item of items) {
      const qty = item.quantityInStock ?? 0;
      const threshold = item.lowStockThreshold ?? 0;
      if (qty === 0) outOfStock++;
      else if (qty <= threshold) lowStock++;
      else inStock++;
    }
    return { all: items.length, inStock, lowStock, outOfStock };
  }, [items]);

  // Filter items by selected stock health tab
  const displayItems = useMemo(() => {
    if (stockHealthFilter === "all") return items;
    return items.filter((item) => {
      const qty = item.quantityInStock ?? 0;
      const threshold = item.lowStockThreshold ?? 0;
      if (stockHealthFilter === "out_of_stock") return qty === 0;
      if (stockHealthFilter === "low_stock") return qty > 0 && qty <= threshold;
      if (stockHealthFilter === "in_stock") return qty > threshold;
      return true;
    });
  }, [items, stockHealthFilter]);

  const selectedItems = displayItems.filter((item) =>
    selectedIds?.includes(item.id),
  );
  const isAllSelected =
    displayItems.length > 0 &&
    displayItems.every((item) => selectedIds?.includes(item.id));

  const handleSelectAll = () => {
    if (onSelectionChange) {
      if (isAllSelected) {
        onSelectionChange([]);
      } else {
        onSelectionChange(displayItems.map((item) => item.id));
      }
    }
  };

  const rowVirtualizer = useVirtualizer({
    count: displayItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
      <TooltipProvider>
        {/* Tier 1: Stock Health Status Tabs */}
        <div className="flex items-center gap-1.5 px-6 py-3 border-b border-gray-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setStockHealthFilter("all")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 shrink-0 cursor-pointer select-none",
              stockHealthFilter === "all"
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-slate-800/60",
            )}
          >
            <span>{t("common.all") || "All Items"}</span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-md text-[10px] font-black shrink-0",
                stockHealthFilter === "all"
                  ? "bg-white/20 text-white"
                  : "bg-muted dark:bg-slate-800 text-muted-foreground",
              )}
            >
              {healthCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStockHealthFilter("in_stock")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 shrink-0 cursor-pointer select-none",
              stockHealthFilter === "in_stock"
                ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 scale-[1.02]"
                : "text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-muted/50 dark:hover:bg-slate-800/60",
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full shrink-0",
                stockHealthFilter === "in_stock"
                  ? "bg-white"
                  : "bg-emerald-500",
              )}
            />
            <span>{t("inventory.filters.inStock") || "Healthy Stock"}</span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-md text-[10px] font-black shrink-0",
                stockHealthFilter === "in_stock"
                  ? "bg-white/20 text-white"
                  : "bg-muted dark:bg-slate-800 text-muted-foreground",
              )}
            >
              {healthCounts.inStock}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStockHealthFilter("low_stock")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 shrink-0 cursor-pointer select-none",
              stockHealthFilter === "low_stock"
                ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20 scale-[1.02]"
                : "text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 hover:bg-muted/50 dark:hover:bg-slate-800/60",
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full shrink-0",
                stockHealthFilter === "low_stock" ? "bg-white" : "bg-amber-500",
              )}
            />
            <span>{t("inventory.table.stockLabels.low") || "Low Stock"}</span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-md text-[10px] font-black shrink-0",
                stockHealthFilter === "low_stock"
                  ? "bg-white/20 text-white"
                  : "bg-muted dark:bg-slate-800 text-muted-foreground",
              )}
            >
              {healthCounts.lowStock}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStockHealthFilter("out_of_stock")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 shrink-0 cursor-pointer select-none",
              stockHealthFilter === "out_of_stock"
                ? "bg-rose-500 text-white shadow-sm shadow-rose-500/20 scale-[1.02]"
                : "text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-muted/50 dark:hover:bg-slate-800/60",
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full shrink-0",
                stockHealthFilter === "out_of_stock"
                  ? "bg-white"
                  : "bg-rose-500 animate-pulse",
              )}
            />
            <span>
              {t("inventory.table.stockLabels.empty") || "Out of Stock"}
            </span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-md text-[10px] font-black shrink-0",
                stockHealthFilter === "out_of_stock"
                  ? "bg-white/20 text-white"
                  : "bg-muted dark:bg-slate-800 text-muted-foreground",
              )}
            >
              {healthCounts.outOfStock}
            </span>
          </button>
        </div>

        {/* Tier 2: Search, Deep Filters & Utilities */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between px-6 py-3 border-b dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
            <Input
              placeholder={
                t("common.filter") || "Search inventory by name, brand, SKU..."
              }
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
            {/* Brand Filter */}
            <Select
              value={selectedBrand}
              onValueChange={(value) => setSelectedBrand(value as PhoneBrand)}
            >
              <SelectTrigger
                className={cn(
                  "w-auto min-w-[150px] h-10 rounded-xl border font-bold text-xs uppercase tracking-wider px-3",
                  selectedBrand !== "All"
                    ? "border-primary/50 bg-primary/5 text-primary"
                    : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder={t("inventory.table.brand")} />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl dark:bg-slate-900">
                {PHONE_BRANDS.map((brand) => (
                  <SelectItem
                    key={brand}
                    value={brand}
                    className="font-bold text-xs uppercase tracking-wider py-2.5"
                  >
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as ItemType)}
            >
              <SelectTrigger
                className={cn(
                  "w-auto min-w-[150px] h-10 rounded-xl border font-bold text-xs uppercase tracking-wider px-3",
                  selectedType !== "All"
                    ? "border-primary/50 bg-primary/5 text-primary"
                    : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder={t("inventory.table.category")} />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl dark:bg-slate-900">
                {ITEM_TYPES.map((type) => (
                  <SelectItem
                    key={type}
                    value={type}
                    className="font-bold text-xs uppercase tracking-wider py-2.5"
                  >
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="h-6 w-px bg-border/60 dark:bg-slate-800 mx-0.5 hidden sm:block" />

            {/* Clear Active Filters Button */}
            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearFilters();
                  setStockHealthFilter("all");
                }}
                className="h-10 px-3 rounded-xl border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-bold uppercase tracking-wider gap-1.5"
                title={t("common.clearAll") || "Reset all filters"}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {t("common.clear") || t("common.reset") || "Reset"}
                </span>
                <span className="h-4 w-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              </Button>
            )}

            {/* Column Visibility Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  title={t("common.columns") || "Toggle Columns"}
                  aria-label={t("common.columns") || "Toggle Columns"}
                  className="rounded-xl h-10 w-10 bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 relative shrink-0"
                >
                  <Columns2
                    className={cn(
                      "h-4 w-4",
                      hiddenCount > 0
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                  {hiddenCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-[9px] font-black text-white flex items-center justify-center">
                      {hiddenCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="rounded-2xl border dark:border-slate-800 shadow-2xl p-2 min-w-[180px] dark:bg-slate-900"
              >
                <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-2 py-1.5">
                  Toggle Columns
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1 bg-muted dark:bg-slate-800" />
                {(
                  [
                    { id: "brand", label: t("inventory.table.brand") },
                    { id: "category", label: t("inventory.table.category") },
                    {
                      id: "cost",
                      label: `${t("inventory.table.cost")} (${currencySymbol})`,
                    },
                    {
                      id: "price",
                      label: `${t("inventory.table.price")} (${currencySymbol})`,
                    },
                    {
                      id: "profit",
                      label: `${t("inventory.table.profit")} (${currencySymbol})`,
                    },
                    { id: "stock", label: t("inventory.table.stock") },
                  ] as { id: ColumnId; label: string }[]
                ).map(({ id, label }) => (
                  <DropdownMenuCheckboxItem
                    key={id}
                    checked={columnVisibility[id]}
                    onCheckedChange={() => toggleColumn(id)}
                    className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 cursor-pointer"
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator className="my-1 bg-muted dark:bg-slate-800" />
                <DropdownMenuItem
                  onClick={() => setColumnVisibility(DEFAULT_COLUMN_VISIBILITY)}
                  className="rounded-xl font-bold text-[10px] uppercase tracking-wider py-2 text-primary focus:text-primary focus:bg-primary/5"
                >
                  Reset to default
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Bulk Actions (Contextual) */}
        {selectedIds && selectedIds.length > 0 && (
          <div className="flex items-center justify-between px-6 py-2 bg-primary/5 border-b border-primary/10 animate-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                {selectedIds.length}{" "}
                {
                  t("inventory.bulkActions.selected", {
                    count: selectedIds.length,
                    total: items.length,
                  }).split(" ")[1]
                }{" "}
                {t("common.selected") || "Selected"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectionChange?.([])}
                className="h-7 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/10"
              >
                <X className="h-3 w-3 mr-1.5" />
                {t("inventory.bulkActions.clear")}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() =>
                  onPrint &&
                  selectedItems.length > 0 &&
                  selectedItems.forEach((item) => onPrint(item))
                }
                className="h-8 px-4 rounded-xl bg-primary text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
              >
                <Printer className="h-3.5 w-3.5 mr-2" />
                {t("inventory.printStickers")}
              </Button>
            </div>
          </div>
        )}
        {/* Header */}
        <div
          className="bg-muted/10 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 z-10 shrink-0"
          style={{ height: HEADER_HEIGHT }}
        >
          <div className="flex w-full h-full items-center">
            <div className="flex-[3] pl-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  className="translate-x-0.5 shrink-0"
                />
                <SortableHeader
                  columnKey="itemName"
                  tooltip={t("inventory.table.tooltips.name")}
                  sortConfig={sortConfig}
                  onSort={onSort}
                >
                  {t("inventory.table.product")}
                </SortableHeader>
              </div>
            </div>
            {columnVisibility.brand && (
              <div className="flex-1">
                <SortableHeader
                  columnKey="phoneBrand"
                  tooltip={t("inventory.table.tooltips.brand")}
                  sortConfig={sortConfig}
                  onSort={onSort}
                >
                  {t("inventory.table.brand")}
                </SortableHeader>
              </div>
            )}
            {columnVisibility.category && (
              <div className="flex-1">
                <SortableHeader
                  columnKey="itemType"
                  tooltip={t("inventory.table.tooltips.category")}
                  sortConfig={sortConfig}
                  onSort={onSort}
                >
                  {t("inventory.table.category")}
                </SortableHeader>
              </div>
            )}
            {columnVisibility.cost && (
              <div className="flex-1 text-right pr-6">
                <SortableHeader
                  columnKey="buyingPrice"
                  tooltip={t("inventory.table.tooltips.cost")}
                  sortConfig={sortConfig}
                  onSort={onSort}
                >
                  {t("inventory.table.cost")} ({currencySymbol})
                </SortableHeader>
              </div>
            )}
            {columnVisibility.price && (
              <div className="flex-1 text-right pr-6">
                <SortableHeader
                  columnKey="sellingPrice"
                  tooltip={t("inventory.table.tooltips.price")}
                  sortConfig={sortConfig}
                  onSort={onSort}
                >
                  {t("inventory.table.price")} ({currencySymbol})
                </SortableHeader>
              </div>
            )}
            {columnVisibility.profit && (
              <div className="flex-1 text-right pr-6">
                <SortableHeader
                  columnKey="profit"
                  tooltip={t("inventory.table.tooltips.profit")}
                  sortConfig={sortConfig}
                  onSort={onSort}
                >
                  {t("inventory.table.profit")} ({currencySymbol})
                </SortableHeader>
              </div>
            )}
            {columnVisibility.stock && (
              <div className="flex-1 text-right pr-6">
                <SortableHeader
                  columnKey="quantityInStock"
                  tooltip={t("inventory.table.tooltips.stock")}
                  sortConfig={sortConfig}
                  onSort={onSort}
                >
                  {t("inventory.table.stock")}
                </SortableHeader>
              </div>
            )}
            <div className="w-24 text-center pr-4 text-muted-foreground/60 text-[10px] font-black uppercase tracking-widest">
              {t("inventory.table.actions")}
            </div>
          </div>
        </div>

        {/* Rows */}
        <div
          ref={parentRef}
          className="overflow-auto relative bg-[#fdfdfd] dark:bg-slate-950/20"
          style={{ height: "calc(100vh - 420px)", minHeight: "350px" }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().length > 0 ? (
              rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const item = displayItems[virtualRow.index];
                if (!item) return null;
                return (
                  <InventoryRow
                    key={item.id}
                    item={item}
                    virtualRow={virtualRow}
                    onViewHistory={onViewHistory}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    selectedIds={selectedIds}
                    onSelectionChange={onSelectionChange}
                    onPrint={onPrint}
                    currencySymbol={currencySymbol}
                    columnVisibility={columnVisibility}
                  />
                );
              })
            ) : displayItems.length === 0 ? (
              /* Polished Empty State */
              <div className="flex flex-col items-center justify-center py-20 px-8 text-center h-full">
                <div className="w-16 h-16 bg-muted/40 dark:bg-slate-800/60 rounded-2xl flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-muted-foreground dark:text-slate-500 opacity-40" />
                </div>
                <h3 className="text-base font-bold text-foreground dark:text-slate-100 uppercase tracking-tight mb-1.5">
                  {items.length === 0
                    ? t("inventory.table.empty")
                    : "No Matching Inventory Items"}
                </h3>
                <p className="text-muted-foreground dark:text-slate-500 max-w-sm text-xs font-medium uppercase tracking-wider mb-4">
                  {items.length === 0
                    ? t("inventory.table.emptyDesc")
                    : "Try adjusting your search query, health tab, or category filters."}
                </p>
                {items.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      clearFilters();
                      setStockHealthFilter("all");
                    }}
                    className="rounded-xl font-bold text-xs gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset Filters
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </TooltipProvider>

      {/* Footer Stats */}
      {items.length > 0 && (
        <div className="border-t border-gray-100 dark:border-slate-800 px-6 py-3 bg-muted/5 dark:bg-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {displayItems.length !== items.length ? (
                <>
                  Showing{" "}
                  <strong className="text-foreground dark:text-slate-200">
                    {displayItems.length}
                  </strong>{" "}
                  of{" "}
                  <strong className="text-foreground dark:text-slate-200">
                    {items.length}
                  </strong>{" "}
                  items
                </>
              ) : (
                t("inventory.table.footer", {
                  count: items.length,
                  plural:
                    items.length !== 1
                      ? t("common.items") === "Articles"
                        ? "s"
                        : "s"
                      : "",
                })
              )}
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40">
            {t("inventory.table.view")}
          </span>
        </div>
      )}
    </div>
  );
});
