"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal } from "lucide-react";
import type { InventoryItem } from "@/types/inventory";
import type { SortConfig } from "@/hooks/useInventoryFilters";
import { cn } from "@/lib/utils";

export interface InventoryTableProps {
  items: InventoryItem[]; // ✅ Rows to display
  sortConfig: SortConfig; // ✅ Current sorting state
  onSort: (key: keyof InventoryItem | "profit") => void; // ✅ Handle sort clicks
  onEdit: (item: InventoryItem) => void; // ✅ Open InventoryForm
  onViewHistory: (item: InventoryItem) => void; // ✅ Open HistoryDialog
  onDelete: (id: string) => void; // ✅ Delete row
}

import { usePrintUtils } from "@/hooks/usePrintUtils";
import { StickerPreviewDialog } from "@/components/helpers/StickerPreviewDialog";
import { useState } from "react";

export const InventoryTable = React.memo(function InventoryTable({
  items,
  sortConfig,
  onSort,
  onEdit,
  onViewHistory,
  onDelete,
}: InventoryTableProps) {
  const { printSticker } = usePrintUtils();
  const [previewItem, setPreviewItem] = useState<InventoryItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  // Memoized sort indicator to prevent re-renders

  const SortableHeader = ({
    columnKey,
    children,
    className,
    tooltip,
  }: {
    columnKey: keyof InventoryItem | "profit";
    children: React.ReactNode;
    className?: string;
    tooltip?: string;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          onClick={() => onSort(columnKey)}
          className={cn("px-2 py-1 h-auto -ml-2", className)}
        >
          {children}
          <span className="ml-1.5 shrink-0">
            {sortConfig?.key === columnKey ? (
              sortConfig.direction === "ascending" ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )
            ) : (
              <ArrowUpDown className="h-4 w-4 opacity-30" />
            )}
          </span>
        </Button>
      </TooltipTrigger>
      {tooltip && (
        <TooltipContent side="top" align="center">
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      )}
    </Tooltip>
  );

  return (
    <TooltipProvider>
      <div className="border rounded-md">
        <Table>
          {/* --- Table Header --- */}
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortableHeader
                  columnKey="itemName"
                  tooltip="Sort by item name"
                >
                  Name
                </SortableHeader>
              </TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  columnKey="buyingPrice"
                  tooltip="Sort by buying price"
                >
                  Buying
                </SortableHeader>
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  columnKey="sellingPrice"
                  tooltip="Sort by selling price"
                >
                  Selling
                </SortableHeader>
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader columnKey="profit" tooltip="Sort by profit">
                  Profit
                </SortableHeader>
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  columnKey="quantityInStock"
                  tooltip="Sort by stock quantity"
                >
                  Stock
                </SortableHeader>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          {/* --- Table Body --- */}
          <TableBody>
            {items.length > 0 ? (
              items.map((item) => {
                const profit =
                  (item.sellingPrice ?? 0) - (item.buyingPrice ?? 0);
                const lowStock =
                  item.lowStockThreshold != null &&
                  (item.quantityInStock ?? 0) <= item.lowStockThreshold;

                return (
                  <TableRow
                    key={item.id}
                    className={cn(lowStock && "bg-red-50")}
                  >
                    <TableCell className="font-medium">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="truncate block cursor-default">
                            {item.itemName}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="center">
                          <p>{item.itemName}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.phoneBrand}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>{item.itemType}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${item.buyingPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${item.sellingPrice.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono",
                        profit >= 0 ? "text-green-600" : "text-destructive"
                      )}
                    >
                      ${profit.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono",
                        lowStock && "font-bold text-destructive"
                      )}
                    >
                      {item.quantityInStock ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPreviewItem(item);
                            setIsPreviewOpen(true);
                          }}
                          disabled={!item.barcode}
                        >
                          Print Sticker
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onViewHistory(item)}
                            >
                              View History
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(item)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDelete(item.id)}
                              className="text-destructive"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24">
                  No items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {previewItem && (
        <StickerPreviewDialog
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          item={previewItem}
          onConfirm={() => {
            printSticker(previewItem);
          }}
          onCancel={() => {
            setPreviewItem(null);
          }}
        />
      )}
    </TooltipProvider>
  );
});
