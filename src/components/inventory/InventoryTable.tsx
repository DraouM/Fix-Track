"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUp, ArrowDown, ArrowUpDown, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  useInventoryState,
  useInventoryActions,
} from "@/context/InventoryContext";
import type { InventoryItem } from "@/types/inventory";

interface InventoryTableProps {
  onEditItem: (id: string) => void;
  onViewHistory: (id: string) => void;
}

// Badge variant helper
function getItemTypeBadgeVariant(type: string) {
  switch (type) {
    case "Screen":
      return "default";
    case "Battery":
      return "secondary";
    case "Charger":
      return "outline";
    default:
      return "secondary";
  }
}

// Sortable header cell
function SortableHeader({
  label,
  column,
}: {
  label: string;
  column: keyof InventoryItem | "profit";
}) {
  const { sortConfig } = useInventoryState();
  const { handleSort } = useInventoryActions();

  return (
    <TableHead
      className="cursor-pointer select-none"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortConfig?.key === column ? (
          sortConfig.direction === "ascending" ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-50" />
        )}
      </div>
    </TableHead>
  );
}

export function InventoryTable({
  onEdit,
  onViewHistory,
}: {
  onEdit: (item: InventoryItem) => void;
  onViewHistory: (item: InventoryItem) => void;
}) {
  // ✅ Get state & actions directly from context
  const { filteredAndSortedItems, loading } = useInventoryState();
  const { deleteInventoryItem } = useInventoryActions();

  const [activeItemId, setActiveItemId] = React.useState<string | null>(null);

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading inventory...
      </div>
    );
  }

  if (filteredAndSortedItems.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No inventory items found.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader label="Name" column="itemName" />
            <SortableHeader label="Brand" column="phoneBrand" />
            <SortableHeader label="Type" column="itemType" />
            <SortableHeader label="Buying" column="buyingPrice" />
            <SortableHeader label="Selling" column="sellingPrice" />
            <SortableHeader label="Profit" column="profit" />
            <SortableHeader label="Qty" column="quantityInStock" />
            <TableHead>Supplier</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredAndSortedItems.map((item) => {
            const profit = (item.sellingPrice ?? 0) - (item.buyingPrice ?? 0);
            const isLowStock =
              item.quantityInStock !== undefined &&
              item.quantityInStock < (item.lowStockThreshold ?? 5);

            return (
              <TableRow
                key={item.id}
                onClick={() => setActiveItemId(item.id)}
                className={cn(
                  "cursor-pointer",
                  activeItemId === item.id && "bg-muted/50",
                  isLowStock && "bg-destructive/10"
                )}
                aria-selected={activeItemId === item.id}
              >
                <TableCell className="font-medium">{item.itemName}</TableCell>
                <TableCell>{item.phoneBrand}</TableCell>
                <TableCell>
                  <Badge variant={getItemTypeBadgeVariant(item.itemType)}>
                    {item.itemType}
                  </Badge>
                </TableCell>
                <TableCell>${item.buyingPrice.toFixed(2)}</TableCell>
                <TableCell>${item.sellingPrice.toFixed(2)}</TableCell>
                <TableCell
                  className={profit >= 0 ? "text-green-600" : "text-red-600"}
                >
                  ${profit.toFixed(2)}
                </TableCell>
                <TableCell
                  className={isLowStock ? "text-red-600 font-semibold" : ""}
                >
                  {item.quantityInStock}
                </TableCell>
                <TableCell>{item.supplierInfo}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewHistory(item)}>
                        View History
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(item)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => deleteInventoryItem(item.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
