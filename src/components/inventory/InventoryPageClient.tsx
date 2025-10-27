"use client";

import React, { useState } from "react";
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
import { Input } from "../ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import { Icons } from "../icons";

export function InventoryPageInner() {
  const {
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <Button onClick={() => setShowForm(true)}>+ Add Item</Button>
      </div>

      {/* --- Toolbar: Search + Filters --- */}
      <div className="my-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* --- Search Input --- */}
          <div className="relative md:col-span-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Icons.search className="h-5 w-5 text-muted-foreground" />
            </span>
            <Input
              placeholder="Search by item name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10  shadow-sm focus:ring-2 focus:ring-primary focus:border-primary border border-input bg-background transition-all"
              aria-label="Search items"
            />
          </div>

          {/* --- Brand Filter --- */}
          <div className="space-y-1">
            <label
              htmlFor="brand-filter"
              className="text-sm font-medium text-muted-foreground"
            >
              Filter by Brand
            </label>
            <Select
              value={selectedBrand}
              onValueChange={(value) => setSelectedBrand(value as PhoneBrand)}
            >
              <SelectTrigger id="brand-filter">
                <SelectValue placeholder="Filter by brand" />
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

          {/* --- Type Filter --- */}
          <div className="space-y-1">
            <label
              htmlFor="type-filter"
              className="text-sm font-medium text-muted-foreground"
            >
              Filter by Type
            </label>
            <Select
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as ItemType)}
            >
              <SelectTrigger id="type-filter">
                <SelectValue placeholder="Filter by type" />
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
      {/* Inventory Table plugged in */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
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
        />
      )}
      {/* Add/Edit Form */}
      {showForm && (
        <Dialog open={showForm} onOpenChange={(o) => setShowForm(o)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editItem ? "Edit Repair" : "Add New Repair"}
              </DialogTitle>
              <DialogDescription>
                {editItem
                  ? "Update the details for this repair order."
                  : "Enter the details for the new repair order."}
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
  );
}

export default function InventoryPageClient() {
  return (
    <InventoryProvider>
      <InventoryPageInner />
    </InventoryProvider>
  );
}
