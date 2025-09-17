// src/types/repair.ts

import z from "zod";

export type RepairStatus =
  | "Pending" // Waiting to start
  | "In Progress" // Being repaired
  | "Completed" // Repair done, still in shop
  | "Delivered"; // Customer picked up

export type PaymentStatus = "Unpaid" | "Partially Paid" | "Paid";

export interface Payment {
  id: string; // unique ID (e.g., pay_123)
  amount: number; // payment amount
  date: string; // ISO date string
  method: "Cash" | "Card" | "BankTransfer";
  receivedBy?: string; // employee who logged it
}

export interface UsedPart {
  partId: string; // reference to inventory item
  partName: string; // denormalized for convenience
  quantity: number;
  unitPrice: number;
}

export interface RepairHistoryEvent {
  id: string; // unique ID for history entry
  repairId: string; // reference to repair
  date: string; // ISO date string
  eventType:
    | "StatusChanged"
    | "PaymentAdded"
    | "PartAdded"
    | "PartRemoved"
    | "RepairUpdated";
  details: string; // free text description
  changedBy?: string; // employee responsible
}

export interface Repair {
  id: string; // unique repair ID
  customerName: string;
  customerPhone: string;

  deviceBrand: string;
  deviceModel: string;

  issueDescription: string;
  estimatedCost: number;

  status: RepairStatus;
  paymentStatus: PaymentStatus;

  usedParts: UsedPart[];
  payments: Payment[];
  history: RepairHistoryEvent[];

  createdAt: string;
  updatedAt: string;
}

// Validation schema
export const repairSchema = z.object({
  customerName: z
    .string()
    .min(2, "Customer name must be at least 2 characters."),
  phoneNumber: z.string().optional(),
  deviceBrand: z.string().min(1, "Device brand is required."),
  deviceModel: z.string().min(1, "Device model is required."),
  issueDescription: z
    .string()
    .min(5, "Issue description must be at least 5 characters."),
  estimatedCost: z.coerce.number().nonnegative(),
  dateReceived: z.coerce.date(),
  repairStatus: z.enum([
    "Pending",
    "In Progress",
    "Completed",
    "Cancelled",
    "Delivered",
  ]),
  paymentStatus: z.enum(["Unpaid", "Paid", "Partially Paid", "Refunded"]),
});

export type RepairFormValues = z.infer<typeof repairSchema>;
