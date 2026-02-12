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
import { useTranslation } from "react-i18next";

export const InventoryTable = React.memo(function InventoryTable({
  items,
  sortConfig,
  onSort,
  onEdit,
  onViewHistory,
  onDelete,
}: InventoryTableProps) {
  const { t } = useTranslation();
  const { printSticker } = usePrintUtils();
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
      <div className="border dark:border-slate-800 rounded-md">
        <Table>
          {/* --- Table Header --- */}
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortableHeader
                  columnKey="itemName"
                  tooltip={t('inventory.table.tooltips.name')}
                >
                  {t('common.name')}
                </SortableHeader>
              </TableHead>
              <TableHead>{t('inventory.table.brand')}</TableHead>
              <TableHead>{t('inventory.table.category')}</TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  columnKey="buyingPrice"
                  tooltip={t('inventory.table.tooltips.cost')}
                >
                  {t('inventory.table.cost')}
                </SortableHeader>
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  columnKey="sellingPrice"
                  tooltip={t('inventory.table.tooltips.price')}
                >
                  {t('inventory.table.price')}
                </SortableHeader>
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader 
                  columnKey="profit" 
                  tooltip={t('inventory.table.tooltips.profit')}
                >
                  {t('inventory.table.profit')}
                </SortableHeader>
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  columnKey="quantityInStock"
                  tooltip={t('inventory.table.tooltips.stock')}
                >
                  {t('inventory.table.stock')}
                </SortableHeader>
              </TableHead>
              <TableHead className="text-right">{t('inventory.table.actions')}</TableHead>
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
                    className={cn(
                      "dark:border-slate-800",
                      lowStock && "bg-red-50 dark:bg-red-950/30"
                    )}
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
                        profit >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive dark:text-red-400"
                      )}
                    >
                      ${profit.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono",
                        lowStock && "font-bold text-destructive dark:text-red-400"
                      )}
                    >
                      {item.quantityInStock ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => printSticker(item)}
                          disabled={!item.barcode}
                        >
                          {t('inventory.printSticker')}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="dark:bg-slate-900 dark:border-slate-800">
                            <DropdownMenuItem
                              onClick={() => onViewHistory(item)}
                            >
                              {t('common.view')} {t('common.history')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(item)}>
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDelete(item.id)}
                              className="text-destructive dark:text-red-400 focus:text-destructive focus:bg-destructive/10"
                            >
                              {t('common.delete')}
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
                  {t('inventory.table.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>


    </TooltipProvider>
  );
});
