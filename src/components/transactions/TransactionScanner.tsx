"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Package, ScanLine, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useInventory } from "@/context/InventoryContext";
import { InventoryItem } from "@/types/inventory";
import { formatCurrency } from "@/lib/clientUtils";
import { cn } from "@/lib/utils";

interface TransactionScannerProps {
  onAddItem: (item: InventoryItem) => void;
  type: "Sale" | "Purchase";
}

export function TransactionScanner({ onAddItem, type }: TransactionScannerProps) {
  const { searchItems } = useInventory();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<InventoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsSearching(true);
        try {
          const res = await searchItems(query);
          setResults(res);
          setShowResults(true);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchItems]);

  const handleSelect = (item: InventoryItem) => {
    onAddItem(item);
    setQuery("");
    setShowResults(false);
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <Card className="border shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardContent className="p-3">
          <div className="relative flex items-center gap-3">
            <div className="relative flex-1 group">
              <Search className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors",
                isSearching && "animate-pulse"
              )} />
              <Input
                placeholder={`Search for items to ${type === "Sale" ? "sell" : "buy"}...`}
                className="pl-12 h-14 text-lg border-none focus-visible:ring-0 bg-transparent"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.trim().length >= 2 && setShowResults(true)}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="w-px h-8 bg-muted-foreground/10 hidden sm:block"></div>
            <div className="flex items-center gap-2 px-2">
               <ScanLine className="h-6 w-6 text-muted-foreground animate-pulse" />
               <div className="hidden lg:block">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">Barcode</p>
                  <p className="text-[10px] font-medium text-muted-foreground">Ready to scan...</p>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 animate-in fade-in slide-in-from-top-2">
          <Card className="border shadow-xl max-h-[400px] overflow-auto">
            <CardContent className="p-2">
              {results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((item) => (
                    <button
                      key={item.id}
                      className="w-full text-left p-3 hover:bg-muted rounded-lg transition-colors flex items-center justify-between group"
                      onClick={() => handleSelect(item)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{item.itemName}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight">
                            {item.phoneBrand} • {item.itemType}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm text-primary">
                          {formatCurrency(type === "Sale" ? item.sellingPrice : item.buyingPrice)}
                        </p>
                        <p className={cn(
                          "text-[10px] font-bold uppercase",
                          item.quantityInStock !== undefined && item.quantityInStock <= (item.lowStockThreshold || 5) ? "text-destructive" : "text-muted-foreground opacity-50"
                        )}>
                          Stock: {item.quantityInStock ?? 0}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                   <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
                   <p className="text-sm font-medium">No items found</p>
                   <p className="text-xs opacity-60">Try searching for something else</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
