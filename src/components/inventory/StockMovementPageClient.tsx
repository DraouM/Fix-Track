"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  ArrowLeftRight,
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Activity,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEvent } from "@/context/EventContext";
import { useInventory } from "@/context/InventoryContext";
import { useSettings } from "@/context/SettingsContext";
import { formatNumber, getLocaleForIntl } from "@/lib/formatters";
import type { StockMovement } from "@/types/inventory";
import { mapMovementFromDB, type StockMovementDB } from "@/lib/stockMovement";
import {
  useStockMovementFilters,
  getMovementValue,
  computeStockLevels,
} from "@/hooks/useStockMovementFilters";
import { StockMovementTable } from "./StockMovementTable";
import { InventoryHistoryDialog } from "./InventoryHistoryDialog";

export default function StockMovementPageClient() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { settings } = useSettings();

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  // Item whose detailed history is being displayed in the dialog
  const [historyItemId, setHistoryItemId] = useState<string | null>(null);
  const { getItemById } = useInventory();

  const fetchMovements = useCallback(async () => {
    try {
      const rows = await invoke<StockMovementDB[]>("get_all_stock_movements");
      setMovements(rows.map(mapMovementFromDB));
    } catch (err) {
      console.error("Failed to fetch stock movements:", err);
      toast.error(`${t("inventory.stockMovement.loadError")}: ${err}`);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchMovements();
  }, [fetchMovements]);

  // Refresh the ledger when other modules change stock-related data
  const debouncedRefetchRef = React.useRef<NodeJS.Timeout | null>(null);
  const handleRefetch = useCallback(() => {
    if (debouncedRefetchRef.current) clearTimeout(debouncedRefetchRef.current);
    debouncedRefetchRef.current = setTimeout(() => void fetchMovements(), 150);
  }, [fetchMovements]);
  useEffect(() => {
    return () => {
      if (debouncedRefetchRef.current)
        clearTimeout(debouncedRefetchRef.current);
    };
  }, []);
  useEvent("financial-data-change", handleRefetch);
  useEvent("repair-updated", handleRefetch);

  const {
    searchTerm,
    setSearchTerm,
    selectedType,
    setSelectedType,
    dateRange,
    setDateRange,
    priceField,
    setPriceField,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    sortConfig,
    handleSort,
    hasActiveFilters,
    clearFilters,
    filteredAndSortedMovements,
    totalCount,
  } = useStockMovementFilters(movements);

  // Running stock level after each movement (computed on the full ledger)
  const stockLevels = useMemo(() => computeStockLevels(movements), [movements]);

  const handleViewHistory = useCallback(
    (movement: StockMovement) => setHistoryItemId(movement.itemId),
    [],
  );

  // Global statistics (computed on the full ledger, not the filtered view)
  const statistics = useMemo(() => {
    const inbound = movements
      .filter((m) => m.quantityChange > 0)
      .reduce((sum, m) => sum + m.quantityChange, 0);
    const outbound = movements
      .filter((m) => m.quantityChange < 0)
      .reduce((sum, m) => sum + Math.abs(m.quantityChange), 0);
    const netValue = movements.reduce((sum, m) => sum + getMovementValue(m), 0);

    return {
      total: movements.length,
      inbound,
      outbound,
      netChange: inbound - outbound,
      netValue,
    };
  }, [movements]);

  // Per movement-type counts for the Tier 1 filter tabs (full ledger)
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { All: movements.length };
    for (const m of movements) {
      counts[m.type] = (counts[m.type] ?? 0) + 1;
    }
    return counts;
  }, [movements]);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Unified Command Header & Integrated Metrics */}
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-4 sm:p-6 rounded-3xl border border-gray-200/70 dark:border-slate-800 shadow-sm space-y-5">
          {/* Top Row: Title & Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3.5 flex-wrap">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push("/inventory")}
                className="h-10 w-10 rounded-xl border shrink-0 bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800"
                title={t("inventory.stockMovement.back")}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <ArrowLeftRight className="h-5 w-5" />
              </div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <h1 className="text-xl font-black tracking-tight text-foreground">
                  {t("inventory.stockMovement.title")}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent">
                  <span className="text-xs font-black text-primary">
                    {statistics.total}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t("inventory.stockMovement.movements")}
                  </span>
                </span>
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              {t("inventory.stockMovement.subtitle")}
            </p>
          </div>

          {/* Bottom Row: Connected High-Density Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-100 dark:border-slate-800/80">
            {/* Metric 1: Total Movements */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/70 dark:border-blue-900/30 transition-all">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <Activity className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70 truncate">
                  {t("inventory.stockMovement.movements")}
                </span>
                <span className="text-lg font-black text-foreground truncate">
                  {statistics.total}
                </span>
              </div>
            </div>

            {/* Metric 2: Inbound */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/70 dark:border-emerald-900/30 transition-all">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70 truncate">
                  {t("inventory.stockMovement.inbound")}
                </span>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 truncate">
                  +{statistics.inbound}
                </span>
              </div>
            </div>

            {/* Metric 3: Outbound */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100/70 dark:border-rose-900/30 transition-all">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70 truncate">
                  {t("inventory.stockMovement.outbound")}
                </span>
                <span className="text-lg font-black text-rose-700 dark:text-rose-400 truncate">
                  -{statistics.outbound}
                </span>
              </div>
            </div>

            {/* Metric 4: Net Value */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100/70 dark:border-purple-900/30 transition-all">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                <Scale className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70 truncate">
                  {t("inventory.stockMovement.netValue")}
                </span>
                <span className="text-lg font-black text-purple-700 dark:text-purple-400 truncate">
                  {formatNumber(
                    statistics.netValue,
                    getLocaleForIntl(i18n.language),
                  )}{" "}
                  <span className="text-xs font-bold opacity-75">
                    {settings.currency}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Movements Table */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <StockMovementTable
                movements={filteredAndSortedMovements}
                totalCount={totalCount}
                sortConfig={sortConfig}
                onSort={handleSort}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                dateRange={dateRange}
                setDateRange={setDateRange}
                priceField={priceField}
                setPriceField={setPriceField}
                minPrice={minPrice}
                setMinPrice={setMinPrice}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                hasActiveFilters={hasActiveFilters}
                clearFilters={clearFilters}
                typeCounts={typeCounts}
                onViewHistory={handleViewHistory}
                stockLevels={stockLevels}
              />
            </div>
          )}
        </div>

        {/* Detailed per-item history (reused dialog, fed with ledger data) */}
        <InventoryHistoryDialog
          open={historyItemId !== null}
          onOpenChange={(open) => !open && setHistoryItemId(null)}
          item={historyItemId ? (getItemById(historyItemId) ?? null) : null}
          historyEvents={
            historyItemId
              ? movements.filter((m) => m.itemId === historyItemId)
              : []
          }
        />
      </div>
    </div>
  );
}
