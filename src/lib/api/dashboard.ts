import { invoke } from "@tauri-apps/api/core";

export interface RevenueData {
    date: string;
    revenue: number;
    profit: number;
}

export interface RevenueBreakdown {
    category: string;
    amount: number;
}

export interface DashboardStats {
    total_revenue: number;
    net_cash: number;
    active_repairs: number;
    completed_repairs: number;
    stock_alerts: number;
    out_of_stock: number;
    revenue_change: number;
}

export async function getRevenueHistory(days: number = 7): Promise<RevenueData[]> {
    return await invoke("get_revenue_history", { days });
}

export async function getRevenueBreakdown(days: number = 30): Promise<RevenueBreakdown[]> {
    return await invoke("get_revenue_breakdown", { days });
}

export async function getDashboardStats(): Promise<DashboardStats> {
    return await invoke("get_dashboard_stats");
}

export async function getRevenueHistoryByRange(startDate: string, endDate: string): Promise<RevenueData[]> {
    return await invoke("get_revenue_history_by_range", { startDate, endDate });
}

export async function getDashboardStatsByRange(startDate: string, endDate: string): Promise<DashboardStats> {
    return await invoke("get_dashboard_stats_by_range", { startDate, endDate });
}

export async function getDashboardTransactionsByRange(startDate: string, endDate: string): Promise<any[]> {
    return await invoke("get_dashboard_transactions_by_range", { startDate, endDate });
}
