// Define payment methods as a constant array
export const PAYMENT_METHODS = [
  "Bank Transfer",
  "Cash",
  "Check",
  "Credit Card",
  "Other",
] as const;

// Type for payment methods
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// Main Supplier interface defining the structure of a supplier object
export interface Supplier {
  // Unique identifier for the supplier
  id: string;

  // Supplier name (required)
  name: string;

  // Optional supplier contact information
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;

  // Optional notes about the supplier
  notes?: string;

  // Preferred payment method from the defined options
  preferredPaymentMethod?: PaymentMethod;

  // Supplier status - replaced 'active' boolean with more descriptive status
  status: "active" | "inactive";

  // Timestamps for record creation and updates
  createdAt: string;
  updatedAt: string;

  // Credit balance (renamed from creditBalance to outstandingBalance)
  outstandingBalance: number;

  // Optional history of events related to this supplier
  history?: SupplierHistoryEvent[];

  // Additional properties used in SupplierPageClient.tsx
  productsSupplied?: number;
  totalOrders?: number;
  avgDeliveryTime?: number;
  reliabilityScore?: number;
  lastOrderDate?: string;
  paymentTerms?: string;
}

// Type for creating a new supplier (omits auto-generated fields)
export type NewSupplier = Omit<
  Supplier,
  "id" | "createdAt" | "updatedAt" | "history" | "outstandingBalance"
>;

// Import validation library
import { z } from "zod";

// Validation schema for supplier data
export const supplierSchema = z.object({
  // Supplier name must be at least 2 characters
  name: z
    .string()
    .min(2, { message: "Supplier name must be at least 2 characters." }),

  // Optional contact information
  contactName: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),

  // Optional notes
  notes: z.string().optional(),

  // Preferred payment method validation
  preferredPaymentMethod: z
    .enum(PAYMENT_METHODS, { message: "Please select a valid payment method." })
    .optional(),

  // Status validation
  status: z.enum(["active", "inactive"]).default("active"),

  // Credit balance validation
  outstandingBalance: z.coerce.number().default(0),

  // Additional properties with validation
  totalOrders: z.coerce.number().optional(),
  lastOrderDate: z.string().optional(),
  paymentTerms: z.string().optional(),
});

// Type inference from the validation schema
export type SupplierFormValues = z.infer<typeof supplierSchema>;

// Types for supplier history events
export type SupplierHistoryEventType =
  | "Supplier Created"
  | "Supplier Updated"
  | "Payment Made"
  | "Credit Balance Adjusted"
  | "Purchase Order Created"
  | "Other";

// Interface for supplier history events
export interface SupplierHistoryEvent {
  id: string;
  supplierId: string;
  date: string;
  type: SupplierHistoryEventType;
  notes?: string;
  amount?: number;
  relatedId?: string;
  userId?: string;
}
