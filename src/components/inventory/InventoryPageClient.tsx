"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InventoryForm } from "./InventoryForm";
import { InventoryTable } from "./InventoryTable";
import { InventoryHistoryDialog } from "./InventoryHistoryDialog"; // Import the new dialog
import { useInventoryContext } from "@/context/InventoryContext";
import { Icons } from "@/components/icons";
import type {
  InventoryItem,
  PhoneBrand,
  ItemType,
  InventoryFormValues,
  InventoryHistoryEvent,
} from "@/types/inventory";
import { PHONE_BRANDS, ITEM_TYPES } from "@/types/inventory";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";

function InventoryPageContent() {
  const {
    inventoryItems,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    loading,
    getItemById,
  } = useInventoryContext();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<PhoneBrand>("All");
  const [selectedType, setSelectedType] = useState<ItemType>("All");

  const [sortConfig, setSortConfig] = useState<{
    key: keyof InventoryItem | "profit";
    direction: "ascending" | "descending";
  } | null>({ key: "itemName", direction: "ascending" });

  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null); // State for history dialog
  const [historyEvents, setHistoryEvents] = useState<InventoryHistoryEvent[]>(
    []
  );

  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        tableContainerRef.current &&
        !tableContainerRef.current.contains(event.target as Node)
      ) {
        setActiveItemId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sortedAndFilteredItems = useMemo(() => {
    let sortableItems = [...inventoryItems]
      .filter((item) =>
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((item) =>
        selectedBrand === "All" ? true : item.phoneBrand === selectedBrand
      )
      .filter((item) =>
        selectedType === "All" ? true : item.itemType === selectedType
      );

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        // Handle special 'profit' key
        if (sortConfig.key === "profit") {
          aValue = a.sellingPrice - a.buyingPrice;
          bValue = b.sellingPrice - b.buyingPrice;
        } else {
          // Ensure aValue and bValue are never undefined by providing a default value
          const aRaw =
            a[sortConfig.key as keyof Omit<InventoryItem, "history">];
          const bRaw =
            b[sortConfig.key as keyof Omit<InventoryItem, "history">];
          aValue = aRaw !== undefined && aRaw !== null ? aRaw : "";
          bValue = bRaw !== undefined && bRaw !== null ? bRaw : "";
        }

        // Handle optional quantityInStock by providing a default value for sorting
        if (sortConfig.key === "quantityInStock") {
          aValue = a.quantityInStock ?? -Infinity;
          bValue = b.quantityInStock ?? -Infinity;
        }

        // Ensure values are comparable
        if (typeof aValue === "string") aValue = aValue.toLowerCase();
        if (typeof bValue === "string") bValue = bValue.toLowerCase();

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableItems;
  }, [inventoryItems, searchTerm, selectedBrand, selectedType, sortConfig]);

  const handleEdit = useCallback(
    (item: InventoryItem) => {
      console.log("Edit clicked for:", item);
      const fullItem = getItemById(item.id); // Get the most up-to-date item
      if (fullItem) {
        setItemToEdit(fullItem);
        setIsFormOpen(true);
      }
    },
    [getItemById]
  );

  const handleDeleteConfirmation = useCallback((itemId: string) => {
    setItemToDeleteId(itemId);
  }, []);

  const handleDelete = useCallback(() => {
    if (itemToDeleteId) {
      deleteInventoryItem(itemToDeleteId);
      setItemToDeleteId(null); // Close dialog
    }
  }, [itemToDeleteId, deleteInventoryItem]);

  const handleViewHistory = useCallback((item: InventoryItem) => {
    invoke<any[]>("get_history_for_item", { itemId: item.id })
      .then((events) => {
        // Map snake_case to camelCase for frontend
        const mapped = events.map((event) => ({
          ...event,
          eventType: event.event_type,
          quantityChange: event.quantity_change,
          relatedId: event.related_id,
          type: event.event_type, // for badge rendering
          notes: event.notes,
          date: event.date,
          id: event.id,
        }));
        setHistoryEvents(mapped);
        setHistoryItem(item);
      })
      .catch((err: Error) => {
        toast.error("Failed to load history: " + err);
        setHistoryEvents([]);
        setHistoryItem(item);
      });
  }, []);

  const handleSort = useCallback(
    (key: keyof InventoryItem | "profit") => {
      let direction: "ascending" | "descending" = "ascending";
      if (
        sortConfig &&
        sortConfig.key === key &&
        sortConfig.direction === "ascending"
      ) {
        direction = "descending";
      }
      setSortConfig({ key, direction });
    },
    [sortConfig]
  );

  const handleFormSubmit = (data: InventoryFormValues) => {
    if (itemToEdit) {
      console.log("Submitting update for:", itemToEdit.id, data);
      updateInventoryItem(itemToEdit.id, data);
      console.log({ data });
    } else {
      addInventoryItem(data);
    }
    setIsFormOpen(false);
    setItemToEdit(null);
  };

  const openAddNewForm = () => {
    setItemToEdit(null);
    setIsFormOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Icons.spinner className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className=" flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Inventory Management</h1>
        <Dialog
          key={itemToEdit?.id || "new"}
          open={isFormOpen}
          onOpenChange={(isOpen) => {
            setIsFormOpen(isOpen);
            if (!isOpen) setItemToEdit(null);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={openAddNewForm}>
              <Icons.plusCircle className="mr-2 h-4 w-4" /> Add New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>
                {itemToEdit ? "Edit Item" : "Add New Item"}
              </DialogTitle>
              <DialogDescription>
                {itemToEdit
                  ? "Update the details of this inventory item."
                  : "Fill in the details to add a new item to your inventory."}
              </DialogDescription>
            </DialogHeader>
            <InventoryForm
              key={itemToEdit?.id || "new"}
              onSuccess={() => setIsFormOpen(false)}
              itemToEdit={itemToEdit}
              onSubmitForm={handleFormSubmit}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="relative md:col-span-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Icons.search className="h-5 w-5 text-muted-foreground" />
            </span>
            <Input
              placeholder="Search by item name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-full shadow-sm focus:ring-2 focus:ring-primary focus:border-primary border border-input bg-background transition-all"
              aria-label="Search items"
            />
          </div>
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

      <div ref={tableContainerRef}>
        <InventoryTable
          items={sortedAndFilteredItems}
          onEdit={handleEdit}
          onDelete={handleDeleteConfirmation}
          onViewHistory={handleViewHistory}
          onSort={handleSort}
          sortConfig={sortConfig}
          activeItemId={activeItemId}
          setActiveItemId={setActiveItemId}
        />
      </div>

      <InventoryHistoryDialog
        open={!!historyItem}
        onOpenChange={(open) => {
          if (!open) {
            setHistoryItem(null);
            setHistoryEvents([]);
          }
        }}
        item={historyItem}
        historyEvents={historyEvents}
      />

      <AlertDialog
        open={!!itemToDeleteId}
        onOpenChange={() => setItemToDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              item from your inventory and its history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function InventoryPageClient() {
  return <InventoryPageContent />;
}
