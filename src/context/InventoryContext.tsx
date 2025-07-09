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
    // Initialize both tables before fetching items
    Promise.all([invoke("init_inventory_table"), invoke("init_history_table")])
      .then(() => {
        setLoading(true);
        invoke<any[]>("get_items")
          .then((items) => {
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
              history: item.history ?? [],
            }));
            setInventoryItems(mapped);
          })
          .catch((err) => {
            toast.error("Failed to load inventory: " + err);
            setInventoryItems([]);
          })
          .finally(() => setLoading(false));
      })
      .catch((err) => {
        toast.error("Failed to initialize tables: " + err);
      });
  }, []);

  useEffect(() => {
    if (!loading && typeof window !== "undefined") {
      localStorage.setItem("inventoryItems", JSON.stringify(inventoryItems));
    }
  }, [inventoryItems, loading]);

  const addInventoryItem = useCallback((itemData: InventoryFormValues) => {
    // Map camelCase to snake_case for Rust
    const newItemId = `inv_${Date.now()}`;
    const quantity = itemData.quantityInStock ?? 0;

    const payload = {
      id: newItemId,
      item_name: itemData.itemName,
      phone_brand: itemData.phoneBrand,
      item_type: itemData.itemType,
      buying_price: itemData.buyingPrice,
      selling_price: itemData.sellingPrice,
      quantity_in_stock: quantity,
      low_stock_threshold: itemData.lowStockThreshold,
      supplier_info: itemData.supplierInfo,
    };

    invoke("insert_item", { item: payload })
      .then(() => {
        // Insert history event after item is added
        const historyEvent = {
          id: `hist_${Date.now()}`,
          item_id: newItemId,
          date: new Date().toISOString(),
          event_type: "Purchased",
          quantity_change: quantity,
          notes: "Initial stock added",
          related_id: null,
        };
        return invoke("insert_history_event", { event: historyEvent });
      })
      .then(() => {
        toast.success("Item and history event added!");
        // Refetch inventory
        setLoading(true);
        invoke<any[]>("get_items")
          .then((items) => {
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
              history: item.history ?? [],
            }));
            setInventoryItems(mapped);
          })
          .catch((err) => {
            toast.error("Failed to reload inventory: " + err);
          })
          .finally(() => setLoading(false));
      })
      .catch((err) => {
        toast.error("Failed to add item or history: " + err);
      });
  }, []);

  const updateInventoryItem = useCallback(
    (id: string, itemData: InventoryFormValues) => {
      // Find the current item for stock diff
      const currentItem = inventoryItems.find((item) => item.id === id);
      const currentStock = currentItem?.quantityInStock ?? 0;
      const newStock = itemData.quantityInStock ?? currentStock;
      const quantityChange = newStock - currentStock;

      // Map camelCase to snake_case for Rust
      const payload = {
        id,
        item_name: itemData.itemName,
        phone_brand: itemData.phoneBrand,
        item_type: itemData.itemType,
        buying_price: itemData.buyingPrice,
        selling_price: itemData.sellingPrice,
        quantity_in_stock: newStock,
        low_stock_threshold: itemData.lowStockThreshold,
        supplier_info: itemData.supplierInfo,
      };

      invoke("update_item", { item: payload })
        .then(() => {
          // Optionally, insert a history event if stock changed
          if (quantityChange !== 0) {
            const historyEvent = {
              id: `hist_${Date.now()}`,
              item_id: id,
              date: new Date().toISOString(),
              event_type: "Manual Correction",
              quantity_change: quantityChange,
              notes: `Stock updated via form from ${currentStock} to ${newStock}`,
              related_id: null,
            };
            return invoke("insert_history_event", { event: historyEvent });
          }
        })
        .then(() => {
          toast.success("Item updated!");
          // Refetch inventory
          setLoading(true);
          invoke<any[]>("get_items")
            .then((items) => {
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
                history: item.history ?? [],
              }));
              setInventoryItems(mapped);
            })
            .catch((err) => {
              toast.error("Failed to reload inventory: " + err);
            })
            .finally(() => setLoading(false));
        })
        .catch((err) => {
          toast.error("Failed to update item: " + err);
        });
    },
    [inventoryItems]
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
