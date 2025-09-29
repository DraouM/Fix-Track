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
  Filter,
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

const ROW_HEIGHT = 52;
const HEADER_HEIGHT = 48;

/* ---------- Helpers ---------- */
const getProfitColor = (profit: number) => {
  if (profit > 0) return "text-green-600 bg-green-50 border-green-200";
  if (profit < 0)
    return "text-destructive bg-destructive/10 border-destructive/20";
  return "text-muted-foreground bg-muted border-border";
};

const getStockStatus = (item: InventoryItem) => {
  const quantity = item.quantityInStock ?? 0;
  const threshold = item.lowStockThreshold ?? 0;

  if (quantity === 0)
    return {
      color: "text-destructive bg-destructive/10 border-destructive/20",
      text: "Out of Stock",
    };
  if (quantity <= threshold)
    return {
      color: "text-amber-600 bg-amber-50 border-amber-200",
      text: "Low Stock",
    };
  return {
    color: "text-muted-foreground bg-muted border-border",
    text: "In Stock",
  };
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
          "px-3 py-2 h-auto font-semibold transition-colors hover:bg-accent/50 group",
          sortConfig?.key === columnKey && "bg-accent",
          className
        )}
      >
        <span className="flex items-center gap-1.5">
          {children}
          <span
            className={cn(
              "transition-transform",
              sortConfig?.key === columnKey &&
                sortConfig.direction === "descending" &&
                "rotate-180"
            )}
          >
            {sortConfig?.key === columnKey ? (
              <ArrowUp className="h-3.5 w-3.5 text-primary" />
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 opacity-40 group-hover:opacity-70" />
            )}
          </span>
        </span>
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
  const [hovered, setHovered] = useState(false);

  const profit = (item.sellingPrice ?? 0) - (item.buyingPrice ?? 0);
  const profitPercentage = item.buyingPrice
    ? (profit / item.buyingPrice) * 100
    : 0;
  const stockStatus = getStockStatus(item);

  return (
    <div
      key={item.id}
      role="row"
      className={cn(
        "absolute top-0 left-0 w-full flex items-center border-b transition-colors",
        hovered && "bg-accent/30 shadow-sm",
        stockStatus.color.includes("destructive") && "bg-destructive/5"
      )}
      style={{
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Product Name */}
      <div className="flex-[2] pl-4 font-medium truncate pr-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="truncate block cursor-default">
              {item.itemName}
            </span>
          </TooltipTrigger>
          <TooltipContent>{item.itemName}</TooltipContent>
        </Tooltip>
      </div>

      {/* Brand */}
      <div className="flex-1">
        <Badge variant="secondary" className="truncate border font-medium">
          {item.phoneBrand}
        </Badge>
      </div>

      {/* Category */}
      <div className="flex-1">
        <Badge variant="outline" className="truncate border font-medium">
          {item.itemType}
        </Badge>
      </div>

      {/* Cost */}
      <div className="flex-1 text-right pr-4 font-mono text-sm font-semibold">
        ${(item.buyingPrice ?? 0).toFixed(2)}
      </div>

      {/* Price */}
      <div className="flex-1 text-right pr-4 font-mono text-sm font-semibold text-blue-600">
        ${(item.sellingPrice ?? 0).toFixed(2)}
      </div>

      {/* Profit */}
      <div className="flex-1 text-right pr-4">
        <div className="flex flex-col items-end gap-0.5">
          <span
            className={cn(
              "font-mono text-sm font-semibold px-2 py-1 rounded-md border",
              getProfitColor(profit)
            )}
          >
            ${profit.toFixed(2)}
          </span>
          <span
            className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded",
              profitPercentage >= 0
                ? "text-green-600 bg-green-50"
                : "text-destructive bg-destructive/10"
            )}
          >
            {profitPercentage >= 0 ? "+" : ""}
            {profitPercentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Stock */}
      <div className="flex-1 text-right pr-4">
        <div className="flex items-center justify-end gap-2">
          {(stockStatus.text === "Out of Stock" ||
            stockStatus.text === "Low Stock") && (
            <AlertTriangle
              className={cn(
                "h-3.5 w-3.5",
                stockStatus.text === "Out of Stock"
                  ? "text-destructive"
                  : "text-amber-500"
              )}
            />
          )}
          <div className="flex flex-col items-end">
            <span
              className={cn(
                "font-mono text-sm font-semibold px-2 py-1 rounded-md border",
                stockStatus.color
              )}
            >
              {item.quantityInStock ?? 0}
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">
              {stockStatus.text}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="w-24 text-center pr-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "transition-transform",
                hovered ? "opacity-100 scale-100" : "opacity-70 scale-95"
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onViewHistory(item)}>
              <Info className="h-4 w-4" />
              View History & Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Pencil className="h-4 w-4" />
              Edit Item
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(item.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash className="h-4 w-4" />
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
          className="sticky top-0 bg-background/95 backdrop-blur-sm border-b z-10"
          style={{ height: HEADER_HEIGHT }}
        >
          <div className="flex w-full h-full items-center text-sm font-medium text-foreground">
            <div className="flex-[2] pl-4">
              <SortableHeader
                columnKey="itemName"
                tooltip="Sort by item name"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                Product Name
              </SortableHeader>
            </div>
            <div className="flex-1 flex items-center gap-1 px-3 py-2 text-muted-foreground font-semibold">
              Brand <Filter className="h-3 w-3 opacity-50" />
            </div>
            <div className="flex-1 flex items-center gap-1 px-3 py-2 text-muted-foreground font-semibold">
              Category <Filter className="h-3 w-3 opacity-50" />
            </div>
            <div className="flex-1 text-right pr-4">
              <SortableHeader
                columnKey="buyingPrice"
                tooltip="Sort by purchase price"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                Cost
              </SortableHeader>
            </div>
            <div className="flex-1 text-right pr-4">
              <SortableHeader
                columnKey="sellingPrice"
                tooltip="Sort by selling price"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                Price
              </SortableHeader>
            </div>
            <div className="flex-1 text-right pr-4">
              <SortableHeader
                columnKey="profit"
                tooltip="Sort by profit margin"
                sortConfig={sortConfig}
                onSort={onSort}
              >
                Profit
              </SortableHeader>
            </div>
            <div className="flex-1 text-right pr-4">
              <SortableHeader
                columnKey="quantityInStock"
                tooltip="Sort by stock quantity"
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
          className="overflow-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/30"
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
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Info className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No inventory items found
          </h3>
          <p className="text-muted-foreground max-w-sm">
            Get started by adding your first inventory item to track stock,
            prices, and profits.
          </p>
        </div>
      )}

      {/* Footer Stats */}
      {items.length > 0 && (
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t px-4 py-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {items.length} item{items.length !== 1 ? "s" : ""}
            </span>
            <span>Scroll to load more items</span>
            <span>Virtualized for performance</span>
          </div>
        </div>
      )}
    </div>
  );
});
