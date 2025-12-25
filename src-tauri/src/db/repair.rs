use super::models::{Repair, RepairHistory, RepairPayment, RepairUsedPart};
use rusqlite::{params, OptionalExtension, Result};

/// ======================
/// CRUD FUNCTIONS
/// ======================

/// Insert a new repair
#[tauri::command]
pub fn insert_repair(mut repair: Repair) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;

    // Generate readable code
    let last_code: Option<String> = conn
        .query_row(
            "SELECT code FROM repairs WHERE code IS NOT NULL ORDER BY created_at DESC LIMIT 1",
            [],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;

    let new_code = match last_code {
        Some(code) => {
            // Format: REP001
            let clean_code = code.replace("#", "").replace("REP", "").replace(" ", "");
            match clean_code.parse::<i32>() {
                Ok(num) => format!("REP{:03}", num + 1),
                Err(_) => "REP001".to_string(),
            }
        }
        None => "REP001".to_string(),
    };
    repair.code = Some(new_code.clone());

    conn.execute(
        "INSERT INTO repairs (id, customer_name, customer_phone, device_brand, device_model, issue_description, estimated_cost, status, payment_status, created_at, updated_at, code)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, datetime('now'), datetime('now'), ?10)",
        params![
            repair.id,
            repair.customer_name,
            repair.customer_phone,
            repair.device_brand,
            repair.device_model,
            repair.issue_description,
            repair.estimated_cost,
            repair.status,
            repair.payment_status,
            new_code,
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Fetch all repairs
#[tauri::command]
pub fn get_repairs() -> Result<Vec<Repair>, String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, customer_name, customer_phone, device_brand, device_model, issue_description, estimated_cost, status, payment_status, created_at, updated_at, code FROM repairs ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    let items = stmt
        .query_map([], |row| {
            Ok(Repair {
                id: row.get(0)?,
                customer_name: row.get(1)?,
                customer_phone: row.get(2)?,
                device_brand: row.get(3)?,
                device_model: row.get(4)?,
                issue_description: row.get(5)?,
                estimated_cost: row.get(6)?,
                status: row.get(7)?,
                payment_status: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
                code: row.get(11).ok(), // Optional
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();
    Ok(items)
}

/// Fetch repair by id
#[tauri::command]
pub fn get_repair_by_id(repair_id: String) -> Result<Option<Repair>, String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, customer_name, customer_phone, device_brand, device_model, issue_description, estimated_cost, status, payment_status, created_at, updated_at, code FROM repairs WHERE id = ?1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query(params![repair_id]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        Ok(Some(Repair {
            id: row.get(0).map_err(|e| e.to_string())?,
            customer_name: row.get(1).map_err(|e| e.to_string())?,
            customer_phone: row.get(2).map_err(|e| e.to_string())?,
            device_brand: row.get(3).map_err(|e| e.to_string())?,
            device_model: row.get(4).map_err(|e| e.to_string())?,
            issue_description: row.get(5).map_err(|e| e.to_string())?,
            estimated_cost: row.get(6).map_err(|e| e.to_string())?,
            status: row.get(7).map_err(|e| e.to_string())?,
            payment_status: row.get(8).map_err(|e| e.to_string())?,
            created_at: row.get(9).map_err(|e| e.to_string())?,
            updated_at: row.get(10).map_err(|e| e.to_string())?,
            code: row.get(11).ok(),
        }))
    } else {
        Ok(None)
    }
}

/// Update repair
#[tauri::command]
pub fn update_repair(repair: Repair) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE repairs SET customer_name = ?2, customer_phone = ?3, device_brand = ?4, device_model = ?5, issue_description = ?6, estimated_cost = ?7, status = ?8, payment_status = ?9, updated_at = datetime('now') WHERE id = ?1",
        params![
            repair.id,
            repair.customer_name,
            repair.customer_phone,
            repair.device_brand,
            repair.device_model,
            repair.issue_description,
            repair.estimated_cost,
            repair.status,
            repair.payment_status,
            // We usually don't update code, so I'll leave it as is or should I?
            // If code is not updating, I don't need to add it to SET.
            // But if the user edits the 'code' (not currently planned), it would be needed.
            // For now, let's NOT update code to prevent accidental changes.
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Update repair status
#[tauri::command]
pub fn update_repair_status(id: String, new_status: String) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE repairs SET status = ?2, updated_at = datetime('now') WHERE id = ?1",
        params![id, new_status],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

// Note: update_payment_status function removed as payment status is now automatically calculated by add_payment

/// Delete repair (cascade will clear children)
#[tauri::command]
pub fn delete_repair(id: String) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM repairs WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// ======================
/// PAYMENTS
/// ======================

#[tauri::command]
pub fn add_payment(payment: RepairPayment) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;

    // Insert payment
    conn.execute(
        "INSERT INTO repair_payments (id, repair_id, amount, date, method, received_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            payment.id,
            payment.repair_id,
            payment.amount,
            payment.date,
            payment.method,
            payment.received_by
        ],
    ).map_err(|e| e.to_string())?;

    // Recalculate total paid
    let total_paid: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(amount), 0) FROM repair_payments WHERE repair_id = ?1",
            params![payment.repair_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // Get estimated cost
    let estimated_cost: f64 = conn
        .query_row(
            "SELECT estimated_cost FROM repairs WHERE id = ?1",
            params![payment.repair_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // Derive new payment status
    let new_status = if total_paid == 0.0 {
        "Unpaid"
    } else if total_paid >= estimated_cost {
        "Paid"
    } else {
        "Partially"
    };

    // Update payment status
    conn.execute(
        "UPDATE repairs SET payment_status = ?2, updated_at = datetime('now') WHERE id = ?1",
        params![payment.repair_id, new_status],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_payments_for_repair(repair_id: String) -> Result<Vec<RepairPayment>, String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, repair_id, amount, date, method, received_by FROM repair_payments WHERE repair_id = ?1 ORDER BY date DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![repair_id], |row| {
            Ok(RepairPayment {
                id: row.get(0)?,
                repair_id: row.get(1)?,
                amount: row.get(2)?,
                date: row.get(3)?,
                method: row.get(4)?,
                received_by: row.get(5).ok(),
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();
    Ok(rows)
}

/// ======================
/// USED PARTS
/// ======================

#[tauri::command]
pub fn add_used_part(part: RepairUsedPart) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO repair_used_parts (id, repair_id, part_id, part_name, quantity, unit_price) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            part.id,
            part.repair_id,
            part.part_id,
            part.part_name,
            part.quantity,
            part.unit_price
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_used_parts_for_repair(repair_id: String) -> Result<Vec<RepairUsedPart>, String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, repair_id, part_id, part_name, quantity, unit_price FROM repair_used_parts WHERE repair_id = ?1")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![repair_id], |row| {
            Ok(RepairUsedPart {
                id: row.get(0)?,
                repair_id: row.get(1)?,
                part_id: row.get(2)?,
                part_name: row.get(3)?,
                quantity: row.get(4)?,
                unit_price: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();
    Ok(rows)
}

/// ======================
/// REPAIR HISTORY
/// ======================

#[tauri::command]
pub fn insert_repair_history(event: RepairHistory) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO repair_history (id, repair_id, date, event_type, details, changed_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            event.id,
            event.repair_id,
            event.date,
            event.event_type,
            event.details,
            event.changed_by
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_history_for_repair(repair_id: String) -> Result<Vec<RepairHistory>, String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, repair_id, date, event_type, details, changed_by FROM repair_history WHERE repair_id = ?1 ORDER BY date DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![repair_id], |row| {
            Ok(RepairHistory {
                id: row.get(0)?,
                repair_id: row.get(1)?,
                date: row.get(2)?,
                event_type: row.get(3)?,
                details: row.get(4)?,
                changed_by: row.get(5).ok(),
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();
    Ok(rows)
}
