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

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = "blue",
    suffix,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: "blue" | "green" | "orange" | "red" | "purple";
    suffix?: string;
  }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
      green:
        "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
      orange:
        "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
      red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
      purple:
        "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    };

    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${colorClasses[color]}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              {title}{" "}
              {suffix && <span className="opacity-50 ml-1">({suffix})</span>}
            </span>
          </div>
        </div>
        <div className="flex flex-col">
          <div
            className="text-2xl font-black text-foreground truncate"
            title={String(value)}
          >
            {value}
          </div>
          {subtitle && (
            <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 opacity-70 mt-1">
              <div
                className={`h-1 w-1 rounded-full ${colorClasses[color].replace("text-", "bg-")}`}
              ></div>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/inventory")}
              className="h-10 w-10 rounded-xl border-2 shrink-0 hover:bg-gray-50 dark:hover:bg-slate-800 dark:border-slate-800"
              title={t("inventory.stockMovement.back")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <ArrowLeftRight className="h-6 w-6" />
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                {t("inventory.stockMovement.title")}
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                <span className="text-xs font-black">{statistics.total}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                  {t("inventory.stockMovement.movements")}
                </span>
              </div>
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            {t("inventory.stockMovement.subtitle")}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Activity}
            title={t("inventory.stockMovement.movements")}
            value={statistics.total}
            subtitle={t("inventory.stockMovement.allTime")}
            color="blue"
          />
          <StatCard
            icon={ArrowDownLeft}
            title={t("inventory.stockMovement.inbound")}
            value={statistics.inbound}
            subtitle={t("inventory.stockMovement.inboundDesc")}
            color="green"
          />
          <StatCard
            icon={ArrowUpRight}
            title={t("inventory.stockMovement.outbound")}
            value={statistics.outbound}
            subtitle={t("inventory.stockMovement.outboundDesc")}
            color="red"
          />
          <StatCard
            icon={Scale}
            title={t("inventory.stockMovement.netValue")}
            value={formatNumber(
              statistics.netValue,
              getLocaleForIntl(i18n.language),
            )}
            suffix={settings.currency}
            subtitle={t("inventory.stockMovement.netChange", {
              count: statistics.netChange,
            })}
            color="purple"
          />
        </div>

        {/* Movements Table */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
              {t("inventory.stockMovement.ledgerTitle")}
            </h2>
          </div>
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
