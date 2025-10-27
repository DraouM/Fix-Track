use crate::db::inventory::InventoryHistoryEvent as SupplierHistoryEvent;
use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Supplier {
    pub id: String,
    pub name: String,
    pub contact_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
    pub preferred_payment_method: Option<String>,
    pub credit_balance: Option<f64>,
    pub active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[tauri::command]
pub fn get_suppliers() -> Result<Vec<Supplier>, String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, contact_name, email, phone, address, notes, preferred_payment_method, credit_balance, active, created_at, updated_at FROM suppliers")
        .map_err(|e| e.to_string())?;
    let suppliers = stmt
        .query_map([], |row| {
            Ok(Supplier {
                id: row.get(0)?,
                name: row.get(1)?,
                contact_name: row.get(2).ok(),
                email: row.get(3).ok(),
                phone: row.get(4).ok(),
                address: row.get(5).ok(),
                notes: row.get(6).ok(),
                preferred_payment_method: row.get(7).ok(),
                credit_balance: row.get(8).ok(),
                active: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();
    Ok(suppliers)
}

#[tauri::command]
pub fn get_supplier_by_id(supplier_id: String) -> Result<Option<Supplier>, String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, contact_name, email, phone, address, notes, preferred_payment_method, credit_balance, active, created_at, updated_at FROM suppliers WHERE id = ?1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt
        .query(params![supplier_id])
        .map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        Ok(Some(Supplier {
            id: row.get(0).map_err(|e| e.to_string())?,
            name: row.get(1).map_err(|e| e.to_string())?,
            contact_name: row.get(2).ok(),
            email: row.get(3).ok(),
            phone: row.get(4).ok(),
            address: row.get(5).ok(),
            notes: row.get(6).ok(),
            preferred_payment_method: row.get(7).ok(),
            credit_balance: row.get(8).ok(),
            active: row.get(9).map_err(|e| e.to_string())?,
            created_at: row.get(10).map_err(|e| e.to_string())?,
            updated_at: row.get(11).map_err(|e| e.to_string())?,
        }))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn insert_supplier(supplier: Supplier) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO suppliers (id, name, contact_name, email, phone, address, notes, preferred_payment_method, credit_balance, active, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![
            supplier.id,
            supplier.name,
            supplier.contact_name,
            supplier.email,
            supplier.phone,
            supplier.address,
            supplier.notes,
            supplier.preferred_payment_method,
            supplier.credit_balance,
            supplier.active,
            supplier.created_at,
            supplier.updated_at
        ],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_supplier(supplier: Supplier) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE suppliers SET name = ?2, contact_name = ?3, email = ?4, phone = ?5, address = ?6, notes = ?7, preferred_payment_method = ?8, credit_balance = ?9, active = ?10, created_at = ?11, updated_at = ?12 WHERE id = ?1",
        params![
            supplier.id,
            supplier.name,
            supplier.contact_name,
            supplier.email,
            supplier.phone,
            supplier.address,
            supplier.notes,
            supplier.preferred_payment_method,
            supplier.credit_balance,
            supplier.active,
            supplier.created_at,
            supplier.updated_at
        ],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_supplier(supplier_id: String) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM suppliers WHERE id = ?1", params![supplier_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn add_supplier_payment(
    supplier_id: String,
    amount: f64,
    method: String,
    notes: Option<String>,
) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO supplier_payments (supplier_id, amount, method, date, notes) VALUES (?1, ?2, ?3, datetime('now'), ?4)",
        params![supplier_id, amount, method, notes],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn adjust_supplier_credit(
    supplier_id: String,
    amount: f64,
    notes: Option<String>,
) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;

    // Get the current credit balance
    let mut stmt = conn
        .prepare("SELECT credit_balance FROM suppliers WHERE id = ?1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt
        .query(params![supplier_id])
        .map_err(|e| e.to_string())?;
    let current_credit_balance: f64 = if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        row.get(0).map_err(|e| e.to_string())?
    } else {
        return Err("Supplier not found".to_string());
    };

    // Calculate the new credit balance
    let new_credit_balance = current_credit_balance + amount;

    // Update the credit balance in the database
    conn.execute(
        "UPDATE suppliers SET credit_balance = ?1 WHERE id = ?2",
        params![new_credit_balance, supplier_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_supplier_history(supplier_id: String) -> Result<Vec<SupplierHistoryEvent>, String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, supplier_id, date, type, notes, amount, changed_by FROM supplier_history WHERE supplier_id = ?1 ORDER BY date DESC")
        .map_err(|e| e.to_string())?;
    let history = stmt
        .query_map(params![supplier_id], |row| {
            Ok(SupplierHistoryEvent {
                id: row.get(0)?,
                supplier_id: row.get(1)?,
                date: row.get(2)?,
                // type: row.get(3)?,
                notes: row.get(4).ok(),
                amount: row.get(5).ok(),
                changed_by: row.get(6).ok(),
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();
    Ok(history)
}
