"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Barcode,
  QrCode,
  Package,
  Tag,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useInventory } from "@/context/InventoryContext";
import { formatCurrency } from "@/lib/clientUtils";
import type { InventoryItem } from "@/types/inventory";

interface SaleScannerProps {
  items: any[];
  setItems: (items: any[]) => void;
  itemSearch: string;
  setItemSearch: (search: string) => void;
}

export function SaleScanner({
  items,
  setItems,
  itemSearch,
  setItemSearch,
}: SaleScannerProps) {
  const { searchItems } = useInventory();
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search Items
  useEffect(() => {
    const performSearch = async () => {
      if (itemSearch.length > 1) {
        const results = await searchItems(itemSearch);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    };
    performSearch();
  }, [itemSearch, searchItems]);

  const addItem = (invItem: InventoryItem) => {
    const existingIndex = items.findIndex((i: any) => i.item_id === invItem.id);
    if (existingIndex > -1) {
      const newItems = [...items];
      newItems[existingIndex].quantity += 1;
      newItems[existingIndex].total_price =
        newItems[existingIndex].quantity * newItems[existingIndex].unit_price;
      setItems(newItems);
    } else {
      setItems([
        ...items,
        {
          id: `temp-${Date.now()}`,
          sale_id: "", // Will be set on save
          item_id: invItem.id,
          item_name: `${invItem.phoneBrand} - ${invItem.itemName}`,
          quantity: 1,
          unit_price: invItem.sellingPrice || 0,
          total_price: invItem.sellingPrice || 0,
        },
      ]);
    }
    setItemSearch("");
    setSearchResults([]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i: any) => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems(
      items.map((item: any) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return {
            ...item,
            quantity: newQty,
            total_price: newQty * item.unit_price,
          };
        }
        return item;
      })
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-600" />
          Scan Items
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Scan barcode or search items..."
            value={itemSearch}
            onChange={(e) => setItemSearch(e.target.value)}
            className="pl-10 h-10"
          />
          <div className="absolute right-2 top-2 flex gap-1">
            <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0 hover:bg-muted dark:hover:bg-slate-800 transition-colors"
                onClick={() => inputRef.current?.focus()}
            >
              <Barcode className="h-4 w-4" />
            </Button>
            <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0 hover:bg-muted dark:hover:bg-slate-800 transition-colors"
                onClick={() => inputRef.current?.focus()}
            >
              <QrCode className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {itemSearch && (
          <div className="border rounded-md max-h-60 overflow-y-auto">
            {searchResults.length > 0 ? (
              searchResults.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 hover:bg-muted cursor-pointer border-b last:border-0"
                  onClick={() => addItem(item)}
                >
                  <div>
                    <p className="font-medium text-sm">
                      {item.phoneBrand} - {item.itemName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {item.quantityInStock} in stock
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {formatCurrency(item.sellingPrice || 0)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No items found
              </div>
            )}
          </div>
        )}

        {/* Quick Add Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-16 flex flex-col gap-1"
          >
            <Package className="h-5 w-5" />
            <span className="text-xs">Custom Item</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-16 flex flex-col gap-1"
          >
            <Tag className="h-5 w-5" />
            <span className="text-xs">Discount</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-16 flex flex-col gap-1"
          >
            <Zap className="h-5 w-5" />
            <span className="text-xs">Service Fee</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
