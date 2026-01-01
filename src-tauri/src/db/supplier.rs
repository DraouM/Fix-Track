// use crate::db::inventory::InventoryHistoryEvent;
use rusqlite::{params, Result};
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

// Add a helper struct for the frontend Supplier interface mapping
#[derive(Debug, Serialize, Deserialize)]
pub struct SupplierFrontend {
    pub id: String,
    pub name: String,
    pub contact_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
    pub preferred_payment_method: Option<String>,
    pub outstanding_balance: f64, // Changed name and made non-optional to match frontend
    pub status: String, // Changed from boolean to string to match frontend ("active"/"inactive")
    pub created_at: String,
    pub updated_at: String,
}

#[tauri::command]
pub fn get_suppliers() -> Result<Vec<SupplierFrontend>, String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, contact_name, email, phone, address, notes, preferred_payment_method, credit_balance, active, created_at, updated_at FROM suppliers")
        .map_err(|e| e.to_string())?;
    let suppliers = stmt
        .query_map([], |row| {
            // We need to handle errors properly within the closure
            let active_result: Result<bool, rusqlite::Error> = row.get(9);
            let id_result: Result<String, rusqlite::Error> = row.get(0);
            let name_result: Result<String, rusqlite::Error> = row.get(1);
            let created_at_result: Result<String, rusqlite::Error> = row.get(10);
            let updated_at_result: Result<String, rusqlite::Error> = row.get(11);

            // Check if all required fields were retrieved successfully
            if let (Ok(active), Ok(id), Ok(name), Ok(created_at), Ok(updated_at)) = (
                active_result,
                id_result,
                name_result,
                created_at_result,
                updated_at_result,
            ) {
                Ok(SupplierFrontend {
                    id,
                    name,
                    contact_name: row.get(2).ok(),
                    email: row.get(3).ok(),
                    phone: row.get(4).ok(),
                    address: row.get(5).ok(),
                    notes: row.get(6).ok(),
                    preferred_payment_method: row.get(7).ok(),
                    outstanding_balance: row.get(8).unwrap_or(0.0), // Map credit_balance to outstanding_balance
                    status: if active {
                        "active".to_string()
                    } else {
                        "inactive".to_string()
                    }, // Map active boolean to status string
                    created_at,
                    updated_at,
                })
            } else {
                // Return an error if we couldn't get required fields
                Err(rusqlite::Error::InvalidQuery)
            }
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();
    Ok(suppliers)
}

#[tauri::command]
pub fn get_supplier_by_id(supplier_id: String) -> Result<Option<SupplierFrontend>, String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, contact_name, email, phone, address, notes, preferred_payment_method, credit_balance, active, created_at, updated_at FROM suppliers WHERE id = ?1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt
        .query(params![supplier_id])
        .map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        // Handle errors properly within the closure
        let active_result: Result<bool, rusqlite::Error> = row.get(9);
        let id_result: Result<String, rusqlite::Error> = row.get(0);
        let name_result: Result<String, rusqlite::Error> = row.get(1);
        let created_at_result: Result<String, rusqlite::Error> = row.get(10);
        let updated_at_result: Result<String, rusqlite::Error> = row.get(11);

        // Check if all required fields were retrieved successfully
        if let (Ok(active), Ok(id), Ok(name), Ok(created_at), Ok(updated_at)) = (
            active_result,
            id_result,
            name_result,
            created_at_result,
            updated_at_result,
        ) {
            Ok(Some(SupplierFrontend {
                id,
                name,
                contact_name: row.get(2).ok(),
                email: row.get(3).ok(),
                phone: row.get(4).ok(),
                address: row.get(5).ok(),
                notes: row.get(6).ok(),
                preferred_payment_method: row.get(7).ok(),
                outstanding_balance: row.get(8).unwrap_or(0.0), // Map credit_balance to outstanding_balance
                status: if active {
                    "active".to_string()
                } else {
                    "inactive".to_string()
                }, // Map active boolean to status string
                created_at,
                updated_at,
            }))
        } else {
            // Return an error if we couldn't get required fields
            Err("Failed to retrieve supplier data".to_string())
        }
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn insert_supplier(supplier: SupplierFrontend) -> Result<(), String> {
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
            supplier.outstanding_balance, // Map outstanding_balance to credit_balance
            supplier.status == "active", // Map status string to active boolean
            supplier.created_at,
            supplier.updated_at
        ],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_supplier(supplier: SupplierFrontend) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE suppliers SET name = ?2, contact_name = ?3, email = ?4, phone = ?5, address = ?6, notes = ?7, preferred_payment_method = ?8, active = ?9, updated_at = ?10 WHERE id = ?1",
        params![
            supplier.id,
            supplier.name,
            supplier.contact_name,
            supplier.email,
            supplier.phone,
            supplier.address,
            supplier.notes,
            supplier.preferred_payment_method,
            supplier.status == "active", // Map status string to active boolean
            chrono::Utc::now().to_rfc3339() // Use server time for update
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
    id: String,
    supplier_id: String,
    amount: f64,
    method: String,
    notes: Option<String>,
    session_id: Option<String>,
) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO supplier_payments (id, supplier_id, amount, method, date, notes, session_id) VALUES (?1, ?2, ?3, ?4, datetime('now'), ?5, ?6)",
        params![id, supplier_id, amount, method, notes, session_id],
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

    // Update the credit balance in the database atomically
    conn.execute(
        "UPDATE suppliers SET credit_balance = COALESCE(credit_balance, 0) + ?1 WHERE id = ?2",
        params![amount, supplier_id],
    )
    .map_err(|e| e.to_string())?;

    // Log the manual adjustment in history if notes are provided or amount is significant
    if amount.abs() > 0.001 {
        let history_id = uuid::Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO supplier_history (id, supplier_id, date, type, notes, amount, changed_by)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                history_id,
                supplier_id,
                chrono::Utc::now().to_rfc3339(),
                "Credit Balance Adjusted",
                notes.unwrap_or_else(|| "Manual entry".to_string()),
                amount,
                None::<String>,
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

use crate::db::models::SupplierHistoryEvent;

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
                event_type: row.get(3)?,
                notes: row.get(4).ok(),
                amount: row.get::<_, f64>(5).unwrap_or(0.0),
                changed_by: row.get(6).ok(),
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();
    Ok(history)
}

// Add the insert_supplier_history function
#[tauri::command]
pub fn insert_supplier_history(event: SupplierHistoryEvent) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO supplier_history (id, supplier_id, date, type, notes, amount, changed_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            event.id,
            event.supplier_id,
            event.date,
            event.event_type,
            event.notes,
            event.amount,
            event.changed_by,
        ],
    ).map_err(|e| e.to_string())?;
    Ok(())
}
