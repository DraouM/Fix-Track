"use client";

import { invoke } from "@tauri-apps/api/core";
// import { getName } from "@tauri-apps/api/app";

import type {
  InventoryItem,
  InventoryFormValues,
  InventoryHistoryEvent,
  HistoryEventType,
} from "@/types/inventory";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { toast } from "sonner";
import { log } from "node:console";

interface InventoryContextType {
  inventoryItems: InventoryItem[];
  addInventoryItem: (itemData: InventoryFormValues) => void;
  updateInventoryItem: (id: string, itemData: InventoryFormValues) => void;
  deleteInventoryItem: (id: string) => void;
  getItemById: (id: string) => InventoryItem | undefined;
  updateItemQuantity: (
    id: string,
    quantityChange: number,
    type: HistoryEventType,
    notes?: string,
    relatedId?: string
  ) => void;
  loading: boolean;
}

const InventoryContext = createContext<InventoryContextType | undefined>(
  undefined
);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    invoke<any[]>("get_items")
      .then((items) => {
        // Map snake_case to camelCase
        const mapped = items.map((item) => ({
          ...item,
          itemName: item.item_name,
          phoneBrand: item.phone_brand,
          itemType: item.item_type,
          buyingPrice: item.buying_price,
          sellingPrice: item.selling_price,
          quantityInStock: item.quantity_in_stock,
          lowStockThreshold: item.low_stock_threshold,
          supplierInfo: item.supplier_info,
          // history: [] // If you add history later
        }));
        setInventoryItems(mapped);
        console.log({ items: mapped });
      })
      .catch((err) => {
        toast.error("Failed to load inventory: " + err);
        setInventoryItems([]); // fallback or keep previous
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && typeof window !== "undefined") {
      localStorage.setItem("inventoryItems", JSON.stringify(inventoryItems));
    }
  }, [inventoryItems, loading]);

  const addInventoryItem = useCallback((itemData: InventoryFormValues) => {
    const newItemId = `inv_${Date.now().toString()}`;
    const quantity = itemData.quantityInStock ?? 0;

    const newHistoryEvent: InventoryHistoryEvent = {
      id: `hist_${Date.now()}`,
      date: new Date().toISOString(),
      type: "Purchased",
      quantityChange: quantity,
      notes: "Initial stock added",
    };

    setInventoryItems((prevItems) => [
      {
        ...itemData,
        id: newItemId,
        quantityInStock: quantity,
        lowStockThreshold: itemData.lowStockThreshold,
        supplierInfo: itemData.supplierInfo,
        history: quantity > 0 ? [newHistoryEvent] : [],
      },
      ...prevItems,
    ]);
  }, []);

  const updateInventoryItem = useCallback(
    (id: string, itemData: InventoryFormValues) => {
      setInventoryItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id === id) {
            const currentStock = item.quantityInStock ?? 0;
            const newStock = itemData.quantityInStock ?? currentStock;
            const quantityChange = newStock - currentStock;
            let newHistory = item.history ? [...item.history] : [];

            if (quantityChange !== 0) {
              const newHistoryEvent: InventoryHistoryEvent = {
                id: `hist_${Date.now()}`,
                date: new Date().toISOString(),
                type: "Manual Correction",
                quantityChange,
                notes: `Stock updated via form from ${currentStock} to ${newStock}`,
              };
              newHistory.push(newHistoryEvent);
            }

            return {
              ...item,
              ...itemData,
              quantityInStock: newStock,
              lowStockThreshold: itemData.lowStockThreshold,
              supplierInfo: itemData.supplierInfo,
              history: newHistory,
            };
          }
          return item;
        })
      );
    },
    []
  );

  const deleteInventoryItem = useCallback((id: string) => {
    setInventoryItems((prevItems) =>
      prevItems.filter((item) => item.id !== id)
    );
  }, []);

  const getItemById = useCallback(
    (id: string): InventoryItem | undefined => {
      return inventoryItems.find((item) => item.id === id);
    },
    [inventoryItems]
  );

  const updateItemQuantity = useCallback(
    (
      id: string,
      quantityChange: number,
      type: HistoryEventType,
      notes?: string,
      relatedId?: string
    ) => {
      setInventoryItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id === id) {
            const currentStock = item.quantityInStock ?? 0;

            if (quantityChange < 0 && currentStock < Math.abs(quantityChange)) {
              toast.error(
                `Not enough stock for ${
                  item.itemName
                }. Available: ${currentStock}, Needed: ${Math.abs(
                  quantityChange
                )}`
              );
              return item; // Do not update if stock is insufficient
            }

            const newQuantity = Math.max(0, currentStock + quantityChange);

            const newHistoryEvent: InventoryHistoryEvent = {
              id: `hist_${Date.now()}`,
              date: new Date().toISOString(),
              type,
              quantityChange,
              notes,
              relatedId,
            };

            const newHistory = [...(item.history || []), newHistoryEvent];

            return {
              ...item,
              quantityInStock: newQuantity,
              history: newHistory,
            };
          }
          return item;
        })
      );
    },
    []
  );

  const value = React.useMemo(
    () => ({
      inventoryItems,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      getItemById,
      updateItemQuantity,
      loading,
    }),
    [
      inventoryItems,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      getItemById,
      updateItemQuantity,
      loading,
    ]
  );

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventoryContext = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error(
      "useInventoryContext must be used within an InventoryProvider"
    );
  }
  return context;
};
