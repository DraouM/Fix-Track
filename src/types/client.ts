import { z } from "zod";

export const CLIENT_STATUSES = ["active", "inactive"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export interface Client {
    id: string;
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
    outstandingBalance: number;
    status: ClientStatus;
    createdAt: string;
    updatedAt: string;
    history?: ClientHistoryEvent[];
}

export type NewClient = Omit<
    Client,
    "id" | "createdAt" | "updatedAt" | "history" | "outstandingBalance"
>;

export const clientSchema = z.object({
    name: z.string().min(2, { message: "Client name must be at least 2 characters." }),
    contactName: z.string().optional(),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(CLIENT_STATUSES).default("active"),
    outstandingBalance: z.coerce.number().default(0),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

export type ClientHistoryEventType =
    | "Client Created"
    | "Client Updated"
    | "Payment Received"
    | "Balance Adjusted"
    | "Sale Created"
    | "Other";

export interface ClientHistoryEvent {
    id: string;
    clientId: string;
    date: string;
    type: ClientHistoryEventType;
    notes?: string;
    amount?: number;
    relatedId?: string;
    userId?: string;
}
