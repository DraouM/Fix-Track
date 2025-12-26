use crate::db;
use crate::db::models::DailySession;
use rusqlite::{params, Result};
use uuid::Uuid;
use chrono::Utc;

#[tauri::command]
pub fn start_session(opening_balance: f64, notes: Option<String>, created_by: Option<String>) -> Result<DailySession, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    // Check if there's already an open session
    let existing_open: Option<String> = conn.query_row(
        "SELECT id FROM daily_sessions WHERE status = 'open' LIMIT 1",
        [],
        |row| row.get(0)
    ).ok();

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

    let session = stmt.query_row([], |row| {
        Ok(DailySession {
            id: row.get(0)?,
            start_time: row.get(1)?,
            end_time: row.get(2).ok(),
            opening_balance: row.get(3)?,
            closing_balance: row.get(4).ok(),
            counted_amount: row.get(5).ok(),
            withdrawal_amount: row.get(6).ok(),
            status: row.get(7)?,
            notes: row.get(8).ok(),
            created_by: row.get(9).ok(),
        })
    }).ok();

    Ok(session)
}

#[tauri::command]
pub fn close_session(
    id: String, 
    counted_amount: f64, 
    withdrawal_amount: f64, 
    notes: Option<String>
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
    // Actually, we should probably have linked them at creation time if possible.
    // For now, let's just mark them if they are null.
    let _ = conn.execute("UPDATE sale_payments SET session_id = ?1 WHERE session_id IS NULL", params![id]);
    let _ = conn.execute("UPDATE repair_payments SET session_id = ?1 WHERE session_id IS NULL", params![id]);
    let _ = conn.execute("UPDATE order_payments SET session_id = ?1 WHERE session_id IS NULL", params![id]);
    let _ = conn.execute("UPDATE expenses SET session_id = ?1 WHERE session_id IS NULL", params![id]);

    Ok(())
}

#[tauri::command]
pub fn get_last_session_closing_balance() -> Result<f64, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    let balance: f64 = conn.query_row(
        "SELECT closing_balance FROM daily_sessions WHERE status = 'closed' ORDER BY end_time DESC LIMIT 1",
        [],
        |row| row.get(0)
    ).unwrap_or(0.0);
    
    Ok(balance)
}
