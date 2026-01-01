use crate::db;
use crate::db::models::{DailySession, DashboardTransaction};
use chrono::Utc;
use rusqlite::{params, OptionalExtension, Result};
use uuid::Uuid;

#[tauri::command]
pub fn start_session(
    opening_balance: f64,
    notes: Option<String>,
    created_by: Option<String>,
) -> Result<DailySession, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    // Check if there's already an open session
    let existing_open: Option<String> = conn
        .query_row(
            "SELECT id FROM daily_sessions WHERE status = 'open' LIMIT 1",
            [],
            |row| row.get(0),
        )
        .ok();

    if existing_open.is_some() {
        return Err("A session is already open. Close it before starting a new one.".to_string());
    }

    let session = DailySession {
        id: Uuid::new_v4().to_string(),
        start_time: Utc::now().to_rfc3339(),
        end_time: None,
        opening_balance,
        closing_balance: None,
        counted_amount: None,
        withdrawal_amount: None,
        status: "open".to_string(),
        notes,
        created_by,
    };

    conn.execute(
        "INSERT INTO daily_sessions (id, start_time, opening_balance, status, notes, created_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            session.id,
            session.start_time,
            session.opening_balance,
            session.status,
            session.notes,
            session.created_by,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(session)
}

#[tauri::command]
pub fn get_current_session() -> Result<Option<DailySession>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, start_time, end_time, opening_balance, closing_balance, counted_amount, withdrawal_amount, status, notes, created_by FROM daily_sessions WHERE status = 'open' LIMIT 1")
        .map_err(|e| e.to_string())?;

    let session = stmt
        .query_row([], |row| {
            Ok(DailySession {
                id: row.get(0)?,
                start_time: row.get(1)?,
                end_time: row.get::<_, Option<String>>(2)?,
                opening_balance: row.get(3)?,
                closing_balance: row.get::<_, Option<f64>>(4)?,
                counted_amount: row.get::<_, Option<f64>>(5)?,
                withdrawal_amount: row.get::<_, Option<f64>>(6)?,
                status: row.get(7)?,
                notes: row.get::<_, Option<String>>(8)?,
                created_by: row.get::<_, Option<String>>(9)?,
            })
        })
        .ok();

    Ok(session)
}

#[tauri::command]
pub fn close_session(
    id: String,
    counted_amount: f64,
    withdrawal_amount: f64,
    notes: Option<String>,
) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    let end_time = Utc::now().to_rfc3339();

    // Calculate closing balance (carry forward)
    // Actually, according to user flow: Carry Forward = Counted - Withdrawal
    let closing_balance = counted_amount - withdrawal_amount;

    conn.execute(
        "UPDATE daily_sessions SET 
            end_time = ?2, 
            status = 'closed', 
            counted_amount = ?3, 
            withdrawal_amount = ?4, 
            closing_balance = ?5,
            notes = COALESCE(?6, notes)
         WHERE id = ?1 AND status = 'open'",
        params![
            id,
            end_time,
            counted_amount,
            withdrawal_amount,
            closing_balance,
            notes,
        ],
    )
    .map_err(|e| e.to_string())?;

    // Link all payments and expenses without a session_id to this session (if they happened during it)
    let _ = conn.execute(
        "UPDATE sale_payments SET session_id = ?1 WHERE session_id IS NULL",
        params![id],
    );
    let _ = conn.execute(
        "UPDATE repair_payments SET session_id = ?1 WHERE session_id IS NULL",
        params![id],
    );
    let _ = conn.execute(
        "UPDATE order_payments SET session_id = ?1 WHERE session_id IS NULL",
        params![id],
    );
    let _ = conn.execute(
        "UPDATE client_payments SET session_id = ?1 WHERE session_id IS NULL",
        params![id],
    );
    let _ = conn.execute(
        "UPDATE supplier_payments SET session_id = ?1 WHERE session_id IS NULL",
        params![id],
    );
    let _ = conn.execute(
        "UPDATE transaction_payments SET session_id = ?1 WHERE session_id IS NULL",
        params![id],
    );
    let _ = conn.execute(
        "UPDATE expenses SET session_id = ?1 WHERE session_id IS NULL",
        params![id],
    );

    Ok(())
}

