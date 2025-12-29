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
                used_parts: Vec::new(),
                payments: Vec::new(),
                history: Vec::new(),
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
    
    // 1. Get the base repair
    let mut stmt = conn
        .prepare("SELECT id, customer_name, customer_phone, device_brand, device_model, issue_description, estimated_cost, status, payment_status, created_at, updated_at, code FROM repairs WHERE id = ?1")
        .map_err(|e| e.to_string())?;
    
    let mut rows = stmt.query(params![repair_id]).map_err(|e| e.to_string())?;
    
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        // 2. Get used parts
        let mut parts_stmt = conn
            .prepare("SELECT id, repair_id, part_id, part_name, quantity, unit_price FROM repair_used_parts WHERE repair_id = ?1")
            .map_err(|e| e.to_string())?;
            
        let used_parts: Vec<RepairUsedPart> = parts_stmt
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

        // 3. Get payments
        let mut payments_stmt = conn
            .prepare("SELECT id, repair_id, amount, date, method, received_by FROM repair_payments WHERE repair_id = ?1 ORDER BY date DESC")
            .map_err(|e| e.to_string())?;
            
        let payments: Vec<RepairPayment> = payments_stmt
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

        // 4. Get history
        let mut history_stmt = conn
            .prepare("SELECT id, repair_id, date, event_type, details, changed_by FROM repair_history WHERE repair_id = ?1 ORDER BY date DESC")
            .map_err(|e| e.to_string())?;
            
        let history: Vec<RepairHistory> = history_stmt
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

        // 5. Calculate computed fields
        let total_paid: f64 = payments.iter().map(|p| p.amount).sum();
        let estimated_cost: f64 = row.get(6).unwrap_or(0.0);
        let remaining_balance = estimated_cost - total_paid;

        // 6. Return full object
        Ok(Some(Repair {
            id: row.get(0).map_err(|e| e.to_string())?,
            customer_name: row.get(1).map_err(|e| e.to_string())?,
            customer_phone: row.get(2).map_err(|e| e.to_string())?,
            device_brand: row.get(3).map_err(|e| e.to_string())?,
            device_model: row.get(4).map_err(|e| e.to_string())?,
            issue_description: row.get(5).map_err(|e| e.to_string())?,
            estimated_cost,
            status: row.get(7).map_err(|e| e.to_string())?,
            payment_status: row.get(8).map_err(|e| e.to_string())?,
            
            // Related entities
            used_parts,
            payments,
            history,
            
            // Dates & Code
            created_at: row.get(9).map_err(|e| e.to_string())?,
            updated_at: row.get(10).map_err(|e| e.to_string())?,
            code: row.get(11).ok(),
            
            // Note: Our Rust struct might not have totalPaid/remainingBalance locally if they are not in the struct definition in models.rs
            // Checking models.rs... they are NOT in the struct.
            // Wait, models.rs struct Repair definition:
            /*
            pub struct Repair {
                pub id: String,
                pub customer_name: String,
                ...
                pub used_parts: Option<Vec<RepairUsedPart>>, // Need to check if these fields exist!
            }
            */
            // I previously viewed models.rs and the Repair struct DOES NOT have used_parts, payments, history fields in the Rust definition!
            // I need to update models.rs FIRST to include these fields, otherwise I cannot return them here.
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
    // Get the current status before updating to log the change
    let old_status: String = conn
        .query_row(
            "SELECT status FROM repairs WHERE id = ?1",
            params![&id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    
    // Update the status
    conn.execute(
        "UPDATE repairs SET status = ?2, updated_at = datetime('now') WHERE id = ?1",
        params![id, new_status],
    )
    .map_err(|e| e.to_string())?;
    
    // Add history entry for the status change
    use chrono::Utc;
    use uuid::Uuid;
    let repair_history_id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO repair_history (id, repair_id, date, event_type, details, changed_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            repair_history_id,
            id,
            Utc::now().to_rfc3339(),
            "status_change",
            format!("Status changed from {} to {}", old_status, new_status),
            Option::<String>::None,
        ],
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
pub fn add_used_part(repair_id: String, part: RepairUsedPart) -> Result<(), String> {
    let mut conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    let mut part = part;

    // Set the repair_id to ensure consistency
    part.repair_id = repair_id;

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    {
        // First, check if we have enough inventory for this part
        if !part.part_id.is_empty() {
            // Get current inventory quantity
            let current_stock: Option<i64> = tx
                .query_row(
                    "SELECT quantity_in_stock FROM inventory_items WHERE id = ?1",
                    params![&part.part_id],
                    |row| row.get(0),
                )
                .optional()
                .map_err(|e| e.to_string())?;

            if let Some(stock) = current_stock {
                let quantity_to_deduct = part.quantity as i64;
                if stock < quantity_to_deduct {
                    return Err(format!(
                        "Not enough inventory for part '{}'. Available: {}, Requested: {}",
                        part.part_name, stock, quantity_to_deduct
                    ));
                }

                // Update inventory quantity
                let new_stock = stock - quantity_to_deduct;
                tx.execute(
                    "UPDATE inventory_items SET quantity_in_stock = ?2 WHERE id = ?1",
                    params![&part.part_id, new_stock],
                )
                .map_err(|e| e.to_string())?;

                // Add history entry for inventory deduction
                use chrono::Utc;
                use uuid::Uuid;
                let history_id = Uuid::new_v4().to_string();
                tx.execute(
                    "INSERT INTO inventory_history (id, item_id, date, event_type, quantity_change, notes, related_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                    params![
                        history_id,
                        &part.part_id,
                        Utc::now().to_rfc3339(),
                        "Used in Repair",
                        -quantity_to_deduct, // negative because we're deducting
                        format!("Used {} units in repair", quantity_to_deduct),
                        &part.repair_id, // link to the repair
                    ],
                )
                .map_err(|e| e.to_string())?;
            }
            // If current_stock is None (part_id doesn't exist in inventory), we allow the part to be added without inventory deduction
        }

        // Insert the used part record
        tx.execute(
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

        // NEW: Add history entry for the repair itself
        use chrono::Utc;
        use uuid::Uuid;
        let repair_history_id = Uuid::new_v4().to_string();
        tx.execute(
            "INSERT INTO repair_history (id, repair_id, date, event_type, details, changed_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                repair_history_id,
                &part.repair_id,
                Utc::now().to_rfc3339(),
                "part_added",
                format!("Added part: {} (Qty: {})", part.part_name, part.quantity),
                Option::<String>::None,
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
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

/// Delete used part
#[tauri::command]
pub fn delete_used_part(id: String) -> Result<(), String> {
    let mut conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    {
        // 1. Get part details before deleting to restore inventory
        let part_data: Option<(String, i32, String, String)> = tx
            .query_row(
                "SELECT part_id, quantity, part_name, repair_id FROM repair_used_parts WHERE id = ?1",
                params![id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
            )
            .optional()
            .map_err(|e| e.to_string())?;

        if let Some((part_id, quantity, part_name, repair_id)) = part_data {
            // 2. Restore inventory if it was an inventory item
            if !part_id.is_empty() {
                // Check if item exists in inventory
                let current_stock: Option<i64> = tx
                    .query_row(
                        "SELECT quantity_in_stock FROM inventory_items WHERE id = ?1",
                        params![&part_id],
                        |row| row.get(0),
                    )
                    .optional()
                    .map_err(|e| e.to_string())?;

                if let Some(stock) = current_stock {
                    let new_stock = stock + quantity as i64;
                    tx.execute(
                        "UPDATE inventory_items SET quantity_in_stock = ?2 WHERE id = ?1",
                        params![&part_id, new_stock],
                    )
                    .map_err(|e| e.to_string())?;

                    // Log inventory return
                     use chrono::Utc;
                    use uuid::Uuid;
                    let history_id = Uuid::new_v4().to_string();
                    tx.execute(
                        "INSERT INTO inventory_history (id, item_id, date, event_type, quantity_change, notes, related_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                        params![
                            history_id,
                            &part_id,
                            Utc::now().to_rfc3339(),
                            "Return from Repair",
                            quantity, 
                            format!("Restored from repair deletion"),
                            &repair_id,
                        ],
                    )
                    .map_err(|e| e.to_string())?;
                }
            }
             
             // 3. Log repair history
            use chrono::Utc;
            use uuid::Uuid;
            let repair_history_id = Uuid::new_v4().to_string();
            tx.execute(
                "INSERT INTO repair_history (id, repair_id, date, event_type, details, changed_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![
                    repair_history_id,
                    &repair_id,
                    Utc::now().to_rfc3339(),
                    "note",
                    format!("Part removed: {} (Qty: {})", part_name, quantity),
                    Option::<String>::None,
                ],
            )
            .map_err(|e| e.to_string())?;
        }

        // 4. Delete the record
        tx.execute("DELETE FROM repair_used_parts WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
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
