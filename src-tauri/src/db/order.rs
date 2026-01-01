use crate::db;
use crate::db::models::{Order, OrderItem, OrderPayment, OrderWithDetails};
use rusqlite::{params, Result};

/// Generate a unique order number (e.g., ORD-2025-001)
fn generate_order_number() -> Result<String, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    let year = chrono::Utc::now().format("%Y").to_string();
    
    // Get the highest order number for this year
    let mut stmt = conn
        .prepare("SELECT order_number FROM orders WHERE order_number LIKE ?1 ORDER BY order_number DESC LIMIT 1")
        .map_err(|e| e.to_string())?;
    
    let next_number = match stmt.query_row(params![format!("ORD-{}-%", year)], |row| {
        let order_num: String = row.get(0)?;
        Ok(order_num)
    }) {
        Ok(last_order) => {
            // Extract the number part and increment
            if let Some(num_str) = last_order.split('-').last() {
                if let Ok(num) = num_str.parse::<i32>() {
                    num + 1
                } else {
                    1
                }
            } else {
                1
            }
        }
        Err(_) => 1, // No orders for this year yet
    };
    
    Ok(format!("ORD-{}-{:03}", year, next_number))
}

/// Create a new order
#[tauri::command]
pub fn create_order(mut order: Order) -> Result<Order, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    // Generate order number if not provided or empty
    if order.order_number.is_empty() {
        order.order_number = generate_order_number()?;
    }
    
    conn.execute(
        "INSERT INTO orders (id, order_number, supplier_id, status, payment_status, total_amount, paid_amount, notes, created_at, updated_at, created_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            order.id,
            order.order_number,
            order.supplier_id,
            order.status,
            order.payment_status,
            order.total_amount,
            order.paid_amount,
            order.notes,
            order.created_at,
            order.updated_at,
            order.created_by,
        ],
    )
    .map_err(|e| e.to_string())?;
    
    // Log creation in history
    let history_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO order_history (id, order_id, date, event_type, details, changed_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            history_id,
            order.id,
            chrono::Utc::now().to_rfc3339(),
            "created",
            format!("Order {} created", order.order_number),
            order.created_by,
        ],
    )
    .map_err(|e| e.to_string())?;
    
    Ok(order)
}

