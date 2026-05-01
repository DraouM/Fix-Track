"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  InventoryProvider,
  useInventoryContext,
} from "@/context/InventoryContext";
import { VirtualizedTable } from "./VirtualizedTable";
import { InventoryForm } from "./InventoryForm";
import { InventoryHistoryDialog } from "./InventoryHistoryDialog";
import type { InventoryHistoryEvent, InventoryItem } from "@/types/inventory";
import { PhoneBrand, ItemType } from "@/types/inventory";
import { useTranslation } from "react-i18next";
import { usePrintUtils } from "@/hooks/usePrintUtils";
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
} from "lucide-react";
import { cn } from "@/lib";
import { useSettings } from "@/context/SettingsContext";
import { formatCurrency as formatCurrencyCentralized, formatNumber, getLocaleForIntl } from "@/lib/formatters";

export function InventoryPageInner() {
  const {
    inventoryItems,
    filteredAndSortedItems,
    sortConfig,
    handleSort,
    deleteInventoryItem,
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

  const [historyEvents, setHistoryEvents] = useState<InventoryHistoryEvent[]>(
    []
  );
  const [isExporting, setIsExporting] = useState(false);

  const { settings } = useSettings();
  const { t, i18n } = useTranslation();
  const { printSticker } = usePrintUtils();


  // Calculate statistics
  const statistics = useMemo(() => {
    const total = inventoryItems.length;
    const lowStockItems = inventoryItems.filter(
      (item) =>
        item.lowStockThreshold != null &&
        (item.quantityInStock ?? 0) > 0 &&
        (item.quantityInStock ?? 0) <= item.lowStockThreshold
    );
    const outOfStockItems = inventoryItems.filter(
      (item) => (item.quantityInStock ?? 0) === 0
    );

    const totalValue = inventoryItems.reduce(
      (sum, item) =>
        sum + (item.buyingPrice ?? 0) * (item.quantityInStock ?? 0),
      0
    );

    const potentialProfit = inventoryItems.reduce(
      (sum, item) =>
        sum +
        ((item.sellingPrice ?? 0) - (item.buyingPrice ?? 0)) *
          (item.quantityInStock ?? 0),
      0
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
      const events = await invoke<any[]>("get_history_for_item", {
        itemId: item.id,
      });

      // map snake_case → camelCase
      const mapped: InventoryHistoryEvent[] = events.map((e) => ({
        id: e.id,
        itemId: item.id, // ✅ add the itemId from the current item
        date: e.date,
        type: e.event_type as InventoryHistoryEvent["type"], // ✅ map event_type → type
        quantityChange: e.quantity_change, // ✅ map quantity_change → quantityChange
        notes: e.notes,
        relatedId: e.related_id,
      }));

      setHistoryEvents(mapped);
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

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = "blue",
    trend,
    suffix,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: "blue" | "green" | "orange" | "red" | "purple";
    trend?: number;
    suffix?: string;
  }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
      green: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
      orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
      red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
      purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    };

    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${colorClasses[color]}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                {title} {suffix && <span className="opacity-50 ml-1">({suffix})</span>}
            </span>
          </div>
          {typeof trend === 'number' && (
            <div className={`flex items-center gap-1 text-[10px] font-black ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-3 h-3 ${trend < 0 && 'rotate-180'}`} />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <div className="text-2xl font-black text-foreground truncate" title={String(value)}>{value}</div>
          {subtitle && (
            <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 opacity-70 mt-1">
              <div className={`h-1 w-1 rounded-full ${colorClasses[color].replace('text-', 'bg-')}`}></div>
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
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Package className="h-6 w-6" />
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                {t('inventory.title')}
              </h1>
              <div className="flex items-center gap-2">
                 <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                    <span className="text-xs font-black">{statistics.total}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">{t('common.items')}</span>
                 </div>
                 <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-800/50">
                    <span className="text-xs font-black">{statistics.outOfStock}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">{t('inventory.table.stockLabels.empty')}</span>
                 </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              disabled={isExporting}
              onClick={async () => {
                setIsExporting(true);
                // Artificial delay for premium UX feel
                setTimeout(() => {
                  try {
                    exportInventoryToCSV(filteredAndSortedItems);
                  } finally {
                    setIsExporting(false);
                  }
                }, 800);
              }}
              className="h-11 px-4 rounded-xl border-2 font-black text-xs uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-slate-800 dark:border-slate-800"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isExporting ? t('common.loading') : t('common.export')}
            </Button>
            <Button
              variant="outline"
              className="h-11 px-4 rounded-xl border-2 font-black text-xs uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-slate-800 dark:border-slate-800"
            >
              <Upload className="w-4 h-4 mr-2" />
              {t('common.import')}
            </Button>
            <Button
              onClick={() => {
                setEditItem(null);
                setShowForm(true);
              }}
              className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-xs font-black uppercase tracking-widest"
            >
              <Icons.plusCircle className="mr-2 h-4 w-4" />
              {t('inventory.addItem')}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Package}
            title={t('inventory.table.footer', { count: statistics.total, plural: statistics.total !== 1 ? 's' : '' })}
            value={statistics.total}
            subtitle={t('inventory.subtitle')}
            color="blue"
          />
          <StatCard
            icon={AlertTriangle}
            title={t('inventory.lowStock')}
            value={statistics.lowStock}
            subtitle={t('dashboard.inventory.lowStock', { count: statistics.outOfStock })}
            color="red"
          />
          <StatCard
            icon={DollarSign}
            title={t('dashboard.cashier.totalRevenue')}
            value={formatNumber(statistics.totalValue, getLocaleForIntl(i18n.language))}
            suffix={settings.currency}
            subtitle={t('dashboard.cashier.allRevenue')}
            color="green"
          />
          <StatCard
            icon={TrendingUp}
            title={t('dashboard.charts.profit')}
            value={formatNumber(statistics.potentialProfit, getLocaleForIntl(i18n.language))}
            suffix={settings.currency}
            subtitle={t('dashboard.charts.revenueTrend')}
            color="purple"
          />
        </div>


        {/* Inventory Table */}
        <div className="space-y-4">
             <div className="flex items-center gap-3">
                 <div className="h-2 w-2 rounded-full bg-primary"></div>
                 <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">{t('inventory.historyLogs')}</h2>
             </div>
             {loading ? (
                <div className="flex items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
             ) : (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <VirtualizedTable
                        items={filteredAndSortedItems}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                        onEdit={(item) => {
                        setEditItem(item);
                        setShowForm(true);
                        }}
                        onViewHistory={handleViewHistory}
                        onDelete={(id) => deleteInventoryItem(id)}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        onPrint={(item) => {
                        printSticker(item);
                        }}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        selectedBrand={selectedBrand}
                        setSelectedBrand={setSelectedBrand}
                        selectedType={selectedType}
                        setSelectedType={setSelectedType}
                        clearFilters={clearFilters}
                    />
                </div>
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
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto rounded-3xl border-none dark:border dark:border-slate-800 shadow-2xl dark:bg-slate-900">
              <DialogHeader className="pb-4 border-b dark:border-slate-800">
                <DialogTitle className="text-2xl font-black">
                  {editItem ? t('inventory.editItem') : t('inventory.newItem')}
                </DialogTitle>
                <DialogDescription className="font-medium text-muted-foreground">
                  {editItem
                    ? t('inventory.editDesc') || "Update the details for this inventory item."
                    : t('inventory.addDesc') || "Enter the details for the new inventory item."}
                </DialogDescription>
              </DialogHeader>
              <div className="pt-4">
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
