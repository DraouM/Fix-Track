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
import { useTranslation } from "react-i18next";

interface TransactionScannerProps {
  onAddItem: (item: InventoryItem) => void;
  type: "Sale" | "Purchase";
}

export function TransactionScanner({
  onAddItem,
  type,
}: TransactionScannerProps) {
  const { searchItems } = useInventory();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<InventoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Autofocus on mount and keep focused
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const trimmedQuery = query.trim();
      if (trimmedQuery.length >= 2) {
        setIsSearching(true);
        try {
          const res = await searchItems(trimmedQuery);

          // CHECK FOR EXACT BARCODE MATCH
          const exactMatch = res.find((item) => item.barcode === trimmedQuery);
          if (exactMatch && trimmedQuery !== lastScanned) {
            handleSelect(exactMatch);
            setLastScanned(trimmedQuery);
            // Clear last scanned after a bit to allow scanning the same item twice
            setTimeout(() => setLastScanned(null), 1000);
            return;
          }

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
    }, 200); // Shorter debounce for scanning

    return () => clearTimeout(timer);
  }, [query, searchItems, lastScanned]);

  const handleSelect = (item: InventoryItem) => {
    onAddItem(item);
    setQuery("");
    setShowResults(false);
    // Keep focus after adding
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && results.length > 0 && showResults) {
      handleSelect(results[0]);
    }
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <Card className="border dark:border-slate-800 shadow-sm overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <CardContent className="p-3">
          <div className="relative flex items-center gap-3">
            <div className="relative flex-1 group">
              <Search
                className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors",
                  isSearching && "animate-pulse"
                )}
              />
              <Input
                ref={inputRef}
                placeholder={t("transactions_module.scanner.placeholder", {
                  action:
                    type === "Sale"
                      ? t("transactions_module.sale")
                      : t("transactions_module.purchase"),
                })}
                className="pl-12 h-14 text-lg border-none focus-visible:ring-0 bg-transparent"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => query.trim().length >= 2 && setShowResults(true)}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted dark:hover:bg-slate-800 rounded-full transition-all"
                >
                  <X className="h-4 w-4 dark:text-slate-400" />
                </button>
              )}
            </div>
            <div className="w-px h-8 bg-muted-foreground/10 dark:bg-slate-800 hidden sm:block"></div>
            <div 
              className="flex items-center gap-2 px-2 cursor-pointer hover:bg-muted dark:hover:bg-slate-800 rounded-lg transition-colors py-1"
              onClick={() => inputRef.current?.focus()}
            >
              <ScanLine className="h-6 w-6 text-muted-foreground dark:text-slate-500 animate-pulse" />
              <div className="hidden lg:block">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-500 opacity-50">
                  {t("transactions_module.scanner.barcode")}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground dark:text-slate-400">
                  {t("transactions_module.scanner.ready")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 animate-in fade-in slide-in-from-top-2">
          <Card className="border dark:border-slate-800 shadow-xl max-h-[400px] overflow-auto dark:bg-slate-900">
            <CardContent className="p-2">
              {results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((item) => (
                    <button
                      key={item.id}
                      className="w-full text-left p-3 hover:bg-muted dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-between group"
                      onClick={() => handleSelect(item)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-muted dark:bg-slate-800 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground dark:text-slate-100">
                            {item.itemName}
                          </p>
                          <p className="text-[10px] text-muted-foreground dark:text-slate-400 uppercase font-medium tracking-tight">
                            {item.phoneBrand} • {item.itemType}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm text-primary">
                          {formatCurrency(
                            type === "Sale"
                              ? item.sellingPrice
                              : item.buyingPrice
                          )}
                        </p>
                        <p
                          className={cn(
                            "text-[10px] font-bold uppercase",
                            item.quantityInStock !== undefined &&
                              item.quantityInStock <=
                                (item.lowStockThreshold || 5)
                              ? "text-destructive"
                              : "text-muted-foreground dark:text-slate-500 opacity-50"
                          )}
                        >
                          {t("transactions_module.scanner.stock", { count: item.quantityInStock ?? 0 })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground dark:text-slate-500">
                  <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium dark:text-slate-400">
                    {t("transactions_module.scanner.noItems")}
                  </p>
                  <p className="text-xs opacity-60 dark:opacity-40">
                    {t("transactions_module.scanner.noItemsDesc")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