/// Get all orders with optional filtering
#[tauri::command]
pub fn get_orders(status_filter: Option<String>) -> Result<Vec<Order>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    let query = if let Some(status) = status_filter {
        format!("SELECT id, order_number, supplier_id, status, payment_status, total_amount, paid_amount, notes, created_at, updated_at, created_by FROM orders WHERE status = '{}' ORDER BY created_at DESC", status)
    } else {
        "SELECT id, order_number, supplier_id, status, payment_status, total_amount, paid_amount, notes, created_at, updated_at, created_by FROM orders ORDER BY created_at DESC".to_string()
    };
    
    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    
    let orders = stmt
        .query_map([], |row| {
            Ok(Order {
                id: row.get(0)?,
                order_number: row.get(1)?,
                supplier_id: row.get(2)?,
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
    
    Ok(orders)
}

/// Get a single order by ID with all details
#[tauri::command]
pub fn get_order_by_id(order_id: String) -> Result<Option<OrderWithDetails>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    // Get order
    let mut stmt = conn
        .prepare("SELECT id, order_number, supplier_id, status, payment_status, total_amount, paid_amount, notes, created_at, updated_at, created_by FROM orders WHERE id = ?1")
        .map_err(|e| e.to_string())?;
    
    let order = match stmt.query_row(params![order_id], |row| {
        Ok(Order {
            id: row.get(0)?,
            order_number: row.get(1)?,
            supplier_id: row.get(2)?,
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
        Ok(order) => order,
        Err(_) => return Ok(None),
    };
    
    // Get supplier name
    let supplier_name: String = conn
        .query_row(
            "SELECT name FROM suppliers WHERE id = ?1",
            params![order.supplier_id],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| "Unknown Supplier".to_string());
    
    // Get items
    let mut items_stmt = conn
        .prepare("SELECT id, order_id, item_id, item_name, quantity, unit_price, total_price, notes FROM order_items WHERE order_id = ?1")
        .map_err(|e| e.to_string())?;
    
    let items = items_stmt
        .query_map(params![order.id], |row| {
            Ok(OrderItem {
                id: row.get(0)?,
                order_id: row.get(1)?,
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
    
    // Get payments
    let mut payments_stmt = conn
        .prepare("SELECT id, order_id, amount, method, date, received_by, notes, session_id FROM order_payments WHERE order_id = ?1")
        .map_err(|e| e.to_string())?;
    
    let payments = payments_stmt
        .query_map(params![order.id], |row| {
            Ok(OrderPayment {
                id: row.get(0)?,
                order_id: row.get(1)?,
                amount: row.get(2)?,
                method: row.get(3)?,
                date: row.get(4)?,
                received_by: row.get(5).ok(),
                notes: row.get(6).ok(),
                session_id: row.get(7).ok(),
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();
    
    Ok(Some(OrderWithDetails {
        order,
        items,
        payments,
        supplier_name,
    }))
}

/// Update an existing order
#[tauri::command]
pub fn update_order(order: Order) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    // Get old order state to handle balance changes
    let (old_supplier_id, old_total_amount, old_status): (String, f64, String) = conn.query_row(
        "SELECT supplier_id, total_amount, status FROM orders WHERE id = ?1",
        params![order.id],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?))
    ).map_err(|e| e.to_string())?;

    // Update order header (excluding totals which are managed by recalculate functions)
    conn.execute(
        "UPDATE orders SET supplier_id = ?2, status = ?3, notes = ?4, updated_at = ?5 WHERE id = ?1",
        params![
            order.id,
            order.supplier_id,
            order.status,
            order.notes,
            order.updated_at,
        ],
    )
    .map_err(|e| e.to_string())?;

    // Handle Balance Ownership/Lifecycle Changes
    // (Actual volume changes are handled by recalculate_order_total at the end)
    
    if old_status == "completed" && order.status != "completed" {
        // Transition: Completed -> Draft (Reverse entire old balance from old supplier)
        adjust_supplier_balance_internal(&conn, &old_supplier_id, -old_total_amount, "Order Reverted to Draft", &order.order_number)?;
    } else if old_status != "completed" && order.status == "completed" {
        // Transition: Draft -> Completed (Apply current balance to new supplier)
        adjust_supplier_balance_internal(&conn, &order.supplier_id, old_total_amount, "Order Completed", &order.order_number)?;
    } else if old_status == "completed" && order.status == "completed" {
        // Transition: Remained Completed (Check if supplier changed)
        if old_supplier_id != order.supplier_id {
            // Move balance from old to new supplier
            adjust_supplier_balance_internal(&conn, &old_supplier_id, -old_total_amount, "Order Moved to Another Supplier", &order.order_number)?;
            adjust_supplier_balance_internal(&conn, &order.supplier_id, old_total_amount, "Order Moved from Another Supplier", &order.order_number)?;
        }
    }

    // Sync everything
    recalculate_order_total(&order.id)?;
    recalculate_payment_status(&order.id)?;
    
    // Log update in history
    let history_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO order_history (id, order_id, date, event_type, details, changed_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            history_id,
            order.id,
            chrono::Utc::now().to_rfc3339(),
            "updated",
            format!("Order {} updated", order.order_number),
            order.created_by,
        ],
    )
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Helper function to adjust supplier balance with history logging (Internal use)
fn adjust_supplier_balance_internal(conn: &rusqlite::Connection, supplier_id: &str, amount: f64, note_prefix: &str, order_num: &str) -> Result<(), String> {
    if amount.abs() < 0.001 {
        return Ok(());
    }

    conn.execute(
        "UPDATE suppliers SET credit_balance = COALESCE(credit_balance, 0) + ?1 WHERE id = ?2",
        params![amount, supplier_id],
    ).map_err(|e| e.to_string())?;

    let history_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO supplier_history (id, supplier_id, date, type, notes, amount, changed_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            history_id,
            supplier_id,
            chrono::Utc::now().to_rfc3339(),
            if amount > 0.0 { "Purchase Order Created" } else { "Credit Balance Adjusted" },
            format!("{}: Order {}", note_prefix, order_num),
            amount,
            None::<String>,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

/// Add an item to an order
#[tauri::command]
pub fn add_order_item(item: OrderItem) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO order_items (id, order_id, item_id, item_name, quantity, unit_price, total_price, notes)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            item.id,
            item.order_id,
            item.item_id,
            item.item_name,
            item.quantity,
            item.unit_price,
            item.total_price,
            item.notes,
        ],
    )
    .map_err(|e| e.to_string())?;

    // If order is completed, update inventory
    let order_status: String = conn.query_row(
        "SELECT status FROM orders WHERE id = ?1",
        params![item.order_id],
        |row| row.get(0)
    ).unwrap_or_else(|_| "draft".to_string());

    if order_status == "completed" {
        if let Some(item_id) = &item.item_id {
            // Update inventory
            conn.execute(
                "UPDATE inventory_items SET quantity_in_stock = COALESCE(quantity_in_stock, 0) + ?1 WHERE id = ?2",
                params![item.quantity, item_id]
            ).map_err(|e| e.to_string())?;

            // Log inventory history
            let order_num: String = conn.query_row(
                "SELECT order_number FROM orders WHERE id = ?1",
                params![item.order_id],
                |row| row.get(0)
            ).unwrap_or_default();

            let history_id = uuid::Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO inventory_history (id, item_id, date, event_type, quantity_change, notes, related_id)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    history_id,
                    item_id,
                    chrono::Utc::now().to_rfc3339(),
                    "Purchased",
                    item.quantity,
                    format!("Added item to completed order {}", order_num),
                    item.order_id,
                ],
            ).map_err(|e| e.to_string())?;
        }
    }
    
    // Recalculate order total
    recalculate_order_total(&item.order_id)?;
    
    // Log in history
    let history_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO order_history (id, order_id, date, event_type, details, changed_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            history_id,
            item.order_id,
            chrono::Utc::now().to_rfc3339(),
            "item_added",
            format!("Added item: {}", item.item_name),
            None::<String>,
        ],
    )
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Update an order item
#[tauri::command]
pub fn update_order_item(item: OrderItem) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    // Get old item details for inventory adjustment if completed
    let old_item: Option<(Option<String>, i32)> = conn.query_row(
        "SELECT i.item_id, i.quantity FROM order_items i JOIN orders o ON i.order_id = o.id WHERE i.id = ?1 AND o.status = 'completed'",
        params![item.id],
        |row| Ok((row.get(0).ok(), row.get(1)?))
    ).ok();

    conn.execute(
        "UPDATE order_items SET item_id = ?2, item_name = ?3, quantity = ?4, unit_price = ?5, total_price = ?6, notes = ?7 WHERE id = ?1",
        params![
            item.id,
            item.item_id,
            item.item_name,
            item.quantity,
            item.unit_price,
            item.total_price,
            item.notes,
        ],
    )
    .map_err(|e| e.to_string())?;

    // Handle inventory adjustment if completed
    if let Some((old_item_id, old_qty)) = old_item {
        let order_num: String = conn.query_row(
            "SELECT order_number FROM orders WHERE id = ?1",
            params![item.order_id],
            |row| row.get(0)
        ).unwrap_or_default();

        // 1. Remove old quantity
        if let Some(id) = old_item_id {
            conn.execute(
                "UPDATE inventory_items SET quantity_in_stock = COALESCE(quantity_in_stock, 0) - ?1 WHERE id = ?2",
                params![old_qty, id]
            ).ok();
        }

        // 2. Add new quantity
        if let Some(new_id) = &item.item_id {
            conn.execute(
                "UPDATE inventory_items SET quantity_in_stock = COALESCE(quantity_in_stock, 0) + ?1 WHERE id = ?2",
                params![item.quantity, new_id]
            ).map_err(|e| e.to_string())?;

            // Log history
            let history_id = uuid::Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO inventory_history (id, item_id, date, event_type, quantity_change, notes, related_id)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    history_id,
                    new_id,
                    chrono::Utc::now().to_rfc3339(),
                    "Adjustment",
                    item.quantity as i64 - old_qty as i64,
                    format!("Updated item in completed order {}", order_num),
                    item.order_id,
                ],
            ).map_err(|e| e.to_string())?;
        }
    }
    
    // Recalculate order total
    recalculate_order_total(&item.order_id)?;
    
    Ok(())
}

/// Remove an item from an order
#[tauri::command]
pub fn remove_order_item(item_id: String, order_id: String) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    // Get item details for inventory reversal if completed
    let item_info: Option<(String, Option<String>, i32, String)> = conn.query_row(
        "SELECT i.item_name, i.item_id, i.quantity, o.status FROM order_items i JOIN orders o ON i.order_id = o.id WHERE i.id = ?1",
        params![item_id],
        |row| Ok((row.get(0)?, row.get(1).ok(), row.get(2)?, row.get(3)?))
    ).ok();

    let name_for_history = item_info.as_ref().map(|info| info.0.clone()).unwrap_or_else(|| "Unknown Item".to_string());

    conn.execute(
        "DELETE FROM order_items WHERE id = ?1",
        params![item_id],
    )
    .map_err(|e| e.to_string())?;

    // Revert inventory if order was completed
    if let Some((name, id_opt, qty, status)) = item_info {
        if status == "completed" {
            if let Some(id) = id_opt {
                conn.execute(
                    "UPDATE inventory_items SET quantity_in_stock = COALESCE(quantity_in_stock, 0) - ?1 WHERE id = ?2",
                    params![qty, id]
                ).map_err(|e| e.to_string())?;

                let order_num: String = conn.query_row(
                    "SELECT order_number FROM orders WHERE id = ?1",
                    params![order_id],
                    |row| row.get(0)
                ).unwrap_or_default();

                let history_id = uuid::Uuid::new_v4().to_string();
                conn.execute(
                    "INSERT INTO inventory_history (id, item_id, date, event_type, quantity_change, notes, related_id)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                    params![
                        history_id,
                        id,
                        chrono::Utc::now().to_rfc3339(),
                        "Adjustment",
                        -qty,
                        format!("Removed item {} from completed order {}", name, order_num),
                        order_id,
                    ],
                ).map_err(|e| e.to_string())?;
            }
        }
    }
    
    // Recalculate order total
    recalculate_order_total(&order_id)?;
    
    // Log in history
    let history_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO order_history (id, order_id, date, event_type, details, changed_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            history_id,
            order_id,
            chrono::Utc::now().to_rfc3339(),
            "item_removed",
            format!("Removed item: {}", name_for_history),
            None::<String>,
        ],
    )
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Helper function to recalculate order total
fn recalculate_order_total(order_id: &str) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    // Get current state to check if we need to adjust supplier balance
    let (old_total, status, supplier_id, order_num): (f64, String, String, String) = conn.query_row(
        "SELECT total_amount, status, supplier_id, order_number FROM orders WHERE id = ?1",
        params![order_id],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
    ).map_err(|e| e.to_string())?;

    // Sum all item totals
    let new_total: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total_price), 0) FROM order_items WHERE order_id = ?1",
            params![order_id],
            |row| row.get(0),
        )
        .unwrap_or(0.0);
    
    // Update order total
    conn.execute(
        "UPDATE orders SET total_amount = ?1, updated_at = ?2 WHERE id = ?3",
        params![new_total, chrono::Utc::now().to_rfc3339(), order_id],
    )
    .map_err(|e| e.to_string())?;

    // If the order is completed, we must adjust the supplier's credit balance
    if status == "completed" && (new_total - old_total).abs() > 0.001 {
        let diff = new_total - old_total;
        
        // Update supplier balance
        conn.execute(
            "UPDATE suppliers SET credit_balance = COALESCE(credit_balance, 0) + ?1 WHERE id = ?2",
            params![diff, supplier_id],
        ).map_err(|e| e.to_string())?;

        // Log in supplier history
        let history_id = uuid::Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO supplier_history (id, supplier_id, date, type, notes, amount, changed_by)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                history_id,
                supplier_id,
                chrono::Utc::now().to_rfc3339(),
                "Credit Balance Adjusted",
                format!("Order {} total recalculated (items changed)", order_num),
                diff,
                None::<String>,
            ],
        ).map_err(|e| e.to_string())?;
    }
    
    // Recalculate payment status as total has changed
    recalculate_payment_status(order_id)?;
    
    Ok(())
}

