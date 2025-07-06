'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import type { InventoryItem, ItemType } from '@/types/inventory';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (itemId: string) => void;
  onViewHistory: (item: InventoryItem) => void;
  onSort: (key: keyof InventoryItem | 'profit') => void;
  sortConfig: { key: keyof InventoryItem | 'profit'; direction: 'ascending' | 'descending' } | null;
}

const getItemTypeBadgeVariant = (itemType: ItemType): "default" | "secondary" | "destructive" | "outline" => {
  switch (itemType) {
    case 'Battery': return 'default';
    case 'Screen': return 'secondary';
    case 'Charger': return 'destructive'; // Example, can customize
    case 'Motherboard': return 'outline';
    case 'Cable': return 'default'; // Example
    case 'Case': return 'secondary'; // Example
    default: return 'outline';
  }
}

export function InventoryTable({ items, onEdit, onDelete, onViewHistory, onSort, sortConfig }: InventoryTableProps) {
  if (items.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No inventory items found. Try adjusting your filters or adding new items.</p>;
  }

  const SortableHeader = ({ columnKey, children, className }: { columnKey: keyof InventoryItem | 'profit', children: React.ReactNode, className?: string }) => (
    <Button variant="ghost" onClick={() => onSort(columnKey)} className={cn("px-2 py-1 h-auto -ml-2", className)}>
      {children}
      <span className="ml-1.5 shrink-0">
        {sortConfig?.key === columnKey
          ? (sortConfig.direction === 'ascending'
            ? <ArrowUp className="h-4 w-4" />
            : <ArrowDown className="h-4 w-4" />)
          : <ArrowUpDown className="h-4 w-4 opacity-30" />
        }
      </span>
    </Button>
  );


  return (
    <div className="rounded-md border">
      <Table>
        <TableCaption>A list of your inventory items.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>
                <SortableHeader columnKey="itemName">Item Name</SortableHeader>
            </TableHead>
            <TableHead>
                <SortableHeader columnKey="phoneBrand">Brand</SortableHeader>
            </TableHead>
            <TableHead>
                <SortableHeader columnKey="itemType">Type</SortableHeader>
            </TableHead>
            <TableHead className="text-right">
                <SortableHeader columnKey="buyingPrice" className="-mr-2">Buy Price</SortableHeader>
            </TableHead>
            <TableHead className="text-right">
                <SortableHeader columnKey="sellingPrice" className="-mr-2">Sell Price</SortableHeader>
            </TableHead>
            <TableHead className="text-right">
                <SortableHeader columnKey="profit" className="-mr-2">Profit</SortableHeader>
            </TableHead>
            <TableHead className="text-right">
                <SortableHeader columnKey="quantityInStock" className="-mr-2">Stock</SortableHeader>
            </TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const profit = item.sellingPrice - item.buyingPrice;
            const isLowStock = item.quantityInStock !== undefined && item.quantityInStock < 5;
            return (
              <TableRow key={item.id} className={isLowStock ? 'bg-destructive/10' : ''}>
                <TableCell className="font-medium">{item.itemName}</TableCell>
                <TableCell>
                  <Badge variant="outline">{item.phoneBrand}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getItemTypeBadgeVariant(item.itemType)}>{item.itemType}</Badge>
                </TableCell>
                <TableCell className="text-right">${item.buyingPrice.toFixed(2)}</TableCell>
                <TableCell className="text-right">${item.sellingPrice.toFixed(2)}</TableCell>
                <TableCell className={`text-right ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${profit.toFixed(2)}
                </TableCell>
                <TableCell className={`text-right ${isLowStock ? 'text-destructive font-semibold' : ''}`}>
                  {item.quantityInStock ?? 'N/A'}
                </TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewHistory(item)}>
                        <Icons.history className="mr-2 h-4 w-4" /> View History
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(item)}>
                        <Icons.edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Icons.trash className="mr-2 h-4 w-4" /> Delete
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
