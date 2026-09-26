use crate::db;
use crate::db::models::MoneyTransfer;
use rusqlite::{params, Result};
use uuid::Uuid;
use chrono::Utc;

/// Create a new money transfer record.
#[tauri::command]
pub fn add_money_transfer(mut transfer: MoneyTransfer) -> Result<MoneyTransfer, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    if transfer.id.is_empty() {
        transfer.id = Uuid::new_v4().to_string();
    }
    if transfer.date.is_empty() {
        transfer.date = Utc::now().to_rfc3339();
    }

    conn.execute(
        "INSERT INTO money_transfers (id, from_account, to_account, amount, date, method, notes, created_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            transfer.id,
            transfer.from_account,
            transfer.to_account,
            transfer.amount,
            transfer.date,
            transfer.method,
            transfer.notes,
            transfer.created_by,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(transfer)
}

/// Fetch all money transfers, newest first.
#[tauri::command]
pub fn get_all_transfers() -> Result<Vec<MoneyTransfer>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, from_account, to_account, amount, date, method, notes, created_by
             FROM money_transfers
             ORDER BY date DESC",
        )
        .map_err(|e| e.to_string())?;

    let transfers = stmt
        .query_map([], |row| {
            Ok(MoneyTransfer {
                id: row.get(0)?,
                from_account: row.get(1)?,
                to_account: row.get(2)?,
                amount: row.get(3)?,
                date: row.get(4)?,
                method: row.get(5).ok(),
                notes: row.get(6).ok(),
                created_by: row.get(7).ok(),
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(transfers)
}

/// Update amount, method and notes of an existing transfer.
#[tauri::command]
pub fn update_money_transfer(
    id: String,
    amount: f64,
    from_account: String,
    to_account: String,
    method: Option<String>,
    notes: Option<String>,
) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE money_transfers
         SET amount = ?2, from_account = ?3, to_account = ?4, method = ?5, notes = ?6
         WHERE id = ?1",
        params![id, amount, from_account, to_account, method, notes],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Delete a transfer record permanently.
#[tauri::command]
pub fn delete_money_transfer(id: String) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "DELETE FROM money_transfers WHERE id = ?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
