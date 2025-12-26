import { invoke } from "@tauri-apps/api/core";

export interface Expense {
    id: string;
    amount: number;
    reason: string;
    date: string;
    session_id?: string;
    category?: string;
    created_by?: string;
}

export async function addExpense(expense: Expense): Promise<Expense> {
    return await invoke("add_expense", { expense });
}

export async function getTodayExpenses(): Promise<Expense[]> {
    return await invoke("get_today_expenses");
}

export async function getExpensesBySession(sessionId: string): Promise<Expense[]> {
    return await invoke("get_expenses_by_session", { sessionId });
}
