"use client";

import React, { useRef, useState, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { InventoryItem } from "@/types/inventory";
import type { SortConfig } from "@/hooks/useInventoryFilters";
import { Badge } from "@/components/ui/badge";
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
  Minus,
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
          "h-auto p-0 font-semibold hover:bg-transparent hover:text-foreground",
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
      <TooltipContent>
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
  const profitPercentage = item.buyingPrice
    ? (profit / item.buyingPrice) * 100
    : 0;

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
      className="absolute top-0 left-0 w-full flex items-center border-b hover:bg-muted/50 transition-colors group"
      style={{
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      }}
    >
      {/* Product Name */}
      <div className="flex-[2] pl-4 font-medium truncate pr-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="truncate block cursor-default">
              {item.itemName}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{item.itemName}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Brand */}
      <div className="flex-1">
        <Badge variant="outline" className="font-medium">
          {item.phoneBrand}
        </Badge>
      </div>

      {/* Category */}
      <div className="flex-1">
        <Badge variant="secondary" className="font-medium">
          {item.itemType}
        </Badge>
      </div>

      {/* Cost */}
      <div className="flex-1 text-right pr-4 font-mono font-semibold">
        ${(item.buyingPrice ?? 0).toFixed(2)}
      </div>

      {/* Price */}
      <div className="flex-1 text-right pr-4 font-mono font-semibold text-blue-600">
        ${(item.sellingPrice ?? 0).toFixed(2)}
      </div>

      {/* Profit */}
      <div className="flex-1 text-right pr-4">
        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              "font-mono text-sm font-semibold px-2 py-1 rounded-md",
              isPositive && "text-green-600 bg-green-50",
              isNegative && "text-red-600 bg-red-50",
              !isPositive && !isNegative && "text-muted-foreground bg-muted"
            )}
          >
            ${Math.abs(profit).toFixed(2)}
          </span>
          <div className="flex items-center gap-1">
            {isPositive && <TrendingUp className="h-3 w-3 text-green-600" />}
            {isNegative && <TrendingDown className="h-3 w-3 text-red-600" />}
            {!isPositive && !isNegative && (
              <Minus className="h-3 w-3 text-muted-foreground" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                isPositive && "text-green-600",
                isNegative && "text-red-600",
                !isPositive && !isNegative && "text-muted-foreground"
              )}
            >
              {profitPercentage >= 0 ? "+" : ""}
              {profitPercentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Stock */}
      <div className="flex-1 text-right pr-4">
        <div className="flex items-center justify-end gap-2">
          {(isOutOfStock || isLowStock) && (
            <AlertTriangle
              className={cn(
                "h-4 w-4",
                isOutOfStock ? "text-red-500" : "text-amber-500"
              )}
            />
          )}
          <Badge
            variant={isOutOfStock ? "destructive" : "secondary"}
            className={cn(
              "font-mono font-semibold min-w-[3rem]",
              isLowStock && "bg-amber-50 text-amber-700 border-amber-200"
            )}
          >
            {quantity}
          </Badge>
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
    <div className="border rounded-lg bg-background shadow-sm">
      <TooltipProvider>
        {/* Header */}
        <div
          className="sticky top-0 bg-muted/50 backdrop-blur-sm border-b z-10"
          style={{ height: HEADER_HEIGHT }}
        >
          <div className="flex w-full h-full items-center text-sm">
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
            <div className="w-24 text-center pr-4 text-muted-foreground font-semibold">
              Actions
            </div>
          </div>
        </div>

        {/* Rows */}
        <div
          ref={parentRef}
          className="overflow-auto"
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
