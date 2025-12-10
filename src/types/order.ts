// Order Management Types - matches Rust models

export interface Order {
    id: string;
    order_number: string;
    supplier_id: string;
    status: 'draft' | 'completed';
    payment_status: 'unpaid' | 'partial' | 'paid';
    total_amount: number;
    paid_amount: number;
    notes?: string;
    created_at: string;
    updated_at: string;
    created_by?: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    item_id?: string; // Optional - links to inventory_items
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    notes?: string;
}

export interface OrderPayment {
    id: string;
    order_id: string;
    amount: number;
    method: string;
    date: string;
    received_by?: string;
    notes?: string;
}

export interface OrderHistory {
    id: string;
    order_id: string;
    date: string;
    event_type: 'created' | 'completed' | 'payment_added' | 'item_added' | 'item_removed' | 'updated';
    details: string;
    changed_by?: string;
}

export interface OrderWithDetails {
    order: Order;
    items: OrderItem[];
    payments: OrderPayment[];
    supplier_name: string;
}
