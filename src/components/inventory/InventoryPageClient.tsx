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
import {
  PHONE_BRANDS,
  ITEM_TYPES,
  PhoneBrand,
  ItemType,
} from "@/types/inventory";

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
} from "lucide-react";

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

  const [historyEvents, setHistoryEvents] = useState<InventoryHistoryEvent[]>(
    []
  );

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
      style: "currency",
      currency: "USD",
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
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      orange: "bg-orange-100 text-orange-600",
      red: "bg-red-100 text-red-600",
      purple: "bg-purple-100 text-purple-600",
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium text-gray-600">{title}</span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {subtitle && (
            <div className="text-sm text-gray-500 mt-1">{subtitle}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              Inventory
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your parts inventory and stock levels
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">
              <Upload className="w-4 h-4" />
              Import
            </button>
            <Button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Package}
            title="Total Items"
            value={statistics.total}
            subtitle="Items in inventory"
            color="blue"
          />
          <StatCard
            icon={AlertTriangle}
            title="Low Stock"
            value={statistics.lowStock}
            subtitle={`${statistics.outOfStock} out of stock`}
            color="red"
          />
          <StatCard
            icon={DollarSign}
            title="Total Value"
            value={formatCurrency(statistics.totalValue)}
            subtitle="Current inventory value"
            color="green"
          />
          <StatCard
            icon={TrendingUp}
            title="Potential Profit"
            value={formatCurrency(statistics.potentialProfit)}
            subtitle="If all items sold"
            color="purple"
          />
        </div>

        {/* Filters and Search */}
        <div>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 relative self-end">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by item name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                aria-label="Search items"
              />
            </div>

            {/* Brand Filter */}
            <div className="space-y-1">
              <label
                htmlFor="brand-filter"
                className="text-sm font-medium text-gray-600"
              >
                Filter by Brand
              </label>
              <Select
                value={selectedBrand}
                onValueChange={(value) => setSelectedBrand(value as PhoneBrand)}
              >
                <SelectTrigger
                  id="brand-filter"
                  className="w-full md:w-[180px]"
                >
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  {PHONE_BRANDS.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="space-y-1">
              <label
                htmlFor="type-filter"
                className="text-sm font-medium text-gray-600"
              >
                Filter by Type
              </label>
              <Select
                value={selectedType}
                onValueChange={(value) => setSelectedType(value as ItemType)}
              >
                <SelectTrigger id="type-filter" className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          />
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <Dialog open={showForm} onOpenChange={(o) => setShowForm(o)}>
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
