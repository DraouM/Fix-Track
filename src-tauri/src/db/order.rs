use crate::db;
use crate::db::models::{Order, OrderItem, OrderPayment, OrderHistory, OrderWithDetails};
use rusqlite::{params, Result};
use serde::{Deserialize, Serialize};

/// Generate a unique order number (e.g., ORD-2025-001)
fn generate_order_number() -> Result<String, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    let year = chrono::Utc::now().format("%Y").to_string();
    
    // Get the count of orders for this year
    let mut stmt = conn
        .prepare("SELECT COUNT(*) FROM orders WHERE order_number LIKE ?1")
        .map_err(|e| e.to_string())?;
    let count: i64 = stmt
        .query_row(params![format!("ORD-{}-%", year)], |row| row.get(0))
        .unwrap_or(0);
    
    Ok(format!("ORD-{}-{:03}", year, count + 1))
}

/// Create a new order
#[tauri::command]
pub fn create_order(order: Order) -> Result<Order, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
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
        .prepare("SELECT id, order_id, amount, method, date, received_by, notes FROM order_payments WHERE order_id = ?1")
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
    
    conn.execute(
        "UPDATE orders SET supplier_id = ?2, status = ?3, payment_status = ?4, total_amount = ?5, paid_amount = ?6, notes = ?7, updated_at = ?8 WHERE id = ?1",
        params![
            order.id,
            order.supplier_id,
            order.status,
            order.payment_status,
            order.total_amount,
            order.paid_amount,
            order.notes,
            order.updated_at,
        ],
    )
    .map_err(|e| e.to_string())?;
    
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
    
    // Recalculate order total
    recalculate_order_total(&item.order_id)?;
    
    Ok(())
}

/// Remove an item from an order
#[tauri::command]
pub fn remove_order_item(item_id: String, order_id: String) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    // Get item name before deleting
    let item_name: String = conn
        .query_row(
            "SELECT item_name FROM order_items WHERE id = ?1",
            params![item_id],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| "Unknown Item".to_string());
    
    conn.execute(
        "DELETE FROM order_items WHERE id = ?1",
        params![item_id],
    )
    .map_err(|e| e.to_string())?;
    
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
            format!("Removed item: {}", item_name),
            None::<String>,
        ],
    )
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Helper function to recalculate order total
fn recalculate_order_total(order_id: &str) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    // Sum all item totals
    let total: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total_price), 0) FROM order_items WHERE order_id = ?1",
            params![order_id],
            |row| row.get(0),
        )
        .unwrap_or(0.0);
    
    // Update order total
    conn.execute(
        "UPDATE orders SET total_amount = ?1, updated_at = ?2 WHERE id = ?3",
        params![total, chrono::Utc::now().to_rfc3339(), order_id],
    )
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Add a payment to an order
#[tauri::command]
pub fn add_order_payment(payment: OrderPayment) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO order_payments (id, order_id, amount, method, date, received_by, notes)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            payment.id,
            payment.order_id,
            payment.amount,
            payment.method,
            payment.date,
            payment.received_by,
            payment.notes,
        ],
    )
    .map_err(|e| e.to_string())?;
    
    // Recalculate payment status
    recalculate_payment_status(&payment.order_id)?;
    
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
        .prepare("SELECT id, order_id, amount, method, date, received_by, notes FROM order_payments WHERE order_id = ?1 ORDER BY date DESC")
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
    
    // Get order details
    let order_number: String = conn
        .query_row(
            "SELECT order_number FROM orders WHERE id = ?1",
            params![order_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    
    // Get all order items
    let mut stmt = conn
        .prepare("SELECT id, item_id, item_name, quantity FROM order_items WHERE order_id = ?1")
        .map_err(|e| e.to_string())?;
    
    let items: Vec<(String, Option<String>, String, i32)> = stmt
        .query_map(params![order_id], |row| {
            Ok((
                row.get(0)?,  // id
                row.get(1).ok(),  // item_id
                row.get(2)?,  // item_name
                row.get(3)?,  // quantity
            ))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();
    
    // Update inventory for each item
    for (_, item_id_opt, item_name, quantity) in items {
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
    
    Ok(())
}
