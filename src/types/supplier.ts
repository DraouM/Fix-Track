// Define payment methods as a constant array
export const PAYMENT_METHODS = [
  "Bank Transfer",
  "Cash",
  "Check",
  "Credit Card",
  "Other",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  preferredPaymentMethod?: PaymentMethod;
  creditBalance?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  history?: SupplierHistoryEvent[];
}

export type NewSupplier = Omit<
  Supplier,
  "id" | "createdAt" | "updatedAt" | "history"
>;

import { z } from "zod";

export const supplierSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Supplier name must be at least 2 characters." }),
  contactName: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  preferredPaymentMethod: z
    .enum(PAYMENT_METHODS, { message: "Please select a valid payment method." })
    .optional(),
  creditBalance: z.coerce.number().default(0),
  active: z.boolean().default(true),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;

export type SupplierHistoryEventType =
  | "Supplier Created"
  | "Supplier Updated"
  | "Payment Made"
  | "Credit Balance Adjusted"
  | "Purchase Order Created"
  | "Other";

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
