import { invoke } from "@tauri-apps/api/core";

export interface Expense {
    id: string;
    amount: number;
    reason: string;
    date: string;
    session_id?: string;
    category?: string;
    created_by?: string;
    method?: string;
    party_name?: string;
}

export async function addExpense(expense: Expense): Promise<Expense> {
    return await invoke("add_expense", { expense });
}

export async function getAllExpenses(): Promise<Expense[]> {
    return await invoke("get_all_expenses");
}

export async function updateExpense(
    id: string,
    amount: number,
    method: string
): Promise<void> {
    return await invoke("update_expense", { id, amount, method });
}

export async function deleteExpense(id: string): Promise<void> {
    return await invoke("delete_expense", { id });
}

export async function getTodayExpenses(): Promise<Expense[]> {
    return await invoke("get_today_expenses");
}

export async function getExpensesBySession(sessionId: string): Promise<Expense[]> {
    return await invoke("get_expenses_by_session", { sessionId });
}
