use crate::db;
use crate::db::models::{RevenueData, RevenueBreakdown, DashboardStats};
use rusqlite::{params, Result, Connection};
use chrono::{Utc, Duration, NaiveDate};

/// Helper to calculate Cost of Goods Sold for a given period
fn calculate_cogs(conn: &Connection, start_iso: &str, end_iso: &str) -> f64 {
    // 1. COGS from Repairs (linked via repair_used_parts to inventory_items)
    // We use created_at to match repairs ADDED in this period
    let repair_cogs: f64 = conn.query_row(
        "SELECT COALESCE(SUM(p.quantity * i.buying_price), 0)
         FROM repair_used_parts p
         JOIN repairs r ON p.repair_id = r.id
         JOIN inventory_items i ON p.part_id = i.id
         WHERE REPLACE(r.created_at, ' ', 'T') >= ?1 AND REPLACE(r.created_at, ' ', 'T') <= ?2 AND r.status != 'Cancelled'",
        params![start_iso, end_iso],
        |row| row.get(0)
    ).unwrap_or(0.0);

    // 2. COGS from Sales (linked via sale_items to inventory_items)
    let sale_cogs: f64 = conn.query_row(
        "SELECT COALESCE(SUM(si.quantity * i.buying_price), 0)
         FROM sale_items si
         JOIN customer_sales s ON si.sale_id = s.id
         JOIN inventory_items i ON si.item_id = i.id
         WHERE REPLACE(s.created_at, ' ', 'T') >= ?1 AND REPLACE(s.created_at, ' ', 'T') <= ?2 AND s.status = 'completed'",
        params![start_iso, end_iso],
        |row| row.get(0)
    ).unwrap_or(0.0);

    // 3. COGS from Unified Transactions (linked via transaction_items to inventory_items)
    let tx_cogs: f64 = conn.query_row(
        "SELECT COALESCE(SUM(ti.quantity * i.buying_price), 0)
         FROM transaction_items ti
         JOIN transactions t ON ti.transaction_id = t.id
         JOIN inventory_items i ON ti.item_id = i.id
         WHERE REPLACE(t.created_at, ' ', 'T') >= ?1 AND REPLACE(t.created_at, ' ', 'T') <= ?2 AND t.status = 'Completed' AND t.transaction_type = 'Sale'",
        params![start_iso, end_iso],
        |row| row.get(0)
    ).unwrap_or(0.0);

    repair_cogs + sale_cogs + tx_cogs
}

