
import { z } from 'zod';

export const clientFormSchema = z.object({
  name: z.string().min(2, { message: "Client name must be at least 2 characters." }),
  phoneNumber: z.string()
    .regex(/^0[567]\d{8}$/, { message: "Phone number must be a 10-digit Algerian number (e.g., 05XXXXXXXX)." })
    .optional()
    .or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

export interface Client extends ClientFormValues {
  id: string;
  debt: number; // Added debt field
  // purchaseHistoryIds: string[]; // To be added later
}
