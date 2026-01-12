"use client";

import { invoke } from "@tauri-apps/api/core";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useInventoryFilters, SortConfig } from "@/hooks/useInventoryFilters";
import { useEvents } from "@/context/EventContext";

import type {
  InventoryItem,
  InventoryFormValues,
  InventoryHistoryEvent,
  HistoryEventType,
  PhoneBrand,
  ItemType,
} from "@/types/inventory";

// ✅ State shape
interface InventoryState {
  inventoryItems: InventoryItem[];
  filteredAndSortedItems: InventoryItem[];
  loading: boolean;
  initialized: boolean;
  error: string | null;
  searchTerm: string;
  selectedBrand: PhoneBrand;
  selectedType: ItemType;
  sortConfig: SortConfig;
}

// ✅ Actions shape
interface InventoryActions {
  initialize: () => Promise<void>;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  setSelectedBrand: React.Dispatch<React.SetStateAction<PhoneBrand>>;
  setSelectedType: React.Dispatch<React.SetStateAction<ItemType>>;
  handleSort: (key: keyof InventoryItem | "profit") => void;
  clearFilters: () => void;
  addInventoryItem: (itemData: InventoryFormValues) => Promise<void>;
  updateInventoryItem: (
    id: string,
    itemData: Partial<InventoryFormValues>
  ) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  getItemById: (id: string) => InventoryItem | undefined;
  updateItemQuantity: (
    id: string,
    quantityChange: number,
    type: HistoryEventType,
    notes?: string,
    relatedId?: string
  ) => Promise<void>;
  searchItems: (query: string) => Promise<InventoryItem[]>;
}

// ✅ Combined type
export type InventoryContextType = InventoryState & InventoryActions;

const InventoryContext = createContext<InventoryContextType | undefined>(
  undefined
);

// Matches raw DB row
interface InventoryItemDB {
  id: string | number;
  item_name: string;
  phone_brand: PhoneBrand;
  item_type: ItemType;
  buying_price: number;
  selling_price: number;
  quantity_in_stock: number;
  low_stock_threshold: number;
  supplier_info: string;
  barcode: string;
  history?: InventoryHistoryEvent[];
}

