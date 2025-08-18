"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  InventoryProvider,
  useInventoryContext,
} from "@/context/InventoryContext";
import { InventoryTable } from "./InventoryTable";
import { InventoryForm } from "./InventoryForm";
import { InventoryHistoryDialog } from "./InventoryHistoryDialog";
import type { InventoryHistoryEvent, InventoryItem } from "@/types/inventory";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

export function InventoryPageInner() {
  const {
    filteredAndSortedItems,
    sortConfig,
    handleSort,
    deleteInventoryItem,
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
      const mapped = events.map((e) => ({
        id: e.id,
        date: e.date,
        type: e.event_type, // ✅ map event_type → type
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <Button onClick={() => setShowForm(true)}>+ Add Item</Button>
      </div>

      {/* Inventory Table plugged in */}
      <InventoryTable
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
