import { invoke } from "@tauri-apps/api/core";

export interface DailySession {
    id: string;
    start_time: string;
    end_time?: string;
    opening_balance: number;
    closing_balance?: number;
    counted_amount?: number;
    withdrawal_amount?: number;
    status: "open" | "closed";
    notes?: string;
    created_by?: string;
}

export async function startSession(
    openingBalance: number,
    notes?: string,
    createdBy?: string
): Promise<DailySession> {
    return await invoke("start_session", { openingBalance, notes, createdBy });
}

export async function getCurrentSession(): Promise<DailySession | null> {
    return await invoke("get_current_session");
}

export async function closeSession(
    id: string,
    countedAmount: number,
    withdrawalAmount: number,
    notes?: string
): Promise<void> {
    return await invoke("close_session", {
        id,
        countedAmount,
        withdrawalAmount,
        notes,
    });
}

export async function getLastSessionClosingBalance(): Promise<number> {
    return await invoke("get_last_session_closing_balance");
}