#[tauri::command]
pub fn get_revenue_history_by_range(start_date: String, end_date: String) -> Result<Vec<RevenueData>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    // Parse start and end dates (assuming YYYY-MM-DD)
    // If they have time, we strip it or handle it.
    // The frontend should send YYYY-MM-DD for this purpose usually.
    // If we receive ISO strings like 2023-01-01T00:00:00Z, we need to parse them.
    
    let start = NaiveDate::parse_from_str(&start_date.split('T').next().unwrap_or(&start_date), "%Y-%m-%d")
        .map_err(|e| format!("Invalid start date: {}", e))?;
    let end = NaiveDate::parse_from_str(&end_date.split('T').next().unwrap_or(&end_date), "%Y-%m-%d")
        .map_err(|e| format!("Invalid end date: {}", e))?;

    let mut history = Vec::new();
    let mut current = start;

    while current <= end {
        let date_str = current.format("%Y-%m-%d").to_string();
        
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

        // Calculate real COGS for this day to get accurate profit
        let day_start = format!("{}T00:00:00", date_str);
        let day_end = format!("{}T23:59:59.999", date_str);
        
        // Use accrual revenue for the chart profit (Total Sale Value of everything COMPLETED this day)
        let day_accrual_rev: f64 = conn.query_row(
            "SELECT 
                (SELECT COALESCE(SUM(total_amount), 0) FROM customer_sales WHERE created_at LIKE ?1 AND status = 'completed') +
                (SELECT COALESCE(SUM(total_amount), 0) FROM transactions WHERE created_at LIKE ?1 AND status = 'Completed' AND transaction_type = 'Sale') +
                (SELECT COALESCE(SUM(estimated_cost), 0) FROM repairs WHERE updated_at LIKE ?1 AND status IN ('Completed', 'Delivered'))",
            params![format!("{}%", date_str)],
            |row| row.get(0)
        ).unwrap_or(0.0);

        let cogs = calculate_cogs(&conn, &day_start, &day_end);
        let profit = day_accrual_rev - cogs; 

        history.push(RevenueData {
            date: current.format("%b %d").to_string(),
            revenue: total_revenue, // Chart continues to show Cash Revenue (Collections)
            profit,
        });

        current = current.succ_opt().ok_or("Date calculation error")?;
    }

    Ok(history)
}

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

        // Use accrual revenue for the chart profit
        let day_accrual_rev: f64 = conn.query_row(
            "SELECT 
                (SELECT COALESCE(SUM(total_amount), 0) FROM customer_sales WHERE created_at LIKE ?1 AND status = 'completed') +
                (SELECT COALESCE(SUM(total_amount), 0) FROM transactions WHERE created_at LIKE ?1 AND status = 'Completed' AND transaction_type = 'Sale') +
                (SELECT COALESCE(SUM(estimated_cost), 0) FROM repairs WHERE updated_at LIKE ?1 AND status IN ('Completed', 'Delivered'))",
            params![format!("{}%", date_str)],
            |row| row.get(0)
        ).unwrap_or(0.0);

        let day_start = format!("{}T00:00:00", date_str);
        let day_end = format!("{}T23:59:59.999", date_str);
        let cogs = calculate_cogs(&conn, &day_start, &day_end);
        let profit = day_accrual_rev - cogs; 

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
         WHERE t.transaction_type = 'Sale' AND REPLACE(p.date, ' ', 'T') >= ?1",
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

    // Calculate Accrual Profit for this month
    let start_of_month = format!("{}-01T00:00:00", this_month);
    let end_of_month = format!("{}-31T23:59:59", this_month); 

    let repair_revenue: f64 = conn.query_row(
        "SELECT COALESCE(SUM(estimated_cost), 0) FROM repairs WHERE created_at LIKE ?1 AND status != 'Cancelled'",
        params![format!("{}%", this_month)],
        |row| row.get(0)
    ).unwrap_or(0.0);

    let accrual_revenue: f64 = conn.query_row(
        "SELECT 
            (SELECT COALESCE(SUM(total_amount), 0) FROM customer_sales WHERE created_at LIKE ?1 AND status = 'completed') +
            (SELECT COALESCE(SUM(total_amount), 0) FROM transactions WHERE created_at LIKE ?1 AND status = 'Completed' AND transaction_type = 'Sale') +
            ?2",
        params![format!("{}%", this_month), repair_revenue],
        |row| row.get(0)
    ).unwrap_or(0.0);

    let cogs = calculate_cogs(&conn, &start_of_month, &end_of_month);
    
    // Calculate REPAIR specifically
    // Note: calculate_cogs already filters by created_at in my updated version
    let repair_cogs_only: f64 = conn.query_row(
        "SELECT COALESCE(SUM(p.quantity * i.buying_price), 0)
         FROM repair_used_parts p
         JOIN repairs r ON p.repair_id = r.id
         JOIN inventory_items i ON p.part_id = i.id
         WHERE r.created_at LIKE ?1 AND r.status != 'Cancelled'",
        params![format!("{}%", this_month)],
        |row| row.get(0)
    ).unwrap_or(0.0);
    let repair_profit = repair_revenue - repair_cogs_only;

    let expenses: f64 = conn.query_row(
        "SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE date LIKE ?1",
        params![format!("{}%", this_month)],
        |row| row.get(0)
    ).unwrap_or(0.0);
    let net_profit = accrual_revenue - cogs - expenses;

    // Net Cash (Flow for the month)
    let supplier_payments: f64 = conn.query_row(
        "SELECT COALESCE(SUM(amount), 0) FROM supplier_payments WHERE date LIKE ?1",
        params![format!("{}%", this_month)],
        |row| row.get(0)
    ).unwrap_or(0.0);

    let other_debits: f64 = conn.query_row(
        "SELECT COALESCE(SUM(p.amount), 0) FROM transaction_payments p JOIN transactions t ON p.transaction_id = t.id WHERE t.transaction_type != 'Sale' AND p.date LIKE ?1",
        params![format!("{}%", this_month)],
        |row| row.get(0)
    ).unwrap_or(0.0);

    let net_cash = total_revenue - expenses - supplier_payments - other_debits;

    Ok(DashboardStats {
        total_revenue,
        net_cash,
        net_profit,
        active_repairs,
        completed_repairs,
        stock_alerts: low_stock + out_of_stock,
        out_of_stock,
        revenue_change,
        repair_profit,
    })
}

