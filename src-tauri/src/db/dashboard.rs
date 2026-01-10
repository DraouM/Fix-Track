use crate::db;
use crate::db::models::{RevenueData, RevenueBreakdown, DashboardStats};
use rusqlite::{params, Result};
use chrono::{Utc, Duration};

#[tauri::command]
pub fn get_revenue_history(days: i32) -> Result<Vec<RevenueData>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    let mut history = Vec::new();
    let today = Utc::now();

    for i in (0..days).rev() {
        let date = today - Duration::days(i as i64);
        let date_str = date.format("%Y-%m-%d").to_string();
        
        // Revenue from Sales (recorded in sale_payments)
        let sale_revenue: f64 = conn.query_row(
            "SELECT COALESCE(SUM(amount), 0) FROM sale_payments WHERE date LIKE ?1",
            params![format!("{}%", date_str)],
            |row| row.get(0)
        ).unwrap_or(0.0);

        // Revenue from Repairs (recorded in repair_payments)
        let repair_revenue: f64 = conn.query_row(
            "SELECT COALESCE(SUM(amount), 0) FROM repair_payments WHERE date LIKE ?1",
            params![format!("{}%", date_str)],
            |row| row.get(0)
        ).unwrap_or(0.0);

        // Revenue from Transaction Payments (Sales type)
        let tx_revenue: f64 = conn.query_row(
            "SELECT COALESCE(SUM(p.amount), 0) 
             FROM transaction_payments p 
             JOIN transactions t ON p.transaction_id = t.id 
             WHERE t.transaction_type = 'Sale' AND p.date LIKE ?1",
            params![format!("{}%", date_str)],
            |row| row.get(0)
        ).unwrap_or(0.0);

        // Direct Client Payments
        let client_payments: f64 = conn.query_row(
            "SELECT COALESCE(SUM(amount), 0) FROM client_payments WHERE date LIKE ?1",
            params![format!("{}%", date_str)],
            |row| row.get(0)
        ).unwrap_or(0.0);

        let total_revenue = sale_revenue + repair_revenue + tx_revenue + client_payments;

        // Simplified profit calculation: 30% of revenue as placeholder if real COGS not available
        // In a real app, we'd subtract item costs from sale_items and repair used_parts
        let profit = total_revenue * 0.3; 

        history.push(RevenueData {
            date: date.format("%b %d").to_string(),
            revenue: total_revenue,
            profit,
        });
    }

    Ok(history)
}

#[tauri::command]
pub fn get_revenue_breakdown(days: i32) -> Result<Vec<RevenueBreakdown>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    let start_date = (Utc::now() - Duration::days(days as i64)).to_rfc3339();

    let sale_rev: f64 = conn.query_row(
        "SELECT COALESCE(SUM(amount), 0) FROM sale_payments WHERE date >= ?1",
        params![start_date],
        |row| row.get(0)
    ).unwrap_or(0.0);

    let repair_rev: f64 = conn.query_row(
        "SELECT COALESCE(SUM(amount), 0) FROM repair_payments WHERE date >= ?1",
        params![start_date],
        |row| row.get(0)
    ).unwrap_or(0.0);

    let other_rev: f64 = conn.query_row(
        "SELECT COALESCE(SUM(amount), 0) FROM transaction_payments p 
         JOIN transactions t ON p.transaction_id = t.id 
         WHERE t.transaction_type = 'Sale' AND p.date >= ?1",
        params![start_date],
        |row| row.get(0)
    ).unwrap_or(0.0);

    Ok(vec![
        RevenueBreakdown { category: "Sales".to_string(), amount: sale_rev },
        RevenueBreakdown { category: "Repairs".to_string(), amount: repair_rev },
        RevenueBreakdown { category: "Other".to_string(), amount: other_rev },
    ])
}

#[tauri::command]
pub fn get_dashboard_stats() -> Result<DashboardStats, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    // Total Revenue (All time or current month? Let's do current month)
    let this_month = Utc::now().format("%Y-%m").to_string();
    let total_revenue: f64 = conn.query_row(
        "SELECT 
            (SELECT COALESCE(SUM(amount), 0) FROM sale_payments WHERE date LIKE ?1) +
            (SELECT COALESCE(SUM(amount), 0) FROM repair_payments WHERE date LIKE ?1) +
            (SELECT COALESCE(SUM(amount), 0) FROM client_payments WHERE date LIKE ?1) +
            (SELECT COALESCE(SUM(p.amount), 0) FROM transaction_payments p JOIN transactions t ON p.transaction_id = t.id WHERE t.transaction_type = 'Sale' AND p.date LIKE ?1)",
        params![format!("{}%", this_month)],
        |row| row.get(0)
    ).unwrap_or(0.0);

    // Active Repairs
    let active_repairs: i32 = conn.query_row(
        "SELECT COUNT(*) FROM repairs WHERE status IN ('Pending', 'In Progress', 'Waiting for Parts')",
        [],
        |row| row.get(0)
    ).unwrap_or(0);

    let completed_repairs: i32 = conn.query_row(
        "SELECT COUNT(*) FROM repairs WHERE status IN ('Completed', 'Delivered')",
        [],
        |row| row.get(0)
    ).unwrap_or(0);

    // Stock Alerts
    let low_stock: i32 = conn.query_row(
        "SELECT COUNT(*) FROM inventory_items WHERE quantity_in_stock <= low_stock_threshold AND quantity_in_stock > 0",
        [],
        |row| row.get(0)
    ).unwrap_or(0);

    let out_of_stock: i32 = conn.query_row(
        "SELECT COUNT(*) FROM inventory_items WHERE quantity_in_stock <= 0",
        [],
        |row| row.get(0)
    ).unwrap_or(0);

    // Revenue Change (Mocked for now or calculate vs last month)
    let revenue_change = 12.5; // Placeholder for now

    // Net Cash (From current open session if available, else 0)
    let net_cash: f64 = conn.query_row(
        "SELECT COALESCE(SUM(CASE WHEN status = 'open' THEN opening_balance ELSE 0 END), 0) FROM daily_sessions WHERE status = 'open'",
        [],
        |row| row.get(0)
    ).unwrap_or(0.0);

    Ok(DashboardStats {
        total_revenue,
        net_cash,
        active_repairs,
        completed_repairs,
        stock_alerts: low_stock + out_of_stock,
        out_of_stock,
        revenue_change,
    })
}
