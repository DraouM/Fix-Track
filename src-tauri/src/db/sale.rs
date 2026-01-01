use crate::db;
use crate::db::models::{Sale, SaleItem, SalePayment, SaleWithDetails};
use rusqlite::{params, Connection, Result};

/// Generate a unique sale number (e.g., SALE-2025-001)
fn generate_sale_number() -> Result<String, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    let year = chrono::Utc::now().format("%Y").to_string();

    let mut stmt = conn
        .prepare("SELECT sale_number FROM customer_sales WHERE sale_number LIKE ?1 ORDER BY sale_number DESC LIMIT 1")
        .map_err(|e| e.to_string())?;

    let next_number = match stmt.query_row(params![format!("SALE-{}-%", year)], |row| {
        let sale_num: String = row.get(0)?;
        Ok(sale_num)
    }) {
        Ok(last_sale) => {
            if let Some(num_str) = last_sale.split('-').last() {
                if let Ok(num) = num_str.parse::<i32>() {
                    num + 1
                } else {
                    1
                }
            } else {
                1
            }
        }
        Err(_) => 1,
    };

    Ok(format!("SALE-{}-{:03}", year, next_number))
}

#[tauri::command]
pub fn create_sale(mut sale: Sale) -> Result<Sale, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    if sale.sale_number.is_empty() {
        sale.sale_number = generate_sale_number()?;
    }

    conn.execute(
        "INSERT INTO customer_sales (id, sale_number, client_id, status, payment_status, total_amount, paid_amount, notes, created_at, updated_at, created_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            sale.id,
            sale.sale_number,
            sale.client_id,
            sale.status,
            sale.payment_status,
            sale.total_amount,
            sale.paid_amount,
            sale.notes,
            sale.created_at,
            sale.updated_at,
            sale.created_by,
        ],
    )
    .map_err(|e| e.to_string())?;

    let history_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO sale_history (id, sale_id, date, event_type, details, changed_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            history_id,
            sale.id,
            chrono::Utc::now().to_rfc3339(),
            "created",
            format!("Sale {} created", sale.sale_number),
            sale.created_by,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(sale)
}