#[tauri::command]
pub fn get_dashboard_transactions_by_range(start_date: String, end_date: String) -> Result<Vec<crate::db::models::DashboardTransaction>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    // Ensure accurate range
    // For Start Date: Use the raw "YYYY-MM-DD" string.
    // This works as a lower bound for both "YYYY-MM-DD HH:MM:SS" (Space separator) 
    // and "YYYY-MM-DDTHH:MM:SS" (T separator) because the short string is a prefix 
    // and thus lexicographically smaller than any string starting with it + more chars.
    // Previously appending "T00:00:00" caused "YYYY-MM-DD ..." (space) to be filtered out because ' ' < 'T'.
    
    let start_iso = start_date;

    let end_iso = if end_date.len() == 10 {
        format!("{}T23:59:59.999", end_date)
    } else {
        end_date
    };
    
    let mut all_tx = Vec::new();

    // 1. Sale Payments
    let mut stmt = conn.prepare("
        SELECT p.id, p.amount, p.date, p.method, s.sale_number 
        FROM sale_payments p 
        JOIN customer_sales s ON p.sale_id = s.id 
        WHERE REPLACE(p.date, ' ', 'T') >= ?1 AND REPLACE(p.date, ' ', 'T') <= ?2
    ").map_err(|e| e.to_string())?;
    
    let mut rows = stmt.query(params![start_iso, end_iso]).map_err(|e| e.to_string())?;
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        all_tx.push(crate::db::models::DashboardTransaction {
            id: row.get(0).unwrap_or_default(),
            tx_type: "credit".to_string(),
            category: "Sale Payment".to_string(),
            amount: row.get(1).unwrap_or(0.0),
            description: format!("Sale payment for {}", row.get::<_, String>(4).unwrap_or_default()),
            time: row.get(2).unwrap_or_default(),
            status: "completed".to_string(),
        });
    }

    // 2. Repair Payments
    let mut stmt = conn.prepare("
        SELECT p.id, p.amount, p.date, p.method, r.customer_name 
        FROM repair_payments p 
        JOIN repairs r ON p.repair_id = r.id 
        WHERE REPLACE(p.date, ' ', 'T') >= ?1 AND REPLACE(p.date, ' ', 'T') <= ?2
    ").map_err(|e| e.to_string())?;
    
    let mut rows = stmt.query(params![start_iso, end_iso]).map_err(|e| e.to_string())?;
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        all_tx.push(crate::db::models::DashboardTransaction {
            id: row.get(0).unwrap_or_default(),
            tx_type: "credit".to_string(),
            category: "Repair Payment".to_string(),
            amount: row.get(1).unwrap_or(0.0),
            description: format!("Repair payment from {}", row.get::<_, String>(4).unwrap_or_default()),
            time: row.get(2).unwrap_or_default(),
            status: "completed".to_string(),
        });
    }

    // 3. Client Payments
    let mut stmt = conn.prepare("
        SELECT p.id, p.amount, p.date, p.method, c.name 
        FROM client_payments p 
        JOIN clients c ON p.client_id = c.id 
        WHERE REPLACE(p.date, ' ', 'T') >= ?1 AND REPLACE(p.date, ' ', 'T') <= ?2
    ").map_err(|e| e.to_string())?;
    
    let mut rows = stmt.query(params![start_iso, end_iso]).map_err(|e| e.to_string())?;
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        all_tx.push(crate::db::models::DashboardTransaction {
            id: row.get(0).unwrap_or_default(),
            tx_type: "credit".to_string(),
            category: "Client Payment".to_string(),
            amount: row.get(1).unwrap_or(0.0),
            description: format!("Direct payment from {}", row.get::<_, String>(4).unwrap_or_default()),
            time: row.get(2).unwrap_or_default(),
            status: "completed".to_string(),
        });
    }

    // 4. Expenses
    let mut stmt = conn.prepare("
        SELECT id, amount, date, reason, category 
        FROM expenses 
        WHERE REPLACE(date, ' ', 'T') >= ?1 AND REPLACE(date, ' ', 'T') <= ?2
    ").map_err(|e| e.to_string())?;
    
    let mut rows = stmt.query(params![start_iso, end_iso]).map_err(|e| e.to_string())?;
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        all_tx.push(crate::db::models::DashboardTransaction {
            id: row.get(0).unwrap_or_default(),
            tx_type: "debit".to_string(),
            category: "Expense".to_string(),
            amount: row.get(1).unwrap_or(0.0),
            description: row.get(3).unwrap_or_default(),
            time: row.get(2).unwrap_or_default(),
            status: "completed".to_string(),
        });
    }

    // 5. Supplier Payments
    let mut stmt = conn.prepare("
        SELECT p.id, p.amount, p.date, p.method, s.name 
        FROM supplier_payments p 
        JOIN suppliers s ON p.supplier_id = s.id 
        WHERE REPLACE(p.date, ' ', 'T') >= ?1 AND REPLACE(p.date, ' ', 'T') <= ?2
    ").map_err(|e| e.to_string())?;
    
    let mut rows = stmt.query(params![start_iso, end_iso]).map_err(|e| e.to_string())?;
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        all_tx.push(crate::db::models::DashboardTransaction {
            id: row.get(0).unwrap_or_default(),
            tx_type: "debit".to_string(),
            category: "Supplier Payment".to_string(),
            amount: row.get(1).unwrap_or(0.0),
            description: format!("Payment to {}", row.get::<_, String>(4).unwrap_or_default()),
            time: row.get(2).unwrap_or_default(),
            status: "completed".to_string(),
        });
    }

    // 6. Generic Transaction Payments
    let mut stmt = conn.prepare("
        SELECT p.id, p.amount, p.date, p.method, t.transaction_number, t.transaction_type 
        FROM transaction_payments p 
        JOIN transactions t ON p.transaction_id = t.id 
        WHERE REPLACE(p.date, ' ', 'T') >= ?1 AND REPLACE(p.date, ' ', 'T') <= ?2
    ").map_err(|e| e.to_string())?;
    
    let mut rows = stmt.query(params![start_iso, end_iso]).map_err(|e| e.to_string())?;
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let tx_type_label: String = row.get(5).unwrap_or_default();
        let direction = if tx_type_label == "Sale" { "credit" } else { "debit" };
        all_tx.push(crate::db::models::DashboardTransaction {
            id: row.get(0).unwrap_or_default(),
            tx_type: direction.to_string(),
            category: format!("{} Payment", tx_type_label),
            amount: row.get(1).unwrap_or(0.0),
            description: format!("Payment for {} {}", tx_type_label, row.get::<_, String>(4).unwrap_or_default()),
            time: row.get(2).unwrap_or_default(),
            status: "completed".to_string(),
        });
    }

    // Sort by time descending
    all_tx.sort_by(|a, b| b.time.cmp(&a.time));

    Ok(all_tx)
}

