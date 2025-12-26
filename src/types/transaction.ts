export type TransactionType = "Sale" | "Purchase";

export interface TransactionItem {
    id: string;
    transaction_id: string;
    item_id?: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    notes?: string;
}

export interface TransactionPayment {
    id: string;
    transaction_id: string;
    amount: number;
    method: string;
    date: string;
    received_by?: string;
    notes?: string;
    session_id?: string | null;
}

export interface Transaction {
    id: string;
    transaction_number: string;
    transaction_type: TransactionType;
    party_id: string; // client_id or supplier_id
    party_type: "Client" | "Supplier";
    status: "Draft" | "Completed" | "Cancelled";
    payment_status: "Unpaid" | "Partially" | "Paid";
    total_amount: number;
    paid_amount: number;
    notes?: string;
    created_at: string;
    updated_at: string;
    created_by?: string;
}

export interface TransactionWithDetails {
    transaction: Transaction;
    items: TransactionItem[];
    payments: TransactionPayment[];
    party_name: string;
}
