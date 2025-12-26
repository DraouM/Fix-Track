use crate::db;
use crate::db::models::Expense;
use rusqlite::{params, Result};
use uuid::Uuid;
use chrono::Utc;

#[tauri::command]
pub fn add_expense(mut expense: Expense) -> Result<Expense, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    if expense.id.is_empty() {
        expense.id = Uuid::new_v4().to_string();
    }
    if expense.date.is_empty() {
        expense.date = Utc::now().to_rfc3339();
    }

    conn.execute(
        "INSERT INTO expenses (id, amount, reason, date, session_id, category, created_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            expense.id,
            expense.amount,
            expense.reason,
            expense.date,
            expense.session_id,
            expense.category,
            expense.created_by,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(expense)
}

#[tauri::command]
pub fn get_today_expenses() -> Result<Vec<Expense>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    // Get expenses from the last 24 hours or linked to current open session
    // For simplicity, let's get expenses for today's date
    let today = Utc::now().format("%Y-%m-%d").to_string();
    
    let mut stmt = conn
        .prepare("SELECT id, amount, reason, date, session_id, category, created_by FROM expenses WHERE date LIKE ?1 ORDER BY date DESC")
        .map_err(|e| e.to_string())?;

    let expenses = stmt
        .query_map(params![format!("{}%", today)], |row| {
            Ok(Expense {
                id: row.get(0)?,
                amount: row.get(1)?,
                reason: row.get(2)?,
                date: row.get(3)?,
                session_id: row.get(4).ok(),
                category: row.get(5).ok(),
                created_by: row.get(6).ok(),
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();

    Ok(expenses)
}

#[tauri::command]
pub fn get_expenses_by_session(session_id: String) -> Result<Vec<Expense>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    let mut stmt = conn
        .prepare("SELECT id, amount, reason, date, session_id, category, created_by FROM expenses WHERE session_id = ?1 ORDER BY date DESC")
        .map_err(|e| e.to_string())?;

    let expenses = stmt
        .query_map(params![session_id], |row| {
            Ok(Expense {
                id: row.get(0)?,
                amount: row.get(1)?,
                reason: row.get(2)?,
                date: row.get(3)?,
                session_id: row.get(4).ok(),
                category: row.get(5).ok(),
                created_by: row.get(6).ok(),
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();

    Ok(expenses)
}
