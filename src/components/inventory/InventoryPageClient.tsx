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
import { InventoryBulkActions } from "./InventoryBulkActions";
import type { InventoryHistoryEvent, InventoryItem } from "@/types/inventory";
import {
  PHONE_BRANDS,
  ITEM_TYPES,
  PhoneBrand,
  ItemType,
} from "@/types/inventory";
import { useTranslation } from "react-i18next";
import { usePrintUtils } from "@/hooks/usePrintUtils";
import { StickerPreviewDialog } from "@/components/helpers/StickerPreviewDialog";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
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
} from "lucide-react";
import { cn } from "@/lib";

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

  const { t } = useTranslation();
  const { printSticker } = usePrintUtils();
  const [previewItem, setPreviewItem] = useState<InventoryItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: "blue" | "green" | "orange" | "red" | "purple";
  }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600",
      green: "bg-green-50 text-green-600",
      orange: "bg-orange-50 text-orange-600",
      red: "bg-red-50 text-red-600",
      purple: "bg-purple-50 text-purple-600",
    };

    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className={cn("p-2 rounded-xl", colorClasses[color])}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 opacity-60">
              {title}
            </span>
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-black text-foreground dark:text-slate-100">{value}</div>
          {subtitle && (
            <div className="text-[10px] font-bold text-muted-foreground dark:text-slate-500 flex items-center gap-1 opacity-70">
              <div
                className={cn(
                  "h-1 w-1 rounded-full",
                  colorClasses[color].replace("text-", "bg-")
                )}
              ></div>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary">
              <Package className="h-6 w-6" />
            </div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                {t('inventory.title')}
              </h1>
              <p className="hidden md:block text-[10px] text-muted-foreground dark:text-slate-500 font-bold uppercase tracking-wider opacity-60">
                {t('inventory.subtitle')}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-11 px-4 rounded-xl border-2 dark:border-slate-800 dark:bg-slate-900 font-black text-xs uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-slate-200 hover:dark:text-slate-100 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('common.export')}
            </Button>
            <Button
              variant="outline"
              className="h-11 px-4 rounded-xl border-2 dark:border-slate-800 dark:bg-slate-900 font-black text-xs uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-slate-200 hover:dark:text-slate-100 transition-colors"
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
              <Plus className="mr-2 h-4 w-4" />
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
            value={formatCurrency(statistics.totalValue)}
            subtitle={t('dashboard.cashier.allRevenue')}
            color="green"
          />
          <StatCard
            icon={TrendingUp}
            title={t('dashboard.charts.profit')}
            value={formatCurrency(statistics.potentialProfit)}
            subtitle={t('dashboard.charts.revenueTrend')}
            color="purple"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            {/* Search */}
            <div className="flex-1 relative w-full">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 opacity-60 ml-1 mb-1.5 block">
                {t('common.search')}
              </span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/40 w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('common.filter')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary/20 transition-all text-sm font-bold placeholder:font-medium dark:text-slate-100"
                />
              </div>
            </div>

            {/* Brand Filter */}
            <div className="w-full md:w-[180px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 opacity-60 ml-1 mb-1.5 block">
                {t('inventory.table.brand')}
              </span>
              <Select
                value={selectedBrand}
                onValueChange={(value) => setSelectedBrand(value as PhoneBrand)}
              >
                <SelectTrigger className="h-11 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm dark:text-slate-200">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl dark:bg-slate-900 dark:text-slate-200">
                  {PHONE_BRANDS.map((brand) => (
                    <SelectItem
                      key={brand}
                      value={brand}
                      className="font-bold text-xs uppercase py-2.5 focus:bg-primary/10 dark:focus:bg-slate-800"
                    >
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="w-full md:w-[180px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 opacity-60 ml-1 mb-1.5 block">
                {t('inventory.table.category')}
              </span>
              <Select
                value={selectedType}
                onValueChange={(value) => setSelectedType(value as ItemType)}
              >
                <SelectTrigger className="h-11 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm dark:text-slate-200">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl dark:bg-slate-900 dark:text-slate-200">
                  {ITEM_TYPES.map((type) => (
                    <SelectItem
                      key={type}
                      value={type}
                      className="font-bold text-xs uppercase py-2.5 focus:bg-primary/10 dark:focus:bg-slate-800"
                    >
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {(searchTerm !== "" ||
              selectedBrand !== "All" ||
              selectedType !== "All") && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="h-11 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {t('inventory.bulkActions.clear')}
              </Button>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        <InventoryBulkActions
          items={filteredAndSortedItems}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />

        {/* Inventory Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800">
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
            onDelete={(id) => deleteInventoryItem(id)}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onPrint={(item) => {
              setPreviewItem(item);
              setIsPreviewOpen(true);
            }}
          />
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <Dialog
            open={showForm}
            onOpenChange={(o) => {
              setShowForm(o);
              if (!o) setEditItem(null);
            }}
          >
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editItem ? "Edit Inventory Item" : "Add New Inventory Item"}
                </DialogTitle>
                <DialogDescription>
                  {editItem
                    ? "Update the details for this inventory item."
                    : "Enter the details for the new inventory item."}
                </DialogDescription>
              </DialogHeader>
              <InventoryForm
                key={editItem ? `edit-${editItem.id}` : "new-inventory-item"}
                itemToEdit={editItem}
                onSuccess={() => {
                  setShowForm(false);
                  setEditItem(null);
                }}
              />
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

        {previewItem && (
          <StickerPreviewDialog
            open={isPreviewOpen}
            onOpenChange={setIsPreviewOpen}
            item={previewItem}
            onConfirm={() => {
              printSticker(previewItem);
            }}
            onCancel={() => {
              setPreviewItem(null);
            }}
          />
        )}
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