function mapItemFromDB(dbItem: InventoryItemDB): InventoryItem {
  return {
    id: String(dbItem.id),
    itemName: dbItem.item_name,
    phoneBrand: dbItem.phone_brand,
    itemType: dbItem.item_type,
    buyingPrice: dbItem.buying_price,
    sellingPrice: dbItem.selling_price,
    quantityInStock: dbItem.quantity_in_stock,
    lowStockThreshold: dbItem.low_stock_threshold,
    supplierInfo: dbItem.supplier_info || "",
    barcode: dbItem.barcode || "",
    history: dbItem.history ?? [],
  };
}

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Use the filtering/sorting hook
  const {
    filteredAndSortedItems,
    searchTerm,
    setSearchTerm,
    selectedBrand,
    setSelectedBrand,
    selectedType,
    setSelectedType,
    sortConfig,
    handleSort,
    clearFilters,
  } = useInventoryFilters(inventoryItems);

  const { emit } = useEvents();

  // ✅ Fetch items from DB
  const fetchItems = useCallback(async () => {
    try {
      const dbItems = await invoke<InventoryItemDB[]>("get_items");
      console.info("Fetched items from DB:", dbItems);

      setInventoryItems(dbItems.map(mapItemFromDB));
    } catch (err) {
      console.error("Failed to fetch inventory items:", err);
      setError(`Failed to load inventory: ${err}`);
      setInventoryItems([]);
    }
  }, []);

  // ✅ Initialize tables + load data
  const initialize = useCallback(async () => {
    if (initialized) return;

    setLoading(true);
    setError(null);

    try {
      await invoke("init_database");
      await fetchItems();
      setInitialized(true);
    } catch (err) {
      console.error("Failed to initialize inventory:", err);
      setError(`Failed to initialize inventory: ${err}`);
      toast.error(`Failed to initialize inventory: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [fetchItems, initialized]);

  // ✅ Initialize on mount with a slight delay to prevent blocking
  useEffect(() => {
    const initTimer = setTimeout(() => {
      initialize();
    }, 10);

    return () => clearTimeout(initTimer);
  }, [initialize]);

  const addInventoryItem = useCallback(
    async (itemData: InventoryFormValues) => {
      try {
        const newItemId = uuidv4();
        const quantity = itemData.quantityInStock ?? 0;

        await invoke("insert_item", {
          item: {
            id: newItemId,
            item_name: itemData.itemName,
            phone_brand: itemData.phoneBrand,
            item_type: itemData.itemType,
            buying_price: itemData.buyingPrice,
            selling_price: itemData.sellingPrice,
            quantity_in_stock: quantity,
            low_stock_threshold: itemData.lowStockThreshold,
            supplier_info: itemData.supplierInfo,
            barcode: itemData.barcode,
          },
        });

        await invoke("insert_history_event", {
          event: {
            id: uuidv4(),
            item_id: newItemId,
            date: new Date().toISOString(),
            event_type: "Purchased",
            quantity_change: quantity,
            notes: "Initial stock added",
            related_id: null,
          },
        });

        toast.success("Item added");
        fetchItems();
        // Emit event to notify dashboard
        emit("financial-data-change");
      } catch (err) {
        toast.error(`Failed to add item: ${err}`);
      }
    },
    [fetchItems]
  );

  const updateInventoryItem = useCallback(
    async (id: string, itemData: Partial<InventoryFormValues>) => {
      try {
        const currentItem = inventoryItems.find((item) => item.id === id);
        if (!currentItem) return;

        const currentStock = currentItem.quantityInStock ?? 0;
        const newStock = itemData.quantityInStock ?? currentStock;
        const quantityChange = newStock - currentStock;

        await invoke("update_item", {
          item: {
            id,
            item_name: itemData.itemName ?? currentItem.itemName,
            phone_brand: itemData.phoneBrand ?? currentItem.phoneBrand,
            item_type: itemData.itemType ?? currentItem.itemType,
            buying_price: itemData.buyingPrice ?? currentItem.buyingPrice,
            selling_price: itemData.sellingPrice ?? currentItem.sellingPrice,
            quantity_in_stock: newStock,
            low_stock_threshold:
              itemData.lowStockThreshold ?? currentItem.lowStockThreshold,
            supplier_info: itemData.supplierInfo ?? currentItem.supplierInfo,
            barcode: itemData.barcode ?? currentItem.barcode,
          },
        });

        if (quantityChange !== 0) {
          await invoke("insert_history_event", {
            event: {
              id: uuidv4(),
              item_id: id,
              date: new Date().toISOString(),
              event_type: "Manual Correction",
              quantity_change: quantityChange,
              notes: `Stock updated from ${currentStock} to ${newStock}`,
              related_id: null,
            },
          });
        }

        toast.success("Item updated");
        fetchItems();
        // Emit event to notify dashboard
        emit("financial-data-change");
      } catch (err) {
        toast.error(`Failed to update item: ${err}`);
      }
    },
    [fetchItems, inventoryItems]
  );

  const deleteInventoryItem = useCallback(
    async (id: string) => {
      try {
        await invoke("delete_item", { id });
        toast.success("Item deleted");
        fetchItems();
        // Emit event to notify dashboard
        emit("financial-data-change");
      } catch (err) {
        toast.error(`Failed to delete item: ${err}`);
      }
    },
    [fetchItems]
  );

  const getItemById = useCallback(
    (id: string) => {
      return inventoryItems.find((item) => item.id === id);
    },
    [inventoryItems]
  );

  const updateItemQuantity = useCallback(
    async (
      id: string,
      quantityChange: number,
      type: HistoryEventType,
      notes?: string,
      relatedId?: string
    ) => {
      try {
        const item = inventoryItems.find((it) => it.id === id);
        if (!item) return;

        const currentStock = item.quantityInStock ?? 0;
        if (quantityChange < 0 && currentStock < Math.abs(quantityChange)) {
          toast.error(`Not enough stock for ${item.itemName}`);
          return;
        }

        const newQuantity = Math.max(0, currentStock + quantityChange);

        await invoke("update_item_quantity", { id, new_quantity: newQuantity });

        await invoke("insert_history_event", {
          event: {
            id: uuidv4(),
            item_id: id,
            date: new Date().toISOString(),
            event_type: type,
            quantity_change: quantityChange,
            notes,
            related_id: relatedId ?? null,
          },
        });

        toast.success("Stock updated");
        fetchItems();
        // Emit event to notify dashboard
        emit("financial-data-change");
      } catch (err) {
        toast.error(`Failed to update quantity: ${err}`);
      }
    },
    [fetchItems, inventoryItems]
  );

  const searchItems = useCallback(async (query: string) => {
    try {
      const dbItems = await invoke<InventoryItemDB[]>("search_items", {
        query,
      });
      return dbItems.map(mapItemFromDB);
    } catch (err) {
      console.error("Failed to search items:", err);
      toast.error(`Search failed: ${err}`);
      return [];
    }
  }, []);

  // ✅ Memoized value
  const value = useMemo<InventoryContextType>(
    () => ({
      // ✅ State
      inventoryItems,
      filteredAndSortedItems,
      loading,
      initialized,
      error,
      searchTerm,
      selectedBrand,
      selectedType,
      sortConfig,

      // ✅ Actions
      initialize,
      setSearchTerm,
      setSelectedBrand,
      setSelectedType,
      handleSort,
      clearFilters,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      getItemById,
      updateItemQuantity,
      searchItems,
    }),
    [
      inventoryItems,
      filteredAndSortedItems,
      loading,
      initialized,
      error,
      searchTerm,
      selectedBrand,
      selectedType,
      sortConfig,
      initialize,
      setSearchTerm,
      setSelectedBrand,
      setSelectedType,
      handleSort,
      clearFilters,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      getItemById,
      updateItemQuantity,
      searchItems,
    ]
  );

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

// Base hook to ensure we're in a provider
export function useInventoryContext() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error(
      "useInventoryContext must be used within an InventoryProvider"
    );
  }
  return context;
}

// ✅ Convenience hook for all-in-one usage
export function useInventory() {
  return useInventoryContext();
}

// ✅ Only returns state (no actions)
export function useInventoryState(): InventoryState {
  const {
    inventoryItems,
    filteredAndSortedItems,
    loading,
    initialized,
    error,
    searchTerm,
    selectedBrand,
    selectedType,
    sortConfig,
  } = useInventoryContext();

  return {
    inventoryItems,
    filteredAndSortedItems,
    loading,
    initialized,
    error,
    searchTerm,
    selectedBrand,
    selectedType,
    sortConfig,
  };
}

// ✅ Only returns actions (no state)
export function useInventoryActions(): InventoryActions {
  const {
    initialize,
    setSearchTerm,
    setSelectedBrand,
    setSelectedType,
    handleSort,
    clearFilters,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getItemById,
    updateItemQuantity,
    searchItems,
  } = useInventoryContext();

  return {
    initialize,
    setSearchTerm,
    setSelectedBrand,
    setSelectedType,
    handleSort,
    clearFilters,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getItemById,
    updateItemQuantity,
    searchItems,
  };
}
