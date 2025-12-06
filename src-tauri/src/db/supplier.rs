use crate::db::inventory::InventoryHistoryEvent;
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
            supplier.outstanding_balance, // Map outstanding_balance to credit_balance
            supplier.status == "active", // Map status string to active boolean
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
    id: String,
    supplier_id: String,
    amount: f64,
    method: String,
    notes: Option<String>,
) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO supplier_payments (id, supplier_id, amount, method, date, notes) VALUES (?1, ?2, ?3, ?4, datetime('now'), ?5)",
        params![id, supplier_id, amount, method, notes],
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
pub fn get_supplier_history(supplier_id: String) -> Result<Vec<InventoryHistoryEvent>, String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, supplier_id, date, type, notes, amount, changed_by FROM supplier_history WHERE supplier_id = ?1 ORDER BY date DESC")
        .map_err(|e| e.to_string())?;
    let history = stmt
        .query_map(params![supplier_id], |row| {
            // Handle errors properly within the closure
            let id_result: Result<String, rusqlite::Error> = row.get(0);
            let item_id_result: Result<String, rusqlite::Error> = row.get(1); // supplier_id maps to item_id
            let event_type_result: Result<String, rusqlite::Error> = row.get(3); // type maps to event_type
            let date_result: Result<String, rusqlite::Error> = row.get(2);

            // Check if all required fields were retrieved successfully
            if let (Ok(id), Ok(item_id), Ok(event_type), Ok(date)) =
                (id_result, item_id_result, event_type_result, date_result)
            {
                Ok(InventoryHistoryEvent {
                    id,
                    item_id,                                  // supplier_id maps to item_id
                    event_type,                               // type maps to event_type
                    quantity_change: row.get(5).unwrap_or(0), // amount maps to quantity_change
                    related_id: row.get(6).ok(), // changed_by maps to related_id (this might need adjustment based on actual schema)
                    date,
                    notes: row.get(4).ok(),
                })
            } else {
                // Return an error if we couldn't get required fields
                Err(rusqlite::Error::InvalidQuery)
            }
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();
    Ok(history)
}

// Add the insert_supplier_history function
#[tauri::command]
pub fn insert_supplier_history(event: InventoryHistoryEvent) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO supplier_history (id, supplier_id, date, type, notes, amount, changed_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            event.id,
            event.item_id,      // supplier_id is stored in item_id field
            event.date,
            event.event_type,   // type is stored in event_type field
            event.notes,
            event.quantity_change, // amount is stored in quantity_change field
            event.related_id,   // changed_by is stored in related_id field
        ],
    ).map_err(|e| e.to_string())?;
    Ok(())
}
