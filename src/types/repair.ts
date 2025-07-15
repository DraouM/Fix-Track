import type { ItemType, PhoneBrand } from "@/types/inventory";

export type RepairStatus =
  | "Pending"
  | "In Progress"
  | "Completed"
  | "Cancelled";
export type PaymentStatus = "Unpaid" | "Paid" | "Partially Paid" | "Refunded";

export interface UsedPart {
  partId: string; // Corresponds to InventoryItem id
  name: string; // InventoryItem itemName
  itemType: ItemType;
  phoneBrand: PhoneBrand;
  quantity: number;
  unitCost: number; // Should be the buyingPrice of the inventory item at the time of use
}

export type RepairHistoryType = "status" | "parts" | "payment" | "note";

export interface RepairHistoryEntry {
  type: RepairHistoryType;
  timestamp: Date | string;
  details: string;
}

export interface Repair {
  id: string;
  customerName: string;
  phoneNumber?: string; // Made optional to match form behavior
  deviceBrand: string;
  deviceModel: string;
  issueDescription: string;
  estimatedCost: string; // Keep as string as per original schema
  dateReceived: Date;
  repairStatus: RepairStatus;
  paymentStatus: PaymentStatus; // New field
  statusHistory?: { status: RepairStatus; timestamp: Date }[];
  usedParts?: UsedPart[]; // Array to store parts used in this repair
  history?: RepairHistoryEntry[];
}