#[tauri::command]
pub fn get_current_session_transactions() -> Result<Vec<DashboardTransaction>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    // Get current open session ID
    let session_id_result: Result<Option<String>, rusqlite::Error> = conn
        .query_row(
            "SELECT id FROM daily_sessions WHERE status = 'open' LIMIT 1",
            [],
            |row| row.get::<_, String>(0),
        )
        .optional();

    let session_id = match session_id_result.map_err(|e| e.to_string())? {
        Some(id) => id,
        None => return Ok(Vec::new()), // No open session
    };

    let mut all_tx = Vec::new();

    // 1. Sale Payments
    let mut stmt = conn.prepare("SELECT p.id, p.amount, p.date, p.method, s.sale_number FROM sale_payments p JOIN customer_sales s ON p.sale_id = s.id WHERE p.session_id = ?1").map_err(|e| e.to_string())?;
    let mut rows = stmt.query(params![session_id]).map_err(|e| e.to_string())?;
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        all_tx.push(DashboardTransaction {
            id: row.get(0).map_err(|e: rusqlite::Error| e.to_string())?,
            tx_type: "credit".to_string(),
            category: "Sale Payment".to_string(),
            amount: row.get(1).map_err(|e: rusqlite::Error| e.to_string())?,
            description: format!(
                "Sale payment for {}",
                row.get::<_, String>(4)
                    .map_err(|e: rusqlite::Error| e.to_string())?
            ),
            time: row.get(2).map_err(|e: rusqlite::Error| e.to_string())?,
            status: "completed".to_string(),
        });
    }

    // 2. Repair Payments
    let mut stmt = conn.prepare("SELECT p.id, p.amount, p.date, p.method, r.customer_name FROM repair_payments p JOIN repairs r ON p.repair_id = r.id WHERE p.session_id = ?1").map_err(|e| e.to_string())?;
    let mut rows = stmt.query(params![session_id]).map_err(|e| e.to_string())?;
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        all_tx.push(DashboardTransaction {
            id: row.get(0).map_err(|e: rusqlite::Error| e.to_string())?,
            tx_type: "credit".to_string(),
            category: "Repair Payment".to_string(),
            amount: row.get(1).map_err(|e: rusqlite::Error| e.to_string())?,
            description: format!(
                "Repair payment from {}",
                row.get::<_, String>(4)
                    .map_err(|e: rusqlite::Error| e.to_string())?
            ),
            time: row.get(2).map_err(|e: rusqlite::Error| e.to_string())?,
            status: "completed".to_string(),
        });
    }

    // 3. Client Payments (Direct)
    let mut stmt = conn.prepare("SELECT p.id, p.amount, p.date, p.method, c.name FROM client_payments p JOIN clients c ON p.client_id = c.id WHERE p.session_id = ?1").map_err(|e| e.to_string())?;
    let mut rows = stmt.query(params![session_id]).map_err(|e| e.to_string())?;
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        all_tx.push(DashboardTransaction {
            id: row.get(0).map_err(|e: rusqlite::Error| e.to_string())?,
            tx_type: "credit".to_string(),
            category: "Client payment".to_string(),
            amount: row.get(1).map_err(|e: rusqlite::Error| e.to_string())?,
            description: format!(
                "Direct payment from {}",
                row.get::<_, String>(4)
                    .map_err(|e: rusqlite::Error| e.to_string())?
            ),
            time: row.get(2).map_err(|e: rusqlite::Error| e.to_string())?,
            status: "completed".to_string(),
        });
    }

    // 4. Expenses
    let mut stmt = conn
        .prepare("SELECT id, amount, date, reason, category FROM expenses WHERE session_id = ?1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query(params![session_id]).map_err(|e| e.to_string())?;
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        all_tx.push(DashboardTransaction {
            id: row.get(0).map_err(|e: rusqlite::Error| e.to_string())?,
            tx_type: "debit".to_string(),
            category: "Expense".to_string(),
            amount: row.get(1).map_err(|e: rusqlite::Error| e.to_string())?,
            description: row.get(3).map_err(|e: rusqlite::Error| e.to_string())?,
            time: row.get(2).map_err(|e: rusqlite::Error| e.to_string())?,
            status: "completed".to_string(),
        });
    }

    // 5. Supplier Payments
    let mut stmt = conn.prepare("SELECT p.id, p.amount, p.date, p.method, s.name FROM supplier_payments p JOIN suppliers s ON p.supplier_id = s.id WHERE p.session_id = ?1").map_err(|e| e.to_string())?;
    let mut rows = stmt.query(params![session_id]).map_err(|e| e.to_string())?;
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        all_tx.push(DashboardTransaction {
            id: row.get(0).map_err(|e: rusqlite::Error| e.to_string())?,
            tx_type: "debit".to_string(),
            category: "Supplier payment".to_string(),
            amount: row.get(1).map_err(|e: rusqlite::Error| e.to_string())?,
            description: format!(
                "Payment to {}",
                row.get::<_, String>(4)
                    .map_err(|e: rusqlite::Error| e.to_string())?
            ),
            time: row.get(2).map_err(|e: rusqlite::Error| e.to_string())?,
            status: "completed".to_string(),
        });
    }

    // 6. Generic Transaction Payments
    let mut stmt = conn.prepare("SELECT p.id, p.amount, p.date, p.method, t.transaction_number, t.transaction_type FROM transaction_payments p JOIN transactions t ON p.transaction_id = t.id WHERE p.session_id = ?1").map_err(|e| e.to_string())?;
    let mut rows = stmt.query(params![session_id]).map_err(|e| e.to_string())?;
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let tx_type_label: String = row.get(5).map_err(|e: rusqlite::Error| e.to_string())?;
        let direction = if tx_type_label == "Sale" {
            "credit"
        } else {
            "debit"
        };
        all_tx.push(DashboardTransaction {
            id: row.get(0).map_err(|e: rusqlite::Error| e.to_string())?,
            tx_type: direction.to_string(),
            category: format!("{} payment", tx_type_label),
            amount: row.get(1).map_err(|e: rusqlite::Error| e.to_string())?,
            description: format!(
                "Payment for {} {}",
                tx_type_label,
                row.get::<_, String>(4)
                    .map_err(|e: rusqlite::Error| e.to_string())?
            ),
            time: row.get(2).map_err(|e: rusqlite::Error| e.to_string())?,
            status: "completed".to_string(),
        });
    }

    // Sort by time descending
    all_tx.sort_by(|a, b| b.time.cmp(&a.time));

    Ok(all_tx)
}

#[tauri::command]
pub fn get_last_session_closing_balance() -> Result<f64, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    let balance: f64 = match conn.query_row(
        "SELECT closing_balance FROM daily_sessions WHERE status = 'closed' ORDER BY end_time DESC LIMIT 1",
        [],
        |row| row.get::<_, Option<f64>>(0)
    ) {
        Ok(closing_balance) => closing_balance.unwrap_or(0.0),
        Err(_) => 0.0,
    };

    Ok(balance)
}
