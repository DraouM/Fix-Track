
'use client';

import type { InventoryItem, InventoryFormValues, InventoryHistoryEvent, HistoryEventType } from '@/types/inventory';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface InventoryContextType {
  inventoryItems: InventoryItem[];
  addInventoryItem: (itemData: InventoryFormValues) => void;
  updateInventoryItem: (id: string, itemData: InventoryFormValues) => void;
  deleteInventoryItem: (id: string) => void;
  getItemById: (id: string) => InventoryItem | undefined;
  updateItemQuantity: (id: string, quantityChange: number, type: HistoryEventType, notes?: string, relatedId?: string) => void;
  loading: boolean;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// Sample Data for testing
const sampleInventoryItems: InventoryItem[] = [
  {
    id: 'inv_1',
    itemName: 'iPhone 12 Screen Assembly',
    phoneBrand: 'Apple',
    itemType: 'Screen',
    buyingPrice: 80,
    sellingPrice: 150,
    quantityInStock: 15,
    history: [
      { id: 'hist_1_1', date: new Date('2024-07-20T09:00:00Z').toISOString(), type: 'Purchased', quantityChange: 20, notes: 'Initial stock from supplier A' },
      { id: 'hist_1_2', date: new Date('2024-07-25T11:30:00Z').toISOString(), type: 'Used in Repair', quantityChange: -1, notes: 'Repair for Alice', relatedId: '1' },
      { id: 'hist_1_3', date: new Date('2024-07-28T15:00:00Z').toISOString(), type: 'Sold', quantityChange: -4, notes: 'Direct sale to customer', relatedId: 'sale_1' },
    ]
  },
  {
    id: 'inv_2',
    itemName: 'Samsung Galaxy S21 Battery',
    phoneBrand: 'Samsung',
    itemType: 'Battery',
    buyingPrice: 25,
    sellingPrice: 60,
    quantityInStock: 3, // Low stock example
    history: [
        { id: 'hist_2_1', date: new Date('2024-07-15T10:00:00Z').toISOString(), type: 'Purchased', quantityChange: 10, notes: 'Initial stock' },
        { id: 'hist_2_2', date: new Date('2024-07-29T14:05:00Z').toISOString(), type: 'Used in Repair', quantityChange: -1, notes: 'Repair for Bob', relatedId: '2' },
        { id: 'hist_2_3', date: new Date('2024-07-30T12:00:00Z').toISOString(), type: 'Manual Correction', quantityChange: -1, notes: 'Stock count adjustment, item lost' },
        { id: 'hist_2_4', date: new Date('2024-07-31T18:00:00Z').toISOString(), type: 'Sold', quantityChange: -5, notes: 'Sale to walk-in customer', relatedId: 'sale_2' },
    ]
  },
  {
    id: 'inv_3',
    itemName: 'Google Pixel 6 Charging Port Flex',
    phoneBrand: 'Google',
    itemType: 'Charger', 
    buyingPrice: 10,
    sellingPrice: 35,
    quantityInStock: 22,
    history: [
        { id: 'hist_3_1', date: new Date('2024-07-22T16:20:00Z').toISOString(), type: 'Purchased', quantityChange: 25, notes: 'Stock from supplier B' },
        { id: 'hist_3_2', date: new Date('2024-07-30T11:05:00Z').toISOString(), type: 'Used in Repair', quantityChange: -3, notes: 'Used in 3 repairs', relatedId: '3' },
    ]
  },
  {
    id: 'inv_4',
    itemName: 'Universal USB-C Cable 1m',
    phoneBrand: 'Other',
    itemType: 'Cable',
    buyingPrice: 3,
    sellingPrice: 10,
    quantityInStock: 50,
    history: [
        { id: 'hist_4_1', date: new Date('2024-06-30T10:00:00Z').toISOString(), type: 'Purchased', quantityChange: 50, notes: 'Initial stock' }
    ]
  },
  {
    id: 'inv_5',
    itemName: 'Huawei P30 Pro Motherboard',
    phoneBrand: 'Huawei',
    itemType: 'Motherboard',
    buyingPrice: 120,
    sellingPrice: 250,
    quantityInStock: 8,
    history: [
        { id: 'hist_5_1', date: new Date('2024-07-01T11:00:00Z').toISOString(), type: 'Purchased', quantityChange: 10, notes: 'Initial stock' },
        { id: 'hist_5_2', date: new Date('2024-07-15T14:30:00Z').toISOString(), type: 'Returned', quantityChange: -2, notes: 'Returned to supplier, faulty units' },
    ]
  },
];

const getInitialInventoryState = (): InventoryItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  const savedItems = localStorage.getItem('inventoryItems');
  if (savedItems) {
    try {
      const parsedItems = JSON.parse(savedItems) as InventoryItem[];
      const validatedItems = parsedItems.map(item => ({
        ...item,
        quantityInStock: (item.quantityInStock === undefined || item.quantityInStock === null) ? 0 : Number(item.quantityInStock),
        history: item.history || [],
      }));
      if (validatedItems.length > 0) {
        return validatedItems;
      }
    } catch (error) {
      console.error("Failed to parse inventory items from localStorage", error);
    }
  }
  return sampleInventoryItems.map(item => ({
    ...item,
    quantityInStock: (item.quantityInStock === undefined || item.quantityInStock === null) ? 0 : Number(item.quantityInStock),
    history: item.history || []
  }));
};


