"use client";

import React, { useRef, useState, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { InventoryItem } from "@/types/inventory";
import type { SortConfig } from "@/hooks/useInventoryFilters";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  ArrowUp,
  ArrowUpDown,
  MoreHorizontal,
  AlertTriangle,
  Info,
  Pencil,
  Trash,
  TrendingUp,
  TrendingDown,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface VirtualizedTableProps {
  items: InventoryItem[];
  sortConfig: SortConfig;
  onSort: (key: keyof InventoryItem | "profit") => void;
  onEdit: (item: InventoryItem) => void;
  onViewHistory: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

const ROW_HEIGHT = 64;
const HEADER_HEIGHT = 44;

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
          "h-auto p-0 text-[10px] font-black uppercase tracking-widest hover:bg-transparent hover:text-primary transition-colors",
          sortConfig?.key === columnKey
            ? "text-primary"
            : "text-muted-foreground/60",
          className
        )}
      >
        <div className="flex items-center gap-1.5">
          {children}
          <div
            className={cn(
              "transition-transform duration-200",
              sortConfig?.key === columnKey &&
                sortConfig.direction === "descending" &&
                "rotate-180"
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
}: {
  item: InventoryItem;
  virtualRow: import("@tanstack/react-virtual").VirtualItem;
  onViewHistory: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}) {
  const { t } = useTranslation();
  const profit = (item.sellingPrice ?? 0) - (item.buyingPrice ?? 0);
  const isPositive = profit > 0;
  const isNegative = profit < 0;

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

  return (
    <div
      key={item.id}
      role="row"
      className="absolute top-0 left-0 w-full flex items-center border-b border-gray-100 hover:bg-muted/30 transition-all duration-200 group cursor-pointer"
      style={{
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      }}
      onClick={handleSelect}
    >
      {/* Combined Checkbox and Product Name */}
      <div className="flex-[3] pl-2 pr-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Checkbox
            id={`select-${item.id}`}
            checked={isSelected}
            onCheckedChange={() => {
              handleSelect();
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex flex-col min-w-0">
            <span className="font-black text-sm text-foreground truncate uppercase tracking-tight">
              {item.itemName}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">
              {t('common.sku')}: {item.id.split("-")[0]}
            </span>
          </div>
        </div>
      </div>

      {/* Brand */}
      <div className="flex-1">
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
          {item.phoneBrand}
        </span>
      </div>

      {/* Category */}
      <div className="flex-1">
        <Badge
          variant="secondary"
          className="bg-muted px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest"
        >
          {item.itemType}
        </Badge>
      </div>

      {/* Cost */}
      <div className="flex-1 text-right pr-6">
        <span className="text-xs font-bold text-muted-foreground/60 tracking-tight">
          ${(item.buyingPrice ?? 0).toFixed(2)}
        </span>
      </div>

      {/* Price */}
      <div className="flex-1 text-right pr-6">
        <span className="text-sm font-black text-foreground tracking-tight">
          ${(item.sellingPrice ?? 0).toFixed(2)}
        </span>
      </div>

      {/* Profit */}
      <div className="flex-1 text-right pr-6">
        <div className="flex items-center justify-end gap-1.5">
          <span
            className={cn(
              "text-xs font-black tracking-tight",
              isPositive && "text-green-600",
              isNegative && "text-red-600",
              !isPositive && !isNegative && "text-muted-foreground/40"
            )}
          >
            {isPositive ? "+" : ""}
            {profit.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Stock */}
      <div className="flex-1 text-right pr-6">
        <div className="flex items-center justify-end gap-2 text-right">
          <div className="flex flex-col items-end">
            <span
              className={cn(
                "text-sm font-black tracking-tight",
                isOutOfStock && "text-red-600",
                isLowStock && "text-orange-600",
                !isOutOfStock && !isLowStock && "text-foreground"
              )}
            >
              {quantity}
            </span>
            {(isOutOfStock || isLowStock) && (
              <span
                className={cn(
                  "text-[8px] font-black uppercase tracking-tighter",
                  isOutOfStock ? "text-red-500" : "text-orange-500"
                )}
              >
                {isOutOfStock ? "EMPTY" : "LOW"}
              </span>
            )}
          </div>
          <div
            className={cn(
              "h-1.5 w-1.5 rounded-full shrink-0",
              isOutOfStock
                ? "bg-red-500 animate-pulse"
                : isLowStock
                ? "bg-orange-500"
                : "bg-green-500"
            )}
          ></div>
        </div>
      </div>

      {/* Actions */}
      <div className="w-24 text-center pr-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 p-0 rounded-xl hover:bg-white border-transparent hover:border-gray-100 hover:shadow-sm transition-all opacity-40 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="rounded-2xl border-none shadow-2xl p-2 min-w-[160px]"
          >
            <DropdownMenuItem
              onClick={() => onViewHistory(item)}
              className="rounded-xl font-bold text-xs uppercase tracking-wider py-2"
            >
              <Info className="h-4 w-4 mr-3 opacity-70" /> {t('common.view')} {t('common.history')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onEdit(item)}
              className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 text-primary focus:text-primary focus:bg-primary/5"
            >
              <Pencil className="h-4 w-4 mr-3 opacity-70" /> {t('common.edit')} {t('common.item')}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 mx-1 bg-muted" />
            <DropdownMenuItem
              onClick={() => onDelete(item.id)}
              className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash className="h-4 w-4 mr-3 opacity-70" /> {t('common.delete')} {t('common.item')}
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
}: VirtualizedTableProps) {
  const { t } = useTranslation();
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
      <TooltipProvider>
        {/* Header */}
        <div
          className="bg-muted/10 backdrop-blur-sm border-b border-gray-100 z-10 shrink-0"
          style={{ height: HEADER_HEIGHT }}
        >
          <div className="flex w-full h-full items-center">
            <div className="flex-[3] pl-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  {t('common.product')}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <SortableHeader
                columnKey="phoneBrand"
                tooltip="Sort by brand"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                {t('common.brand')}
              </SortableHeader>
            </div>
            <div className="flex-1">
              <SortableHeader
                columnKey="itemType"
                tooltip="Sort by category"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                {t('common.category')}
              </SortableHeader>
            </div>
            <div className="flex-1 text-right pr-6">
              <SortableHeader
                columnKey="buyingPrice"
                tooltip="Sort by cost"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                {t('common.cost')}
              </SortableHeader>
            </div>
            <div className="flex-1 text-right pr-6">
              <SortableHeader
                columnKey="sellingPrice"
                tooltip="Sort by price"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                {t('common.price')}
              </SortableHeader>
            </div>
            <div className="flex-1 text-right pr-6">
              <SortableHeader
                columnKey="profit"
                tooltip="Sort by profit"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                {t('common.profit')}
              </SortableHeader>
            </div>
            <div className="flex-1 text-right pr-6">
              <SortableHeader
                columnKey="quantityInStock"
                tooltip="Sort by stock"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                {t('common.stock')}
              </SortableHeader>
            </div>
            <div className="w-24 text-center pr-4 text-muted-foreground/60 text-[10px] font-black uppercase tracking-widest">
              Actions
            </div>
          </div>
        </div>

        {/* Rows */}
        <div
          ref={parentRef}
          className="overflow-auto relative bg-[#fdfdfd]"
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
                const item = items[virtualRow.index];
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
                  />
                );
              })
            ) : items.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-24 px-8 text-center h-full">
                <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
                  <Package className="w-10 h-10 text-muted-foreground/20" />
                </div>
                <h3 className="text-lg font-black text-foreground uppercase tracking-tight mb-2">
                  Inventory is empty
                </h3>
                <p className="text-muted-foreground max-w-sm text-xs font-bold opacity-60 uppercase tracking-wider">
                  Add items to your catalog to start tracking stock levels and
                  potential profits.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </TooltipProvider>

      {/* Footer Stats */}
      {items.length > 0 && (
        <div className="border-t border-gray-100 px-6 py-4 bg-muted/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Showing {items.length} Catalog Item{items.length !== 1 ? "s" : ""}
            </span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
            Optimized Virtualized View
          </span>
        </div>
      )}
    </div>
  );
});
