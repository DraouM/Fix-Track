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
import {
  ArrowUp,
  ArrowUpDown,
  MoreHorizontal,
  AlertTriangle,
  Info,
  Pencil,
  Trash,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VirtualizedTableProps {
  items: InventoryItem[];
  sortConfig: SortConfig;
  onSort: (key: keyof InventoryItem | "profit") => void;
  onEdit: (item: InventoryItem) => void;
  onViewHistory: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

const ROW_HEIGHT = 60;
const HEADER_HEIGHT = 48;

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
          "h-auto p-0 text-sm font-medium hover:bg-transparent hover:text-foreground",
          sortConfig?.key === columnKey && "text-foreground",
          className
        )}
      >
        <div className="flex items-center gap-1.5">
          {children}
          <div
            className={cn(
              "transition-transform",
              sortConfig?.key === columnKey &&
                sortConfig.direction === "descending" &&
                "rotate-180"
            )}
          >
            {sortConfig?.key === columnKey ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
            )}
          </div>
        </div>
      </Button>
    </TooltipTrigger>
    {tooltip && (
      <TooltipContent side="top" align="center">
        <p className="text-xs">{tooltip}</p>
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
}: {
  item: InventoryItem;
  virtualRow: import("@tanstack/react-virtual").VirtualItem;
  onViewHistory: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}) {
  const profit = (item.sellingPrice ?? 0) - (item.buyingPrice ?? 0);
  const isPositive = profit > 0;
  const isNegative = profit < 0;

  const quantity = item.quantityInStock ?? 0;
  const threshold = item.lowStockThreshold ?? 0;
  const isOutOfStock = quantity === 0;
  const isLowStock = quantity > 0 && quantity <= threshold;

  return (
    <div
      key={item.id}
      role="row"
      className="absolute top-0 left-0 w-full flex items-center border-b border-border/40 hover:bg-muted/30 transition-colors group"
      style={{
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      }}
    >
      {/* Product Name */}
      <div className="flex-[2] pl-4 truncate pr-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="truncate block cursor-default text-sm">
              {item.itemName}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" align="center">
            <p>{item.itemName}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Brand */}
      <div className="flex-1">
        <span className="text-sm text-muted-foreground">{item.phoneBrand}</span>
      </div>

      {/* Category */}
      <div className="flex-1">
        <span className="text-sm text-muted-foreground">{item.itemType}</span>
      </div>

      {/* Cost */}
      <div className="flex-1 text-right pr-4 font-mono text-sm text-muted-foreground">
        {(item.buyingPrice ?? 0).toFixed(2)}
      </div>

      {/* Price */}
      <div className="flex-1 text-right pr-4 font-mono text-sm text-foreground">
        {(item.sellingPrice ?? 0).toFixed(2)}
      </div>

      {/* Profit */}
      <div className="flex-1 text-right pr-4">
        <div className="flex items-center justify-end gap-1.5">
          {isPositive && <TrendingUp className="h-3.5 w-3.5 text-green-600" />}
          {isNegative && <TrendingDown className="h-3.5 w-3.5 text-red-600" />}
          <span
            className={cn(
              "font-mono text-sm",
              isPositive && "text-green-600",
              isNegative && "text-red-600",
              !isPositive && !isNegative && "text-muted-foreground"
            )}
          >
            {Math.abs(profit).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Stock */}
      <div className="flex-1 text-right pr-4">
        <div className="flex items-center justify-end gap-1.5">
          {(isOutOfStock || isLowStock) && (
            <AlertTriangle
              className={cn(
                "h-3.5 w-3.5",
                isOutOfStock ? "text-red-500" : "text-amber-500"
              )}
            />
          )}
          <span
            className={cn(
              "font-mono text-sm min-w-[2.5rem] text-right",
              isOutOfStock && "text-red-600 font-medium",
              isLowStock && "text-amber-600",
              !isOutOfStock && !isLowStock && "text-muted-foreground"
            )}
          >
            {quantity}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="w-24 text-center pr-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onViewHistory(item)}>
              <Info className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Item
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(item.id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete Item
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
}: VirtualizedTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  return (
    <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
      <TooltipProvider>
        {/* Header */}
        <div
          className="sticky top-0 bg-muted/30 backdrop-blur-sm border-b border-border/40 z-10"
          style={{ height: HEADER_HEIGHT }}
        >
          <div className="flex w-full h-full items-center text-sm text-muted-foreground">
            <div className="flex-[2] pl-4">
              <SortableHeader
                columnKey="itemName"
                tooltip="Sort by item name"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                Product
              </SortableHeader>
            </div>
            <div className="flex-1">
              <SortableHeader
                columnKey="phoneBrand"
                tooltip="Sort by brand"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                Brand
              </SortableHeader>
            </div>
            <div className="flex-1">
              <SortableHeader
                columnKey="itemType"
                tooltip="Sort by category"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                Category
              </SortableHeader>
            </div>
            <div className="flex-1 text-right pr-4">
              <SortableHeader
                columnKey="buyingPrice"
                tooltip="Sort by cost"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                Cost
              </SortableHeader>
            </div>
            <div className="flex-1 text-right pr-4">
              <SortableHeader
                columnKey="sellingPrice"
                tooltip="Sort by price"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                Price
              </SortableHeader>
            </div>
            <div className="flex-1 text-right pr-4">
              <SortableHeader
                columnKey="profit"
                tooltip="Sort by profit"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                Profit
              </SortableHeader>
            </div>
            <div className="flex-1 text-right pr-4">
              <SortableHeader
                columnKey="quantityInStock"
                tooltip="Sort by stock"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                Stock
              </SortableHeader>
            </div>
            <div className="w-24 text-center pr-4 text-muted-foreground text-sm font-medium">
              Actions
            </div>
          </div>
        </div>

        {/* Rows */}
        <div
          ref={parentRef}
          className="overflow-auto relative"
          style={{ height: "calc(100vh - 280px)", minHeight: "400px" }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = items[virtualRow.index];
              return (
                <InventoryRow
                  key={item.id}
                  item={item}
                  virtualRow={virtualRow}
                  onViewHistory={onViewHistory}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              );
            })}
          </div>
        </div>
      </TooltipProvider>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Info className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No inventory items
          </h3>
          <p className="text-muted-foreground max-w-sm text-sm">
            Add your first item to start tracking inventory and profits.
          </p>
        </div>
      )}

      {/* Footer Stats */}
      {items.length > 0 && (
        <div className="border-t px-4 py-3 bg-muted/20">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {items.length} item{items.length !== 1 ? "s" : ""}
            </span>
            <span className="text-xs">
              Sorted by {sortConfig?.key || "name"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
