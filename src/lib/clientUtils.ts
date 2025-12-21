import type { Client, ClientStatus, ClientHistoryEventType, ClientHistoryEvent } from "@/types/client";

export const getClientStatusBadgeVariant = (status: ClientStatus): string =>
    status === "active" ? "success" : "destructive";

export const getClientStatusDisplayText = (status: ClientStatus): string =>
    status === "active" ? "Active" : "Inactive";

export const hasOutstandingBalance = (client: Client): boolean =>
    (client.outstandingBalance || 0) > 0;

export const calculateTotalClientBalance = (clients: Client[]): number =>
    clients.reduce((total, client) => total + (client.outstandingBalance || 0), 0);

export const getClientHistoryEventBadgeVariant = (eventType: ClientHistoryEventType): string => {
    switch (eventType) {
        case "Client Created": return "success";
        case "Client Updated": return "secondary";
        case "Payment Received": return "default";
        case "Balance Adjusted": return "warning";
        case "Sale Created": return "destructive";
        case "Other": return "outline";
        default: return "outline";
    }
};

export const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat("en-US", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);

export const formatDate = (date: string | Date): string => {
    if (!date) return "N/A";
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "Invalid Date";
    return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};
