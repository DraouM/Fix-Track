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

import i18n from '@/lib/i18n';
import { formatCurrency as formatCurrencyI18n, formatDate as formatDateI18n } from '@/lib/formatters';
import { Currency } from '@/types/settings';

export const formatCurrency = (amount: number): string => {
    // Default to USD if currency not available in context/settings
    // In a real app, you might want to get this from a store or context
    // For now, we'll try to get it from settings if possible or default to USD
    // Since this is a util, we probably default to current settings if available
    // But accessing context outside component is tricky.
    // We'll stick to formatting with current locale and generic currency for now
    // Or better, let's try to grab currency from localStorage if needed, or just use 'USD' as fallback
    // The previous implementation hardcoded 'en-US' and didn't specify currency (defaulted to USD potentially or just number)
    // The previous implementation used style: "decimal", so it didn't show currency symbol.
    // We should keep that behavior or enhance it.
    // LET'S KEEP "decimal" style to be safe as this function signature doesn't take currency.

    return new Intl.NumberFormat(i18n.language || 'en-US', {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

export const formatDate = (date: string | Date): string => {
    if (!date) return "N/A";
    return formatDateI18n(date, i18n.language || 'en-US');
};
