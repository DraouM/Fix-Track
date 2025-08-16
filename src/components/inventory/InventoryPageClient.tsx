"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";

import {
  InventoryProvider,
  useInventoryContext,
} from "@/context/InventoryContext";
import { InventoryTable } from "./InventoryTable";
import { InventoryForm } from "./InventoryForm";
import { InventoryHistoryDialog } from "./InventoryHistoryDialog";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// --- Inner client page that consumes context ---
function InventoryPageContent() {
  const { setSearchTerm } = useInventoryContext();

  // Local state for dialogs
  const [showForm, setShowForm] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [historyItemId, setHistoryItemId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Input
            placeholder="Search items..."
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      <Separator />

      {/* Table */}
      <InventoryTable
        onEdit={(item) => {
          setEditItemId(item.id);
          setShowForm(true);
        }}
        onViewHistory={(item) => setHistoryItemId(item.id)}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItemId ? "Edit Item" : "Add Item"}</DialogTitle>
          </DialogHeader>
          {/* <InventoryForm
            itemToEdit={itemToEdit}
            onSuccess={() => {
              setShowForm(false);
              setEditItemId(null);
            }}
          /> */}
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <InventoryHistoryDialog
        open={!!historyItemId}
        onOpenChange={() => setHistoryItemId(null)}
        itemId={historyItemId}
      />
    </div>
  );
}

// --- Exported page with provider wrapper ---
export default function InventoryPageClient() {
  return (
    <InventoryProvider>
      <InventoryPageContent />
    </InventoryProvider>
  );
}