#[tauri::command]
pub fn get_dashboard_stats_by_range(start_date: String, end_date: String) -> Result<DashboardStats, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    // Ensure accurate range
    // For Start Date: Use the raw "YYYY-MM-DD" string.
    let start_iso = start_date;

    let end_iso = if end_date.len() == 10 {
        format!("{}T23:59:59.999", end_date)
    } else {
        end_date
    };

    // Accrual Revenue for profit calculation (Total value of sales made)
    let repair_revenue: f64 = conn.query_row(
        "SELECT COALESCE(SUM(estimated_cost), 0) FROM repairs WHERE REPLACE(created_at, ' ', 'T') >= ?1 AND REPLACE(created_at, ' ', 'T') <= ?2 AND status != 'Cancelled'",
        params![start_iso, end_iso],
        |row| row.get(0)
    ).unwrap_or(0.0);

    let accrual_revenue: f64 = conn.query_row(
        "SELECT 
            (SELECT COALESCE(SUM(total_amount), 0) FROM customer_sales WHERE REPLACE(created_at, ' ', 'T') >= ?1 AND REPLACE(created_at, ' ', 'T') <= ?2 AND status = 'completed') +
            (SELECT COALESCE(SUM(total_amount), 0) FROM transactions WHERE REPLACE(created_at, ' ', 'T') >= ?1 AND REPLACE(created_at, ' ', 'T') <= ?2 AND status = 'Completed' AND transaction_type = 'Sale') +
            ?3",
        params![start_iso, end_iso, repair_revenue],
        |row| row.get(0)
    ).unwrap_or(0.0);

    // Total Revenue (Cash-based for liquidity check)
    let total_revenue: f64 = conn.query_row(
        "SELECT 
            (SELECT COALESCE(SUM(amount), 0) FROM sale_payments WHERE REPLACE(date, ' ', 'T') >= ?1 AND REPLACE(date, ' ', 'T') <= ?2) +
            (SELECT COALESCE(SUM(amount), 0) FROM repair_payments WHERE REPLACE(date, ' ', 'T') >= ?1 AND REPLACE(date, ' ', 'T') <= ?2) +
            (SELECT COALESCE(SUM(amount), 0) FROM client_payments WHERE REPLACE(date, ' ', 'T') >= ?1 AND REPLACE(date, ' ', 'T') <= ?2) +
            (SELECT COALESCE(SUM(p.amount), 0) FROM transaction_payments p JOIN transactions t ON p.transaction_id = t.id WHERE t.transaction_type = 'Sale' AND REPLACE(p.date, ' ', 'T') >= ?1 AND REPLACE(p.date, ' ', 'T') <= ?2)",
        params![start_iso, end_iso],
        |row| row.get(0)
    ).unwrap_or(0.0);

    // Active Repairs (Snapshot - doesn't really depend on range, but current state)
    let active_repairs: i32 = conn.query_row(
        "SELECT COUNT(*) FROM repairs WHERE status IN ('Pending', 'In Progress', 'Waiting for Parts')",
        [],
        |row| row.get(0)
    ).unwrap_or(0);

    let completed_repairs: i32 = conn.query_row(
        "SELECT COUNT(*) FROM repairs WHERE status IN ('Completed', 'Delivered') AND REPLACE(updated_at, ' ', 'T') >= ?1 AND REPLACE(updated_at, ' ', 'T') <= ?2",
        params![start_iso, end_iso],
        |row| row.get(0)
    ).unwrap_or(0);

    // Stock Alerts (Snapshot)
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

    // Revenue Change (Mocked for now)
    let revenue_change = 0.0; 

    // Net Cash for the period
    // In - Out
    // In = total_revenue (Payments collected)
    // Out = Expenses + Supplier Payments + Debit Transactions
    let expenses: f64 = conn.query_row(
        "SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE REPLACE(date, ' ', 'T') >= ?1 AND REPLACE(date, ' ', 'T') <= ?2",
        params![start_iso, end_iso],
        |row| row.get(0)
    ).unwrap_or(0.0);

    let supplier_payments: f64 = conn.query_row(
        "SELECT COALESCE(SUM(amount), 0) FROM supplier_payments WHERE REPLACE(date, ' ', 'T') >= ?1 AND REPLACE(date, ' ', 'T') <= ?2",
        params![start_iso, end_iso],
        |row| row.get(0)
    ).unwrap_or(0.0);

    let other_debits: f64 = conn.query_row(
        "SELECT COALESCE(SUM(p.amount), 0) FROM transaction_payments p JOIN transactions t ON p.transaction_id = t.id WHERE t.transaction_type != 'Sale' AND REPLACE(p.date, ' ', 'T') >= ?1 AND REPLACE(p.date, ' ', 'T') <= ?2",
        params![start_iso, end_iso],
        |row| row.get(0)
    ).unwrap_or(0.0);

    let total_out = expenses + supplier_payments + other_debits;
    let net_cash = total_revenue - total_out;

    // True Net Profit calculation for the range (Accrual basis)
    let cogs = calculate_cogs(&conn, &start_iso, &end_iso);
    
    // Repair profit specifically for the range
    let repair_cogs: f64 = conn.query_row(
        "SELECT COALESCE(SUM(p.quantity * i.buying_price), 0)
         FROM repair_used_parts p
         JOIN repairs r ON p.repair_id = r.id
         JOIN inventory_items i ON p.part_id = i.id
         WHERE REPLACE(r.created_at, ' ', 'T') >= ?1 AND REPLACE(r.created_at, ' ', 'T') <= ?2 AND r.status != 'Cancelled'",
        params![start_iso, end_iso],
        |row| row.get(0)
    ).unwrap_or(0.0);
    let repair_profit = repair_revenue - repair_cogs;

    let net_profit = accrual_revenue - cogs - expenses;

    Ok(DashboardStats {
        total_revenue,
        net_cash,
        net_profit,
        active_repairs,
        completed_repairs,
        stock_alerts: low_stock + out_of_stock,
        out_of_stock,
        revenue_change,
        repair_profit,
    })
}
