
export interface InventoryItem {
  id: string;
  itemName: string;
  phoneBrand: PhoneBrand;
  itemType: ItemType;
  buyingPrice: number;
  sellingPrice: number;
  quantityInStock?: number;
  lowStockThreshold?: number;
  supplierInfo?: string;
  history?: InventoryHistoryEvent[]; // Add history array
}

export const PHONE_BRANDS = [
  "All",
  "Samsung",
  "Apple",
  "Huawei",
  "Xiaomi",
  "Google",
  "OnePlus",
  "Oppo",
  "Vivo",
  "Realme",
  "Other",
] as const;
export type PhoneBrand = (typeof PHONE_BRANDS)[number];

export const ITEM_TYPES = [
  "All",
  "Battery",
  "Screen",
  "Charger",
  "Motherboard",
  "Cable",
  "Case",
  "Audio Jack",
  "Camera",
  "Button",
  "Other",
] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

// New Type for history events
export type HistoryEventType =
  | "Purchased"
  | "Used in Repair"
  | "Sold"
  | "Manual Correction"
  | "Returned";

export interface InventoryHistoryEvent {
  id: string;
  itemId: string; // ID of the inventory item
  date: string; // ISO string
  type: HistoryEventType;
  quantityChange: number; // e.g., +10 for purchase, -1 for sale
  notes?: string; // e.g., "Repair ID: 3" or "Sale ID: sale_123"
  relatedId?: string; // repair ID, sale ID, etc.
}

// Schema for form validation, can be placed here or in the form component
import { z } from "zod";

export const inventoryItemSchema = z.object({
  itemName: z
    .string()
    .min(2, { message: "Item name must be at least 2 characters." }),

  phoneBrand: z.enum(
    PHONE_BRANDS.filter((brand) => brand !== "All") as [
      PhoneBrand,
      ...PhoneBrand[]
    ],
    { message: "Please select a valid phone brand." }
  ),

  itemType: z.enum(
    ITEM_TYPES.filter((type) => type !== "All") as [ItemType, ...ItemType[]],
    { message: "Please select a valid item type." }
  ),

  buyingPrice: z.coerce
    .number()
    .positive({ message: "Buying price must be a positive number." }),

  sellingPrice: z.coerce
    .number()
    .positive({ message: "Selling price must be a positive number." }),

  quantityInStock: z.coerce
    .number()
    .int()
    .min(0, { message: "Quantity must be a non-negative integer." })
    .optional(),

  lowStockThreshold: z.coerce
    .number()
    .int()
    .min(0, { message: "Low stock threshold must be a non-negative integer." })
    .optional(),

  supplierInfo: z.union([z.string(), z.undefined(), z.null()]).optional(),
});

export type InventoryFormValues = z.infer<typeof inventoryItemSchema>;
