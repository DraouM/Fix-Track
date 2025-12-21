export type SaleStatus = 'draft' | 'completed';
export type SalePaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface Sale {
    id: string;
    sale_number: string;
    client_id: string;
    status: SaleStatus;
    payment_status: SalePaymentStatus;
    total_amount: number;
    paid_amount: number;
    notes?: string;
    created_at: string;
    updated_at: string;
    created_by?: string;
}

export interface SaleItem {
    id: string;
    sale_id: string;
    item_id?: string; // Links to inventory_items
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    notes?: string;
}

export interface SalePayment {
    id: string;
    sale_id: string;
    amount: number;
    method: string;
    date: string;
    received_by?: string;
    notes?: string;
}

export interface SaleHistory {
    id: string;
    sale_id: string;
    date: string;
    event_type: 'created' | 'completed' | 'payment_added' | 'item_added' | 'item_removed' | 'updated';
    details: string;
    changed_by?: string;
}

export interface SaleWithDetails {
    sale: Sale;
    items: SaleItem[];
    payments: SalePayment[];
    client_name: string;
}
