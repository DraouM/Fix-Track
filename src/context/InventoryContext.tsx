
'use client';

import type { InventoryItem, InventoryFormValues } from '@/types/inventory';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface InventoryContextType {
  inventoryItems: InventoryItem[];
  addInventoryItem: (itemData: InventoryFormValues) => void;
  updateInventoryItem: (id: string, itemData: InventoryFormValues) => void;
  deleteInventoryItem: (id: string) => void;
  loading: boolean;
  getItemById: (id: string) => InventoryItem | undefined;
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
    itemType: 'Charger', // Or 'Cable' or 'Motherboard' component
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
      if (parsedItems.length > 0) {
        return parsedItems;
      }
    } catch (error) {
      console.error("Failed to parse inventory items from localStorage", error);
    }
  }
  return sampleInventoryItems;
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
      { ...itemData, id: `inv_${Date.now().toString()}` }, // Ensure prices are numbers
      ...prevItems,
    ]);
  }, []);

  const updateInventoryItem = useCallback((id: string, itemData: InventoryFormValues) => {
    setInventoryItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, ...itemData } : item
      )
    );
  }, []);

  const deleteInventoryItem = useCallback((id: string) => {
    setInventoryItems((prevItems) => prevItems.filter((item) => item.id !== id));
  }, []);

  const getItemById = useCallback((id: string) => {
    return inventoryItems.find(item => item.id === id);
  }, [inventoryItems]);

  // TODO: Implement actual Firebase Firestore interactions for persistence and real-time updates.
  // TODO: Add Firebase Authentication checks for admin-only access.

  const value: InventoryContextType = {
    inventoryItems,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getItemById,
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
