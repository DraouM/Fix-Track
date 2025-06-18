
'use client';

// Item as it was in the cart at the time of sale
export interface SoldItem {
  inventoryItemId: string;
  itemName: string;
  quantity: number;
  sellingPriceAtSale: number; // Price per unit at the time of sale
}

export interface Sale {
  id: string;
  clientId: string;
  clientName: string; // For easier display
  items: SoldItem[];
  totalAmount: number;
  saleDate: string; // ISO string for date
}
