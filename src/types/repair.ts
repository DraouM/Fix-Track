// src/types/repair.ts

import z from "zod";
import { DateRange } from "react-day-picker";

// --- ENUM TYPES ---
export type RepairStatus =
  | "Pending" // Waiting to start
  | "In Progress" // Being repaired
  | "Completed" // Repair done, still in shop
  | "Delivered"; // Customer picked up

export type PaymentStatus = "Unpaid" | "Partially Paid" | "Paid" | "Refunded";

// repair.ts
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
  history: RepairHistory[];

  // Calculated payment fields
  totalPaid?: number;
  remainingBalance?: number;

  createdAt: string;
  updatedAt: string;
  code?: string;
}

export interface RepairDb {
  id: string | number; // unique repair ID
  customer_name: string;
  customer_phone: string;

  device_brand: string;
  device_model: string;

  issue_description: string;
  estimated_cost: number;

  status: RepairStatus;
  payment_status: PaymentStatus;

  used_parts: UsedPart[];
  payments: Payment[];
  history: RepairHistory[];

  created_at: string;
  updated_at: string;
  code?: string;
}

// --- PAYMENTS ---
// Frontend - Updated to match backend RepairPayment structure
export interface Payment {
  id: string; // Changed from number to string
  repair_id: string; // Changed from repairId (number) to repair_id (string)
  amount: number;
  date: string; // Changed from paid_at to date
  method: string; // Added to match backend
  received_by?: string; // Added to match backend
}

// When adding a payment
// Input for DB / API
export interface PaymentInput {
  repair_id: string; // Changed to string to match backend
  amount: number;
  method: string;
}

// --- USED PARTS ---
// Frontend
export interface UsedPart {
  id: number;
  repairId: number;
  partName: string;
  cost: number;
  quantity: number;
}
// Input for DB / API
export interface UsedPartInput {
  repair_id: number;
  part_name: string;
  cost: number;
  quantity: number;
}

// --- REPAIR HISTORY ---

export type RepairEventType =
  | { type: "StatusChanged"; from: RepairStatus; to: RepairStatus }
  | { type: "PaymentAdded"; amount: number }
  | { type: "PartAdded"; partName: string; qty: number }
  | { type: "Note"; text: string };

export interface RepairHistory {
  id: string;
  repairId: string;
  timestamp: string;
  event: RepairEventType;
  changedBy?: string;
}

// Input when adding a history record
export interface RepairHistoryInput {
  repairId: number;
  actionType: "status_update" | "payment_update" | "part_added" | "note";
  description: string;
  changedBy?: string;
}

// Schema for used parts in the form
const usedPartFormSchema = z.object({
  partId: z.string(),
  name: z.string().min(1, "Part name is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitCost: z.coerce.number().nonnegative("Unit cost must be non-negative"),
});

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
  usedParts: z.array(usedPartFormSchema).optional().default([]),
});

export type RepairFormValues = z.infer<typeof repairSchema>;

// Type for used parts in the form (matches the structure used in RepairForm)
export interface UsedPartForm {
  partId: string;
  name: string;
  quantity: number;
  unitCost: number;
}

// Date filtering types
export interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

// Enhanced filter configuration for repairs
export interface RepairDateFilterOptions {
  /** Filter by creation date */
  createdAt?: DateRange;
  /** Filter by last updated date */
  updatedAt?: DateRange;
  /** Filter by completion date (for completed/delivered repairs) */
  completedAt?: DateRange;
}

// Quick date preset type
export interface DateRangePreset {
  label: string;
  value: DateRange;
  description?: string;
}
