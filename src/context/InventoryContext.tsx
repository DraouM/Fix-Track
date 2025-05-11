
'use client';

import type { InventoryItem, InventoryFormValues } from '@/types/inventory';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface InventoryContextType {
  inventoryItems: InventoryItem[];
  addInventoryItem: (itemData: InventoryFormValues) => void;
  updateInventoryItem: (id: string, itemData: InventoryFormValues) => void;
  deleteInventoryItem: (id: string) => void;
  getItemById: (id: string) => InventoryItem | undefined;
  updateItemQuantity: (id: string, quantityChange: number) => void; // quantityChange can be negative (deduct) or positive (add back)
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
  },
  {
    id: 'inv_2',
    itemName: 'Samsung Galaxy S21 Battery',
    phoneBrand: 'Samsung',
    itemType: 'Battery',
    buyingPrice: 25,
    sellingPrice: 60,
    quantityInStock: 3, // Low stock example
  },
  {
    id: 'inv_3',
    itemName: 'Google Pixel 6 Charging Port Flex',
    phoneBrand: 'Google',
    itemType: 'Charger', 
    buyingPrice: 10,
    sellingPrice: 35,
    quantityInStock: 22,
  },
  {
    id: 'inv_4',
    itemName: 'Universal USB-C Cable 1m',
    phoneBrand: 'Other',
    itemType: 'Cable',
    buyingPrice: 3,
    sellingPrice: 10,
    quantityInStock: 50,
  },
  {
    id: 'inv_5',
    itemName: 'Huawei P30 Pro Motherboard',
    phoneBrand: 'Huawei',
    itemType: 'Motherboard',
    buyingPrice: 120,
    sellingPrice: 250,
    quantityInStock: 8,
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
      // Ensure quantityInStock is a number, default to 0 if undefined or null
      const validatedItems = parsedItems.map(item => ({
        ...item,
        quantityInStock: (item.quantityInStock === undefined || item.quantityInStock === null) ? 0 : Number(item.quantityInStock)
      }));
      if (validatedItems.length > 0) {
        return validatedItems;
      }
    } catch (error) {
      console.error("Failed to parse inventory items from localStorage", error);
    }
  }
  // Ensure sample data also has quantityInStock as number
  return sampleInventoryItems.map(item => ({
    ...item,
    quantityInStock: (item.quantityInStock === undefined || item.quantityInStock === null) ? 0 : Number(item.quantityInStock)
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
    setInventoryItems((prevItems) => [
      { 
        ...itemData, 
        id: `inv_${Date.now().toString()}`,
        quantityInStock: itemData.quantityInStock ?? 0 // Ensure quantity is number
      },
      ...prevItems,
    ]);
  }, []);

  const updateInventoryItem = useCallback((id: string, itemData: InventoryFormValues) => {
    setInventoryItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, ...itemData, quantityInStock: itemData.quantityInStock ?? item.quantityInStock ?? 0 } : item
      )
    );
  }, []);

  const deleteInventoryItem = useCallback((id: string) => {
    setInventoryItems((prevItems) => prevItems.filter((item) => item.id !== id));
  }, []);

  const getItemById = useCallback((id: string): InventoryItem | undefined => {
    return inventoryItems.find(item => item.id === id);
  }, [inventoryItems]);

  const updateItemQuantity = useCallback((id: string, quantityChange: number) => {
    setInventoryItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const currentStock = item.quantityInStock ?? 0;
          const newQuantity = Math.max(0, currentStock + quantityChange); // Ensure stock doesn't go below 0
          return { ...item, quantityInStock: newQuantity };
        }
        return item;
      })
    );
  }, []);

  const value: InventoryContextType = {
    inventoryItems,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getItemById,
    updateItemQuantity,
    loading,
  };

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
