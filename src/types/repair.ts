
import type { ItemType, PhoneBrand } from '@/types/inventory';

export type RepairStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

export interface UsedPart {
  partId: string; // Corresponds to InventoryItem id
  name: string; // InventoryItem itemName
  itemType: ItemType;
  phoneBrand: PhoneBrand;
  quantity: number;
  unitCost: number; // Should be the buyingPrice of the inventory item at the time of use
}

export interface Repair {
  id: string;
  customerName: string;
  phoneNumber: string;
  deviceBrand: string;
  deviceModel: string;
  issueDescription: string;
  estimatedCost: string; // Keep as string as per original schema
  dateReceived: Date;
  repairStatus: RepairStatus;
  statusHistory?: { status: RepairStatus; timestamp: Date }[];
  usedParts?: UsedPart[]; // Array to store parts used in this repair
}