/// Add a payment to an order
#[tauri::command]
pub fn add_order_payment(payment: OrderPayment) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO order_payments (id, order_id, amount, method, date, received_by, notes, session_id)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            payment.id,
            payment.order_id,
            payment.amount,
            payment.method,
            payment.date,
            payment.received_by,
            payment.notes,
            payment.session_id,
        ],
    )
    .map_err(|e| e.to_string())?;
    
    // Recalculate payment status
    recalculate_payment_status(&payment.order_id)?;
    
    // Update supplier balance and history
    let (supplier_id, order_number): (String, String) = conn.query_row(
        "SELECT supplier_id, order_number FROM orders WHERE id = ?1",
        params![payment.order_id],
        |row| Ok((row.get(0)?, row.get(1)?))
    ).map_err(|e| e.to_string())?;

    // Subtract amount from supplier credit balance
    conn.execute(
        "UPDATE suppliers SET credit_balance = COALESCE(credit_balance, 0) - ?1 WHERE id = ?2",
        params![payment.amount, supplier_id],
    ).map_err(|e| e.to_string())?;

    // Log in supplier history
    let supplier_history_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO supplier_history (id, supplier_id, date, type, notes, amount, changed_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            supplier_history_id,
            supplier_id,
            chrono::Utc::now().to_rfc3339(),
            "Payment Made",
            format!("Payment for Order {}", order_number),
            -payment.amount,
            payment.received_by,
        ],
    ).map_err(|e| e.to_string())?;

    // Log in history
    let history_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO order_history (id, order_id, date, event_type, details, changed_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            history_id,
            payment.order_id,
            chrono::Utc::now().to_rfc3339(),
            "payment_added",
            format!("Payment of ${:.2} added", payment.amount),
            payment.received_by,
        ],
    )
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Get all payments for an order
#[tauri::command]
pub fn get_order_payments(order_id: String) -> Result<Vec<OrderPayment>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    let mut stmt = conn
        .prepare("SELECT id, order_id, amount, method, date, received_by, notes, session_id FROM order_payments WHERE order_id = ?1 ORDER BY date DESC")
        .map_err(|e| e.to_string())?;
    
    let payments = stmt
        .query_map(params![order_id], |row| {
            Ok(OrderPayment {
                id: row.get(0)?,
                order_id: row.get(1)?,
                amount: row.get(2)?,
                method: row.get(3)?,
                date: row.get(4)?,
                received_by: row.get(5).ok(),
                notes: row.get(6).ok(),
                session_id: row.get(7).ok(),
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();
    
    Ok(payments)
}

/// Helper function to recalculate payment status
fn recalculate_payment_status(order_id: &str) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    // Get total amount and sum of payments
    let (total_amount, paid_amount): (f64, f64) = conn
        .query_row(
            "SELECT 
                o.total_amount,
                COALESCE(SUM(p.amount), 0)
             FROM orders o
             LEFT JOIN order_payments p ON o.id = p.order_id
             WHERE o.id = ?1
             GROUP BY o.id",
            params![order_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .unwrap_or((0.0, 0.0));
    
    // Determine payment status
    let payment_status = if paid_amount >= total_amount {
        "paid"
    } else if paid_amount > 0.0 {
        "partial"
    } else {
        "unpaid"
    };
    
    // Update order
    conn.execute(
        "UPDATE orders SET paid_amount = ?1, payment_status = ?2, updated_at = ?3 WHERE id = ?4",
        params![paid_amount, payment_status, chrono::Utc::now().to_rfc3339(), order_id],
    )
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Complete an order and update inventory
#[tauri::command]
pub fn complete_order(order_id: String) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    // Get order details and check status
    let (order_number, status): (String, String) = conn
        .query_row(
            "SELECT order_number, status FROM orders WHERE id = ?1",
            params![order_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|e| e.to_string())?;
    
    // Safety check: if already completed, don't update inventory twice
    if status == "completed" {
        return Ok(());
    }
    
    // Get all order items
    let mut stmt = conn
        .prepare("SELECT id, item_id, quantity FROM order_items WHERE order_id = ?1")
        .map_err(|e| e.to_string())?;
    
    let items: Vec<(String, Option<String>, i32)> = stmt
        .query_map(params![order_id], |row| {
            Ok((
                row.get(0)?,  // id
                row.get(1).ok(),  // item_id
                row.get(2)?,  // quantity
            ))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();
    
    // Update inventory for each item
    for (_, item_id_opt, quantity) in items {
        if let Some(item_id) = item_id_opt {
            // Update inventory quantity
            conn.execute(
                "UPDATE inventory_items 
                 SET quantity_in_stock = COALESCE(quantity_in_stock, 0) + ?1 
                 WHERE id = ?2",
                params![quantity, item_id],
            )
            .map_err(|e| e.to_string())?;
            
            // Log in inventory history
            let history_id = uuid::Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO inventory_history (id, item_id, date, event_type, quantity_change, notes, related_id)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    history_id,
                    item_id,
                    chrono::Utc::now().to_rfc3339(),
                    "Purchased",
                    quantity,
                    format!("Added from order {}", order_number),
                    order_id,
                ],
            )
            .map_err(|e| e.to_string())?;
        }
    }
    
    // Update order status to completed
    conn.execute(
        "UPDATE orders SET status = 'completed', updated_at = ?1 WHERE id = ?2",
        params![chrono::Utc::now().to_rfc3339(), order_id],
    )
    .map_err(|e| e.to_string())?;
    
    // Log completion in order history
    let history_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO order_history (id, order_id, date, event_type, details, changed_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            history_id,
            order_id,
            chrono::Utc::now().to_rfc3339(),
            "completed",
            format!("Order {} completed and inventory updated", order_number),
            None::<String>,
        ],
    )
    .map_err(|e| e.to_string())?;

    // Update supplier balance and history
    let (supplier_id, total_amount): (String, f64) = conn.query_row(
        "SELECT supplier_id, total_amount FROM orders WHERE id = ?1",
        params![order_id],
        |row| Ok((row.get(0)?, row.get(1)?))
    ).map_err(|e| e.to_string())?;

    // Add total amount to supplier credit balance
    conn.execute(
        "UPDATE suppliers SET credit_balance = COALESCE(credit_balance, 0) + ?1 WHERE id = ?2",
        params![total_amount, supplier_id],
    ).map_err(|e| e.to_string())?;

    // Log in supplier history
    let supplier_history_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO supplier_history (id, supplier_id, date, type, notes, amount, changed_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            supplier_history_id,
            supplier_id,
            chrono::Utc::now().to_rfc3339(),
            "Purchase Order Created",
            format!("Purchased via Order {}", order_number),
            total_amount,
            None::<String>,
        ],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Get orders for a specific supplier
#[tauri::command]
pub fn get_orders_by_supplier(supplier_id: String) -> Result<Vec<Order>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    let mut stmt = conn
        .prepare("SELECT id, order_number, supplier_id, status, payment_status, total_amount, paid_amount, notes, created_at, updated_at, created_by 
                  FROM orders 
                  WHERE supplier_id = ?1 
                  ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    
    let orders = stmt
        .query_map(params![supplier_id], |row| {
            Ok(Order {
                id: row.get(0)?,
                order_number: row.get(1)?,
                supplier_id: row.get(2)?,
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
    
    Ok(orders)
}
