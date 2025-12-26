import { invoke } from "@tauri-apps/api/core";
import { Transaction, TransactionItem, TransactionPayment, TransactionWithDetails } from "@/types/transaction";

export async function createTransaction(transaction: Transaction): Promise<Transaction> {
    return await invoke("create_transaction", { transaction });
}

export async function getTransactions(typeFilter?: string, statusFilter?: string): Promise<Transaction[]> {
    return await invoke("get_transactions", { typeFilter, statusFilter });
}

export async function getTransactionById(txId: string): Promise<TransactionWithDetails | null> {
    return await invoke("get_transaction_by_id", { txId });
}

export async function addTransactionItem(item: TransactionItem): Promise<void> {
    await invoke("add_transaction_item", { item });
}

export async function removeTransactionItem(itemId: string, transactionId: string): Promise<void> {
    await invoke("remove_transaction_item", { itemId, transactionId });
}

export async function addTransactionPayment(payment: TransactionPayment): Promise<void> {
    await invoke("add_transaction_payment", { payment });
}

export async function completeTransaction(txId: string): Promise<void> {
    await invoke("complete_transaction", { txId });
}

export async function submitTransaction(
    transaction: Transaction,
    items: TransactionItem[],
    payments: TransactionPayment[]
): Promise<void> {
    await invoke("submit_transaction", { transaction, items, payments });
}
