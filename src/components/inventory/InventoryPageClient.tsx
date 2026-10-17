"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  InventoryProvider,
  useInventoryContext,
} from "@/context/InventoryContext";
import { VirtualizedTable } from "./VirtualizedTable";
import { InventoryForm } from "./InventoryForm";
import { InventoryHistoryDialog } from "./InventoryHistoryDialog";
import type { StockMovement, InventoryItem } from "@/types/inventory";
import { mapMovementFromDB, type StockMovementDB } from "@/lib/stockMovement";
import { PhoneBrand, ItemType } from "@/types/inventory";
import { useTranslation } from "react-i18next";
import { usePrintUtils } from "@/hooks/usePrintUtils";
import {
  OPEN_NEW_ITEM_EVENT,
  PENDING_NEW_ITEM_KEY,
} from "@/hooks/useAddItemShortcut";
import { exportInventoryToCSV } from "@/lib/exportUtils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { Icons } from "../icons";
import {
  Package,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Download,
  Upload,
  Plus,
  Search,
  RotateCcw,
  Loader2,
  ArrowRight,
  ArrowLeftRight,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib";
import { useSettings } from "@/context/SettingsContext";
import {
  formatCurrency as formatCurrencyCentralized,
  formatNumber,
  getLocaleForIntl,
} from "@/lib/formatters";

// Seconds the delete-confirmation dialog stays open before it auto-cancels.
const DELETE_CONFIRM_SECONDS = 10;

export function InventoryPageInner() {
  const {
    inventoryItems,
    filteredAndSortedItems,
    sortConfig,
    handleSort,
    deleteInventoryItem,
    getItemById,
    searchTerm,
    setSearchTerm,
    selectedBrand,
    setSelectedBrand,
    selectedType,
    setSelectedType,
    clearFilters,
    loading,
  } = useInventoryContext();

  // Local UI state
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [historyEvents, setHistoryEvents] = useState<StockMovement[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Delete guard: deleting asks for confirmation first, and the confirmation
  // window cancels itself once the countdown expires (no action taken).
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [deleteSecondsLeft, setDeleteSecondsLeft] = useState(
    DELETE_CONFIRM_SECONDS,
  );

  useEffect(() => {
    if (!deleteTarget) return;
    const expiresAt = Date.now() + DELETE_CONFIRM_SECONDS * 1000;
    const tick = () =>
      setDeleteSecondsLeft(
        Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)),
      );
    tick();
    const interval = setInterval(() => {
      tick();
      if (Date.now() >= expiresAt) {
        clearInterval(interval);
        setDeleteTarget(null);
        toast.info("Delete window expired — nothing was deleted");
      }
    }, 250);
    return () => clearInterval(interval);
  }, [deleteTarget]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    await deleteInventoryItem(id);
  };

  const { settings } = useSettings();
  const { t, i18n } = useTranslation();
  const { printBarcodeDirect } = usePrintUtils();
  const router = useRouter();

  // Global Ctrl/Cmd+Shift+A shortcut: open the Add Item form when the event
  // fires while this page is mounted, or consume the pending intent on mount
  // (when the shortcut triggered a navigation from another page).
  useEffect(() => {
    const handleOpenNewItem = () => {
      try {
        sessionStorage.removeItem(PENDING_NEW_ITEM_KEY);
      } catch {
        // storage unavailable: the event alone is enough
      }
      setEditItem(null);
      setShowForm(true);
    };

    window.addEventListener(OPEN_NEW_ITEM_EVENT, handleOpenNewItem);
    try {
      if (sessionStorage.getItem(PENDING_NEW_ITEM_KEY)) {
        handleOpenNewItem();
      }
    } catch {
      // ignore
    }

    return () =>
      window.removeEventListener(OPEN_NEW_ITEM_EVENT, handleOpenNewItem);
  }, []);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = inventoryItems.length;
    const lowStockItems = inventoryItems.filter(
      (item) =>
        item.lowStockThreshold != null &&
        (item.quantityInStock ?? 0) > 0 &&
        (item.quantityInStock ?? 0) <= item.lowStockThreshold,
    );
    const outOfStockItems = inventoryItems.filter(
      (item) => (item.quantityInStock ?? 0) === 0,
    );

    const totalValue = inventoryItems.reduce(
      (sum, item) =>
        sum + (item.buyingPrice ?? 0) * (item.quantityInStock ?? 0),
      0,
    );

    const potentialProfit = inventoryItems.reduce(
      (sum, item) =>
        sum +
        ((item.sellingPrice ?? 0) - (item.buyingPrice ?? 0)) *
          (item.quantityInStock ?? 0),
      0,
    );

    return {
      total,
      lowStock: lowStockItems.length,
      outOfStock: outOfStockItems.length,
      totalValue,
      potentialProfit,
    };
  }, [inventoryItems]);

  const handleViewHistory = async (item: InventoryItem) => {
    setHistoryItem(item);
    try {
      // Use the global ledger so the dialog can show the price, the
      // counterparty and the source document of each movement
      const rows = await invoke<StockMovementDB[]>("get_all_stock_movements");
      setHistoryEvents(
        rows.map(mapMovementFromDB).filter((m) => m.itemId === item.id),
      );
    } catch (err) {
      toast.error("Failed to load history: " + err);
      setHistoryEvents([]);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Unified Command Header & Integrated Metrics */}
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-4 sm:p-6 rounded-3xl border border-gray-200/70 dark:border-slate-800 shadow-sm space-y-5">
          {/* Top Row: Title, Stock Movement Link & Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Title & Quick Navigation */}
            <div className="flex items-center gap-3.5 flex-wrap">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <Package className="h-5 w-5" />
              </div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <h1 className="text-xl font-black tracking-tight text-foreground">
                  {t("inventory.title")}
                </h1>

                {/* Stock Movement Quick Link Pill */}
                <button
                  type="button"
                  onClick={() => router.push("/inventory/stock-movement")}
                  className="group inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
                  title={t("inventory.stockMovement.title")}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-primary" />
                  <span>{t("inventory.stockMovement.title")}</span>
                  <ChevronRight className="w-3 h-3 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            </div>

            {/* Actions Group */}
            <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                disabled={isExporting}
                onClick={async () => {
                  setIsExporting(true);
                  setTimeout(() => {
                    try {
                      exportInventoryToCSV(filteredAndSortedItems);
                    } finally {
                      setIsExporting(false);
                    }
                  }, 800);
                }}
                className="h-10 px-3.5 rounded-xl border font-bold text-xs uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-slate-800 dark:border-slate-800"
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin text-primary" />
                ) : (
                  <Download className="w-3.5 h-3.5 mr-2" />
                )}
                {isExporting ? t("common.loading") : t("common.export")}
              </Button>
              <Button
                variant="outline"
                className="h-10 px-3.5 rounded-xl border font-bold text-xs uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-slate-800 dark:border-slate-800"
              >
                <Upload className="w-3.5 h-3.5 mr-2" />
                {t("common.import")}
              </Button>
              <Button
                onClick={() => {
                  setEditItem(null);
                  setShowForm(true);
                }}
                className="h-10 px-4 sm:px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/25 text-xs font-black uppercase tracking-wider gap-2 cursor-pointer transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Icons.plusCircle className="h-4 w-4 stroke-[2.5]" />
                <span>{t("inventory.addItem")}</span>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/15 text-[9px] font-mono font-bold tracking-normal opacity-80">
                  ⇧A
                </kbd>
              </Button>
            </div>
          </div>

          {/* Bottom Row: Connected High-Density Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-100 dark:border-slate-800/80">
            {/* Metric 1: Total SKUs */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/70 dark:border-blue-900/30 transition-all">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <Package className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70 truncate">
                  {t("inventory.totalItems")}
                </span>
                <span className="text-lg font-black text-foreground truncate">
                  {statistics.total}
                </span>
              </div>
            </div>

            {/* Metric 2: Stock Health Alerts */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 transition-all">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700/80 dark:text-amber-400/80 truncate">
                  {t("inventory.lowStock")} & {t("inventory.table.stockLabels.empty")}
                </span>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-lg font-black text-amber-700 dark:text-amber-400">
                    {statistics.lowStock}
                  </span>
                  {statistics.outOfStock > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[10px] font-black uppercase">
                      {statistics.outOfStock} {t("inventory.table.stockLabels.empty")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Metric 3: Total Stock Valuation */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 transition-all">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <DollarSign className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700/80 dark:text-emerald-400/80 truncate">
                  {t("inventory.stockValue")}
                </span>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 truncate">
                  {formatNumber(
                    statistics.totalValue,
                    getLocaleForIntl(i18n.language),
                  )}{" "}
                  <span className="text-xs font-bold opacity-75">{settings.currency}</span>
                </span>
              </div>
            </div>

            {/* Metric 4: Potential Profit */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/30 transition-all">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700/80 dark:text-purple-400/80 truncate">
                  {t("inventory.potentialProfit")}
                </span>
                <span className="text-lg font-black text-purple-700 dark:text-purple-400 truncate">
                  {formatNumber(
                    statistics.potentialProfit,
                    getLocaleForIntl(i18n.language),
                  )}{" "}
                  <span className="text-xs font-bold opacity-75">{settings.currency}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <VirtualizedTable
              items={filteredAndSortedItems}
              sortConfig={sortConfig}
              onSort={handleSort}
              onEdit={(item) => {
                setEditItem(item);
                setShowForm(true);
              }}
              onViewHistory={handleViewHistory}
              onDelete={(id) => {
                const item = getItemById(id);
                if (item) setDeleteTarget(item);
              }}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onPrint={(item) => {
                printBarcodeDirect(item);
              }}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedBrand={selectedBrand}
              setSelectedBrand={setSelectedBrand}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              clearFilters={clearFilters}
            />
          )}
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <Dialog
            open={showForm}
            onOpenChange={(o) => {
              setShowForm(o);
              if (!o) setEditItem(null);
            }}
          >
            <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto rounded-3xl border-none dark:border dark:border-slate-800 shadow-2xl dark:bg-slate-900">
              <DialogHeader className="pb-2 mb-1 border-b dark:border-slate-800">
                <DialogTitle className="text-xl font-black">
                  {editItem ? t("inventory.editItem") : t("inventory.newItem")}
                </DialogTitle>
                <DialogDescription className="font-medium text-muted-foreground">
                  {editItem
                    ? t("inventory.editDesc") ||
                      "Update the details for this inventory item."
                    : t("inventory.addDesc") ||
                      "Enter the details for the new inventory item."}
                </DialogDescription>
              </DialogHeader>
              <div>
                <InventoryForm
                  key={editItem ? `edit-${editItem.id}` : "new-inventory-item"}
                  itemToEdit={editItem}
                  onSuccess={() => {
                    setShowForm(false);
                    setEditItem(null);
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* History Dialog */}
        <InventoryHistoryDialog
          open={!!historyItem}
          onOpenChange={(open) => !open && setHistoryItem(null)}
          item={historyItem}
          historyEvents={historyEvents}
        />

        {/* Delete Confirmation (prevents accidental deletion) */}
        <Dialog
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
        >
          <DialogContent className="sm:max-w-[440px] rounded-3xl border-none dark:border dark:border-slate-800 shadow-2xl dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-xl font-black flex items-center gap-3">
                <span className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </span>
                {t("common.delete")} "{deleteTarget?.itemName}"?
              </DialogTitle>
              <DialogDescription className="font-medium text-muted-foreground leading-relaxed">
                {deleteTarget
                  ? "Items with history are archived instead of erased. You can still go back — this window cancels itself when the timer runs out."
                  : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between gap-3 pt-1">
              <Button
                variant="outline"
                className="rounded-xl font-bold uppercase tracking-wider"
                onClick={() => setDeleteTarget(null)}
              >
                {t("common.cancel")}
              </Button>
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-muted-foreground tabular-nums w-8 text-right">
                  {deleteSecondsLeft}s
                </span>
                <Button
                  className="rounded-xl font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleConfirmDelete}
                >
                  {t("common.delete")}
                </Button>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full transition-all duration-200 ease-linear"
                style={{
                  width: `${(deleteSecondsLeft / DELETE_CONFIRM_SECONDS) * 100}%`,
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function InventoryPageClient() {
  return (
    <InventoryProvider>
      <InventoryPageInner />
    </InventoryProvider>
  );
}