export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setInventoryItems(getInitialInventoryState());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && typeof window !== 'undefined') {
      localStorage.setItem('inventoryItems', JSON.stringify(inventoryItems));
    }
  }, [inventoryItems, loading]);

  const addInventoryItem = useCallback((itemData: InventoryFormValues) => {
    const newItemId = `inv_${Date.now().toString()}`;
    const quantity = itemData.quantityInStock ?? 0;

    const newHistoryEvent: InventoryHistoryEvent = {
      id: `hist_${Date.now()}`,
      date: new Date().toISOString(),
      type: 'Purchased',
      quantityChange: quantity,
      notes: 'Initial stock added'
    };

    setInventoryItems((prevItems) => [
      { 
        ...itemData, 
        id: newItemId,
        quantityInStock: quantity,
        history: quantity > 0 ? [newHistoryEvent] : []
      },
      ...prevItems,
    ]);
  }, []);

  const updateInventoryItem = useCallback((id: string, itemData: InventoryFormValues) => {
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
              type: 'Manual Correction',
              quantityChange,
              notes: `Stock updated via form from ${currentStock} to ${newStock}`
            };
            newHistory.push(newHistoryEvent);
          }

          return { ...item, ...itemData, quantityInStock: newStock, history: newHistory };
        }
        return item;
      })
    );
  }, []);

  const deleteInventoryItem = useCallback((id: string) => {
    setInventoryItems((prevItems) => prevItems.filter((item) => item.id !== id));
  }, []);

  const getItemById = useCallback((id: string): InventoryItem | undefined => {
    return inventoryItems.find(item => item.id === id);
  }, [inventoryItems]);

  const updateItemQuantity = useCallback((id: string, quantityChange: number, type: HistoryEventType, notes?: string, relatedId?: string) => {
    setInventoryItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const currentStock = item.quantityInStock ?? 0;
          
          if (quantityChange < 0 && currentStock < Math.abs(quantityChange)) {
            toast.error(`Not enough stock for ${item.itemName}. Available: ${currentStock}, Needed: ${Math.abs(quantityChange)}`);
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

          return { ...item, quantityInStock: newQuantity, history: newHistory };
        }
        return item;
      })
    );
  }, []);

  const value = React.useMemo(() => ({
    inventoryItems,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getItemById,
    updateItemQuantity,
    loading,
  }), [inventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem, getItemById, updateItemQuantity, loading]);

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventoryContext = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventoryContext must be used within an InventoryProvider');
  }
  return context;
};