#[tauri::command]
pub fn get_sales(status_filter: Option<String>) -> Result<Vec<Sale>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    let query = if let Some(status) = status_filter {
        format!("SELECT id, sale_number, client_id, status, payment_status, total_amount, paid_amount, notes, created_at, updated_at, created_by FROM customer_sales WHERE status = '{}' ORDER BY created_at DESC", status)
    } else {
        "SELECT id, sale_number, client_id, status, payment_status, total_amount, paid_amount, notes, created_at, updated_at, created_by FROM customer_sales ORDER BY created_at DESC".to_string()
    };

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let sales = stmt
        .query_map([], |row| {
            Ok(Sale {
                id: row.get(0)?,
                sale_number: row.get(1)?,
                client_id: row.get(2)?,
                status: row.get(3)?,
                payment_status: row.get(4)?,
                total_amount: row.get(5)?,
                paid_amount: row.get(6)?,
                notes: row.get(7).ok(),
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
                created_by: row.get(10).ok(),
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();

    Ok(sales)
}

#[tauri::command]
pub fn get_sale_by_id(sale_id: String) -> Result<Option<SaleWithDetails>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, sale_number, client_id, status, payment_status, total_amount, paid_amount, notes, created_at, updated_at, created_by FROM customer_sales WHERE id = ?1")
        .map_err(|e| e.to_string())?;

    let sale = match stmt.query_row(params![sale_id], |row| {
        Ok(Sale {
            id: row.get(0)?,
            sale_number: row.get(1)?,
            client_id: row.get(2)?,
            status: row.get(3)?,
            payment_status: row.get(4)?,
            total_amount: row.get(5)?,
            paid_amount: row.get(6)?,
            notes: row.get(7).ok(),
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
            created_by: row.get(10).ok(),
        })
    }) {
        Ok(sale) => sale,
        Err(_) => return Ok(None),
    };

    let client_name: String = conn
        .query_row(
            "SELECT name FROM clients WHERE id = ?1",
            params![sale.client_id],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| "Unknown Client".to_string());

    let mut items_stmt = conn
        .prepare("SELECT id, sale_id, item_id, item_name, quantity, unit_price, total_price, notes FROM sale_items WHERE sale_id = ?1")
        .map_err(|e| e.to_string())?;

    let items = items_stmt
        .query_map(params![sale.id], |row| {
            Ok(SaleItem {
                id: row.get(0)?,
                sale_id: row.get(1)?,
                item_id: row.get(2).ok(),
                item_name: row.get(3)?,
                quantity: row.get(4)?,
                unit_price: row.get(5)?,
                total_price: row.get(6)?,
                notes: row.get(7).ok(),
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();

    let mut payments_stmt = conn
        .prepare("SELECT id, sale_id, amount, method, date, received_by, notes FROM sale_payments WHERE sale_id = ?1")
        .map_err(|e| e.to_string())?;

    let payments = payments_stmt
        .query_map(params![sale.id], |row| {
            Ok(SalePayment {
                id: row.get(0)?,
                sale_id: row.get(1)?,
                amount: row.get(2)?,
                method: row.get(3)?,
                date: row.get(4)?,
                received_by: row.get(5).ok(),
                notes: row.get(6).ok(),
                session_id: None, // Initialize session_id as None for existing payments
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();

    Ok(Some(SaleWithDetails {
        sale,
        items,
        payments,
        client_name,
    }))
}

#[tauri::command]
pub fn update_sale(sale: Sale) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    let (old_client_id, old_total_amount, old_status): (String, f64, String) = conn
        .query_row(
            "SELECT client_id, total_amount, status FROM customer_sales WHERE id = ?1",
            params![sale.id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE customer_sales SET client_id = ?2, status = ?3, notes = ?4, updated_at = ?5 WHERE id = ?1",
        params![
            sale.id,
            sale.client_id,
            sale.status,
            sale.notes,
            sale.updated_at,
        ],
    )
    .map_err(|e| e.to_string())?;

    if old_status == "completed" && sale.status != "completed" {
        adjust_client_balance_internal(
            &conn,
            &old_client_id,
            -old_total_amount,
            "Sale Reverted to Draft",
            &sale.sale_number,
        )?;
    } else if old_status != "completed" && sale.status == "completed" {
        // When a sale is marked completed, increase the client's balance by the sale total
        adjust_client_balance_internal(
            &conn,
            &sale.client_id,
            sale.total_amount,
            "Sale Completed",
            &sale.sale_number,
        )?;
    }

    Ok(())
}

/// Internal helper to adjust a client's balance using an existing DB connection and
/// record a client_history entry explaining why the balance changed.
fn adjust_client_balance_internal(
    conn: &Connection,
    client_id: &str,
    amount: f64,
    event_type: &str,
    sale_number: &str,
) -> Result<(), String> {
    conn.execute(
        "UPDATE clients SET credit_balance = COALESCE(credit_balance, 0) + ?1 WHERE id = ?2",
        params![amount, client_id],
    )
    .map_err(|e| e.to_string())?;

    if amount.abs() > 0.001 {
        let history_id = uuid::Uuid::new_v4().to_string();
        let notes = format!("{}: {}", event_type, sale_number);
        conn.execute(
            "INSERT INTO client_history (id, client_id, date, type, notes, amount, changed_by)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                history_id,
                client_id,
                chrono::Utc::now().to_rfc3339(),
                event_type,
                notes,
                amount,
                None::<String>,
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

// Recalculate sale total and adjust client balance if sale already completed
fn recalculate_sale_total(sale_id: &str) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    let (old_total, status, client_id, sale_num): (f64, String, String, String) = conn
        .query_row(
            "SELECT total_amount, status, client_id, sale_number FROM customer_sales WHERE id = ?1",
            params![sale_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
        )
        .map_err(|e| e.to_string())?;

    let new_total: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total_price), 0) FROM sale_items WHERE sale_id = ?1",
            params![sale_id],
            |row| row.get(0),
        )
        .unwrap_or(0.0);

    conn.execute(
        "UPDATE customer_sales SET total_amount = ?1, updated_at = ?2 WHERE id = ?3",
        params![new_total, chrono::Utc::now().to_rfc3339(), sale_id],
    )
    .map_err(|e| e.to_string())?;

    if status == "completed" && (new_total - old_total).abs() > 0.001 {
        let diff = new_total - old_total;
        conn.execute(
            "UPDATE clients SET credit_balance = COALESCE(credit_balance, 0) + ?1 WHERE id = ?2",
            params![diff, client_id],
        )
        .map_err(|e| e.to_string())?;

        let history_id = uuid::Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO client_history (id, client_id, date, type, notes, amount, changed_by)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                history_id,
                client_id,
                chrono::Utc::now().to_rfc3339(),
                "Balance Adjusted",
                format!("Sale {} total recalculated (items changed)", sale_num),
                diff,
                None::<String>,
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    recalculate_payment_status(sale_id)?;

    Ok(())
}

// Recalculate sale payment status
fn recalculate_payment_status(sale_id: &str) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    let (total_amount, paid_amount): (f64, f64) = conn
        .query_row(
            "SELECT o.total_amount, COALESCE(SUM(p.amount), 0) FROM customer_sales o LEFT JOIN sale_payments p ON o.id = p.sale_id WHERE o.id = ?1 GROUP BY o.id",
            params![sale_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .unwrap_or((0.0, 0.0));

    let payment_status = if paid_amount >= total_amount {
        "paid"
    } else if paid_amount > 0.0 {
        "partial"
    } else {
        "unpaid"
    };

    conn.execute(
        "UPDATE customer_sales SET paid_amount = ?1, payment_status = ?2, updated_at = ?3 WHERE id = ?4",
        params![paid_amount, payment_status, chrono::Utc::now().to_rfc3339(), sale_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// Add an item to a sale
#[tauri::command]
pub fn add_sale_item(item: SaleItem) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO sale_items (id, sale_id, item_id, item_name, quantity, unit_price, total_price, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            item.id,
            item.sale_id,
            item.item_id,
            item.item_name,
            item.quantity,
            item.unit_price,
            item.total_price,
            item.notes,
        ],
    ).map_err(|e| e.to_string())?;

    // If sale is completed, reduce inventory
    let sale_status: String = conn
        .query_row(
            "SELECT status FROM customer_sales WHERE id = ?1",
            params![item.sale_id],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| "draft".to_string());

    if sale_status == "completed" {
        if let Some(item_id) = &item.item_id {
            conn.execute(
                "UPDATE inventory_items SET quantity_in_stock = COALESCE(quantity_in_stock, 0) - ?1 WHERE id = ?2",
                params![item.quantity, item_id]
            ).map_err(|e| e.to_string())?;

            let sale_num: String = conn
                .query_row(
                    "SELECT sale_number FROM customer_sales WHERE id = ?1",
                    params![item.sale_id],
                    |row| row.get(0),
                )
                .unwrap_or_default();

            let history_id = uuid::Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO inventory_history (id, item_id, date, event_type, quantity_change, notes, related_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    history_id,
                    item_id,
                    chrono::Utc::now().to_rfc3339(),
                    "Sold",
                    -(item.quantity),
                    format!("Sold as part of sale {}", sale_num),
                    item.sale_id,
                ],
            ).map_err(|e| e.to_string())?;
        }
    }

    recalculate_sale_total(&item.sale_id)?;

    let history_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO sale_history (id, sale_id, date, event_type, details, changed_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            history_id,
            item.sale_id,
            chrono::Utc::now().to_rfc3339(),
            "item_added",
            format!("Added item: {}", item.item_name),
            None::<String>,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

/// Update a sale item
#[tauri::command]
pub fn update_sale_item(item: SaleItem) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    // If sale was completed, get old item to reverse inventory
    let old_item: Option<(Option<String>, i32)> = conn.query_row(
        "SELECT i.item_id, i.quantity FROM sale_items i JOIN customer_sales s ON i.sale_id = s.id WHERE i.id = ?1 AND s.status = 'completed'",
        params![item.id],
        |row| Ok((row.get(0).ok(), row.get(1)?))
    ).ok();

    conn.execute(
        "UPDATE sale_items SET item_id = ?2, item_name = ?3, quantity = ?4, unit_price = ?5, total_price = ?6, notes = ?7 WHERE id = ?1",
        params![
            item.id,
            item.item_id,
            item.item_name,
            item.quantity,
            item.unit_price,
            item.total_price,
            item.notes,
        ],
    ).map_err(|e| e.to_string())?;

    if let Some((old_item_id, old_qty)) = old_item {
        let sale_num: String = conn
            .query_row(
                "SELECT sale_number FROM customer_sales WHERE id = ?1",
                params![item.sale_id],
                |row| row.get(0),
            )
            .unwrap_or_default();

        // 1. Revert old inventory
        if let Some(id) = old_item_id {
            conn.execute(
                "UPDATE inventory_items SET quantity_in_stock = COALESCE(quantity_in_stock, 0) + ?1 WHERE id = ?2",
                params![old_qty, id]
            ).ok();
        }

        // 2. Apply new inventory deduction
        if let Some(new_id) = &item.item_id {
            conn.execute(
                "UPDATE inventory_items SET quantity_in_stock = COALESCE(quantity_in_stock, 0) - ?1 WHERE id = ?2",
                params![item.quantity, new_id]
            ).map_err(|e| e.to_string())?;

            let history_id = uuid::Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO inventory_history (id, item_id, date, event_type, quantity_change, notes, related_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    history_id,
                    new_id,
                    chrono::Utc::now().to_rfc3339(),
                    "Adjustment",
                    -(item.quantity as i64 - old_qty as i64),
                    format!("Updated item in completed sale {}", sale_num),
                    item.sale_id,
                ],
            ).map_err(|e| e.to_string())?;
        }
    }

    recalculate_sale_total(&item.sale_id)?;

    Ok(())
}

/// Remove a sale item
#[tauri::command]
pub fn remove_sale_item(item_id: String, sale_id: String) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    let item_info: Option<(String, Option<String>, i32, String)> = conn.query_row(
        "SELECT i.item_name, i.item_id, i.quantity, s.status FROM sale_items i JOIN customer_sales s ON i.sale_id = s.id WHERE i.id = ?1",
        params![item_id],
        |row| Ok((row.get(0)?, row.get(1).ok(), row.get(2)?, row.get(3)?))
    ).ok();

    let name_for_history = item_info
        .as_ref()
        .map(|info| info.0.clone())
        .unwrap_or_else(|| "Unknown Item".to_string());

    conn.execute("DELETE FROM sale_items WHERE id = ?1", params![item_id])
        .map_err(|e| e.to_string())?;

    if let Some((name, id_opt, qty, status)) = item_info {
        if status == "completed" {
            if let Some(id) = id_opt {
                conn.execute(
                    "UPDATE inventory_items SET quantity_in_stock = COALESCE(quantity_in_stock, 0) + ?1 WHERE id = ?2",
                    params![qty, id]
                ).map_err(|e| e.to_string())?;

                let sale_num: String = conn
                    .query_row(
                        "SELECT sale_number FROM customer_sales WHERE id = ?1",
                        params![sale_id],
                        |row| row.get(0),
                    )
                    .unwrap_or_default();

                let history_id = uuid::Uuid::new_v4().to_string();
                conn.execute(
                    "INSERT INTO inventory_history (id, item_id, date, event_type, quantity_change, notes, related_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                    params![
                        history_id,
                        id,
                        chrono::Utc::now().to_rfc3339(),
                        "Adjustment",
                        qty,
                        format!("Removed item {} from completed sale {}", name, sale_num),
                        sale_id,
                    ],
                ).map_err(|e| e.to_string())?;
            }
        }
    }

    recalculate_sale_total(&sale_id)?;

    let history_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO sale_history (id, sale_id, date, event_type, details, changed_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            history_id,
            sale_id,
            chrono::Utc::now().to_rfc3339(),
            "item_removed",
            format!("Removed item: {}", name_for_history),
            None::<String>,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

/// Add a payment to a sale
#[tauri::command]
pub fn add_sale_payment(payment: SalePayment) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO sale_payments (id, sale_id, amount, method, date, received_by, notes, session_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            payment.id,
            payment.sale_id,
            payment.amount,
            payment.method,
            payment.date,
            payment.received_by,
            payment.notes,
            payment.session_id,
        ],
    ).map_err(|e| e.to_string())?;

    recalculate_payment_status(&payment.sale_id)?;

    // Subtract payment from client balance
    let (client_id, sale_number): (String, String) = conn
        .query_row(
            "SELECT client_id, sale_number FROM customer_sales WHERE id = ?1",
            params![payment.sale_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE clients SET credit_balance = COALESCE(credit_balance, 0) - ?1 WHERE id = ?2",
        params![payment.amount, client_id],
    )
    .map_err(|e| e.to_string())?;

    let client_history_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO client_history (id, client_id, date, type, notes, amount, changed_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            client_history_id,
            client_id,
            chrono::Utc::now().to_rfc3339(),
            "Payment Received",
            format!("Payment for Sale {}", sale_number),
            -payment.amount,
            payment.received_by,
        ],
    ).map_err(|e| e.to_string())?;

    let history_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO sale_history (id, sale_id, date, event_type, details, changed_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            history_id,
            payment.sale_id,
            chrono::Utc::now().to_rfc3339(),
            "payment_added",
            format!("Payment of ${:.2} added", payment.amount),
            payment.received_by,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

/// Complete a sale and update inventory and client balance
#[tauri::command]
pub fn complete_sale(sale_id: String) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    let (sale_number, status): (String, String) = conn
        .query_row(
            "SELECT sale_number, status FROM customer_sales WHERE id = ?1",
            params![sale_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|e| e.to_string())?;

    if status == "completed" {
        return Ok(());
    }

    let mut stmt = conn
        .prepare("SELECT id, item_id, quantity FROM sale_items WHERE sale_id = ?1")
        .map_err(|e| e.to_string())?;
    let items: Vec<(String, Option<String>, i32)> = stmt
        .query_map(params![sale_id], |row| {
            Ok((row.get(0)?, row.get(1).ok(), row.get(2)?))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    for (_, item_id_opt, quantity) in items {
        if let Some(item_id) = item_id_opt {
            conn.execute(
                "UPDATE inventory_items SET quantity_in_stock = COALESCE(quantity_in_stock, 0) - ?1 WHERE id = ?2",
                params![quantity, item_id],
            ).map_err(|e| e.to_string())?;

            let history_id = uuid::Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO inventory_history (id, item_id, date, event_type, quantity_change, notes, related_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    history_id,
                    item_id,
                    chrono::Utc::now().to_rfc3339(),
                    "Sold",
                    -(quantity),
                    format!("Sold from sale {}", sale_number),
                    sale_id,
                ],
            ).map_err(|e| e.to_string())?;
        }
    }

    conn.execute(
        "UPDATE customer_sales SET status = 'completed', updated_at = ?1 WHERE id = ?2",
        params![chrono::Utc::now().to_rfc3339(), sale_id],
    )
    .map_err(|e| e.to_string())?;

    let history_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO sale_history (id, sale_id, date, event_type, details, changed_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            history_id,
            sale_id,
            chrono::Utc::now().to_rfc3339(),
            "completed",
            format!("Sale {} completed and inventory updated", sale_number),
            None::<String>,
        ],
    ).map_err(|e| e.to_string())?;

    // Update client balance
    let (client_id, total_amount): (String, f64) = conn
        .query_row(
            "SELECT client_id, total_amount FROM customer_sales WHERE id = ?1",
            params![sale_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE clients SET credit_balance = COALESCE(credit_balance, 0) + ?1 WHERE id = ?2",
        params![total_amount, client_id],
    )
    .map_err(|e| e.to_string())?;

    let client_history_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO client_history (id, client_id, date, type, notes, amount, changed_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            client_history_id,
            client_id,
            chrono::Utc::now().to_rfc3339(),
            "Sale Completed",
            format!("Sale {} marked completed", sale_number),
            total_amount,
            None::<String>,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}
