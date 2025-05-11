
export const PHONE_BRANDS = ['All', 'Samsung', 'Apple', 'Huawei', 'Xiaomi', 'Google', 'OnePlus', 'Oppo', 'Vivo', 'Realme', 'Other'] as const;
export type PhoneBrand = typeof PHONE_BRANDS[number];

export const ITEM_TYPES = ['All', 'Battery', 'Screen', 'Charger', 'Motherboard', 'Cable', 'Case', 'Audio Jack', 'Camera', 'Button', 'Other'] as const;
export type ItemType = typeof ITEM_TYPES[number];

export interface InventoryItem {
  id: string;
  itemName: string;
  phoneBrand: PhoneBrand;
  itemType: ItemType;
  buyingPrice: number;
  sellingPrice: number;
  quantityInStock?: number;
  // Timestamps for tracking, can be added later if needed
  // createdAt: Date;
  // updatedAt: Date;
}

// Schema for form validation, can be placed here or in the form component
import { z } from 'zod';

export const inventoryItemSchema = z.object({
  itemName: z.string().min(2, { message: "Item name must be at least 2 characters." }),
  phoneBrand: z.enum(PHONE_BRANDS.filter(brand => brand !== 'All') as [PhoneBrand, ...PhoneBrand[]], { message: "Please select a valid phone brand." }),
  itemType: z.enum(ITEM_TYPES.filter(type => type !== 'All') as [ItemType, ...ItemType[]], { message: "Please select a valid item type." }),
  buyingPrice: z.preprocess(
    (val) => parseFloat(z.string().parse(val)),
    z.number().positive({ message: "Buying price must be a positive number." })
  ),
  sellingPrice: z.preprocess(
    (val) => parseFloat(z.string().parse(val)),
    z.number().positive({ message: "Selling price must be a positive number." })
  ),
  quantityInStock: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : parseInt(z.string().parse(val), 10),
    z.number().int().min(0, { message: "Quantity must be a non-negative integer." }).optional()
  ),
});

export type InventoryFormValues = z.infer<typeof inventoryItemSchema>;
