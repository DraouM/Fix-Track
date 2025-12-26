use crate::db;
use crate::db::models::{Transaction, TransactionItem, TransactionPayment, TransactionWithDetails};
use rusqlite::{params, Connection, Result};
use uuid::Uuid;
use chrono::Utc;

/// Generate a unique transaction number (e.g., TX-2025-001)
fn generate_transaction_number(tx_type: &str) -> Result<String, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    generate_transaction_number_internal(&conn, tx_type)
}

fn generate_transaction_number_internal(conn: &Connection, tx_type: &str) -> Result<String, String> {
    let year = Utc::now().format("%Y").to_string();
    let prefix = if tx_type == "Sale" { "SALE" } else { "PUR" };

    let mut stmt = conn
        .prepare("SELECT transaction_number FROM transactions WHERE transaction_number LIKE ?1 ORDER BY transaction_number DESC LIMIT 1")
        .map_err(|e| e.to_string())?;

    let next_number = match stmt.query_row(params![format!("{}-{}-%", prefix, year)], |row| {
        let tx_num: String = row.get(0)?;
        Ok(tx_num)
    }) {
        Ok(last_tx) => {
            if let Some(num_str) = last_tx.split('-').last() {
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

    Ok(format!("{}-{}-{:03}", prefix, year, next_number))
}

#[tauri::command]
pub fn create_transaction(mut transaction: Transaction) -> Result<Transaction, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    if transaction.transaction_number.is_empty() {
        transaction.transaction_number = generate_transaction_number(&transaction.transaction_type)?;
    }

    conn.execute(
        "INSERT INTO transactions (id, transaction_number, transaction_type, party_id, party_type, status, payment_status, total_amount, paid_amount, notes, created_at, updated_at, created_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![
            transaction.id,
            transaction.transaction_number,
            transaction.transaction_type,
            transaction.party_id,
            transaction.party_type,
            transaction.status,
            transaction.payment_status,
            transaction.total_amount,
            transaction.paid_amount,
            transaction.notes,
            transaction.created_at,
            transaction.updated_at,
            transaction.created_by,
        ],
    )
    .map_err(|e| e.to_string())?;

    // Log history
    let history_id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO transaction_history (id, transaction_id, date, event_type, details, changed_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            history_id,
            transaction.id,
            Utc::now().to_rfc3339(),
            "created",
            format!("{} {} created", transaction.transaction_type, transaction.transaction_number),
            transaction.created_by,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(transaction)
}

#[tauri::command]
pub fn get_transactions(type_filter: Option<String>, status_filter: Option<String>) -> Result<Vec<Transaction>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    let mut query = "SELECT id, transaction_number, transaction_type, party_id, party_type, status, payment_status, total_amount, paid_amount, notes, created_at, updated_at, created_by FROM transactions WHERE 1=1".to_string();
    
    if let Some(t) = type_filter {
        query.push_str(&format!(" AND transaction_type = '{}'", t));
    }
    if let Some(s) = status_filter {
        query.push_str(&format!(" AND status = '{}'", s));
    }
    
    query.push_str(" ORDER BY created_at DESC");

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let transactions = stmt
        .query_map([], |row| {
            Ok(Transaction {
                id: row.get(0)?,
                transaction_number: row.get(1)?,
                transaction_type: row.get(2)?,
                party_id: row.get(3)?,
                party_type: row.get(4)?,
                status: row.get(5)?,
                payment_status: row.get(6)?,
                total_amount: row.get(7)?,
                paid_amount: row.get(8)?,
                notes: row.get(9).ok(),
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
                created_by: row.get(12).ok(),
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();

    Ok(transactions)
}

#[tauri::command]
pub fn get_transaction_by_id(tx_id: String) -> Result<Option<TransactionWithDetails>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, transaction_number, transaction_type, party_id, party_type, status, payment_status, total_amount, paid_amount, notes, created_at, updated_at, created_by FROM transactions WHERE id = ?1")
        .map_err(|e| e.to_string())?;

    let transaction = match stmt.query_row(params![tx_id], |row| {
        Ok(Transaction {
            id: row.get(0)?,
            transaction_number: row.get(1)?,
            transaction_type: row.get(2)?,
            party_id: row.get(3)?,
            party_type: row.get(4)?,
            status: row.get(5)?,
            payment_status: row.get(6)?,
            total_amount: row.get(7)?,
            paid_amount: row.get(8)?,
            notes: row.get(9).ok(),
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
            created_by: row.get(12).ok(),
        })
    }) {
        Ok(tx) => tx,
        Err(_) => return Ok(None),
    };

    let party_name: String = if transaction.party_type == "Client" {
        conn.query_row("SELECT name FROM clients WHERE id = ?1", params![transaction.party_id], |row| row.get(0))
            .unwrap_or_else(|_| "Unknown Client".to_string())
    } else {
        conn.query_row("SELECT name FROM suppliers WHERE id = ?1", params![transaction.party_id], |row| row.get(0))
            .unwrap_or_else(|_| "Unknown Supplier".to_string())
    };

    let mut items_stmt = conn
        .prepare("SELECT id, transaction_id, item_id, item_name, quantity, unit_price, total_price, notes FROM transaction_items WHERE transaction_id = ?1")
        .map_err(|e| e.to_string())?;

    let items = items_stmt
        .query_map(params![transaction.id], |row| {
            Ok(TransactionItem {
                id: row.get(0)?,
                transaction_id: row.get(1)?,
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
        .prepare("SELECT id, transaction_id, amount, method, date, received_by, notes, session_id FROM transaction_payments WHERE transaction_id = ?1")
        .map_err(|e| e.to_string())?;

    let payments = payments_stmt
        .query_map(params![transaction.id], |row| {
            Ok(TransactionPayment {
                id: row.get(0)?,
                transaction_id: row.get(1)?,
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

    Ok(Some(TransactionWithDetails {
        transaction,
        items,
        payments,
        party_name,
    }))
}

#[tauri::command]
pub fn add_transaction_item(item: TransactionItem) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO transaction_items (id, transaction_id, item_id, item_name, quantity, unit_price, total_price, notes) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            item.id,
            item.transaction_id,
            item.item_id,
            item.item_name,
            item.quantity,
            item.unit_price,
            item.total_price,
            item.notes,
        ],
    ).map_err(|e| e.to_string())?;

    // If transaction is already completed, update inventory immediately
    let (status, tx_type, tx_num) = conn.query_row(
        "SELECT status, transaction_type, transaction_number FROM transactions WHERE id = ?1",
        params![item.transaction_id],
        |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?))
    ).map_err(|e| e.to_string())?;

    if status == "Completed" {
        if let Some(item_id) = &item.item_id {
            let qty_change = if tx_type == "Sale" { -(item.quantity as i64) } else { item.quantity as i64 };
            
            conn.execute(
                "UPDATE inventory_items SET quantity_in_stock = COALESCE(quantity_in_stock, 0) + ?1 WHERE id = ?2",
                params![qty_change, item_id]
            ).map_err(|e| e.to_string())?;

            let history_id = Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO inventory_history (id, item_id, date, event_type, quantity_change, notes, related_id) 
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    history_id,
                    item_id,
                    Utc::now().to_rfc3339(),
                    if tx_type == "Sale" { "Sold" } else { "Purchased" },
                    qty_change,
                    format!("Added item to completed {} {}", tx_type, tx_num),
                    item.transaction_id,
                ],
            ).map_err(|e| e.to_string())?;
        }
    }

    recalculate_transaction_totals(&item.transaction_id)?;

    Ok(())
}

#[tauri::command]
pub fn remove_transaction_item(item_id: String, transaction_id: String) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    let item_info: Option<(String, Option<String>, i32, String, String, String)> = conn.query_row(
        "SELECT i.item_name, i.item_id, i.quantity, t.status, t.transaction_type, t.transaction_number 
         FROM transaction_items i JOIN transactions t ON i.transaction_id = t.id WHERE i.id = ?1",
        params![item_id],
        |row| Ok((row.get(0)?, row.get(1).ok(), row.get(2)?, row.get(3)?, row.get(4)?, row.get(5)?))
    ).ok();

    conn.execute("DELETE FROM transaction_items WHERE id = ?1", params![item_id])
        .map_err(|e| e.to_string())?;

    if let Some((name, id_opt, qty, status, tx_type, tx_num)) = item_info {
        if status == "Completed" {
            if let Some(id) = id_opt {
                // Reverse inventory
                let qty_change = if tx_type == "Sale" { qty as i64 } else { -(qty as i64) };
                
                conn.execute(
                    "UPDATE inventory_items SET quantity_in_stock = COALESCE(quantity_in_stock, 0) + ?1 WHERE id = ?2",
                    params![qty_change, id]
                ).map_err(|e| e.to_string())?;

                let history_id = Uuid::new_v4().to_string();
                conn.execute(
                    "INSERT INTO inventory_history (id, item_id, date, event_type, quantity_change, notes, related_id) 
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                    params![
                        history_id,
                        id,
                        Utc::now().to_rfc3339(),
                        "Adjustment",
                        qty_change,
                        format!("Removed item {} from completed {} {}", name, tx_type, tx_num),
                        transaction_id,
                    ],
                ).ok();
            }
        }
    }

    recalculate_transaction_totals(&transaction_id)?;

    Ok(())
}

#[tauri::command]
pub fn add_transaction_payment(payment: TransactionPayment) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO transaction_payments (id, transaction_id, amount, method, date, received_by, notes, session_id) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            payment.id,
            payment.transaction_id,
            payment.amount,
            payment.method,
            payment.date,
            payment.received_by,
            payment.notes,
            payment.session_id,
        ],
    ).map_err(|e| e.to_string())?;

    recalculate_transaction_totals(&payment.transaction_id)?;

    // Adjust party balance
    let tx_info: (String, String, String, String) = conn.query_row(
        "SELECT party_id, party_type, transaction_number, transaction_type FROM transactions WHERE id = ?1",
        params![payment.transaction_id],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
    ).map_err(|e| e.to_string())?;

    let (party_id, party_type, tx_num, tx_type) = tx_info;

    if party_type == "Client" {
        conn.execute(
            "UPDATE clients SET credit_balance = COALESCE(credit_balance, 0) - ?1 WHERE id = ?2",
            params![payment.amount, party_id],
        ).ok();
        
        let h_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO client_history (id, client_id, date, type, notes, amount, changed_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![h_id, party_id, Utc::now().to_rfc3339(), "Payment Received", format!("Payment for {} {}", tx_type, tx_num), -payment.amount, payment.received_by],
        ).ok();
    } else {
        conn.execute(
            "UPDATE suppliers SET credit_balance = COALESCE(credit_balance, 0) - ?1 WHERE id = ?2",
            params![payment.amount, party_id],
        ).ok();

        let h_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO supplier_history (id, supplier_id, date, type, notes, amount, changed_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![h_id, party_id, Utc::now().to_rfc3339(), "Payment Made", format!("Payment for {} {}", tx_type, tx_num), -payment.amount, payment.received_by],
        ).ok();
    }

    Ok(())
}

#[tauri::command]
pub fn complete_transaction(tx_id: String) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    let tx: Transaction = conn.query_row(
        "SELECT id, transaction_number, transaction_type, party_id, party_type, status, payment_status, total_amount, paid_amount, notes, created_at, updated_at, created_by 
         FROM transactions WHERE id = ?1",
        params![tx_id],
        |row| Ok(Transaction {
            id: row.get(0)?,
            transaction_number: row.get(1)?,
            transaction_type: row.get(2)?,
            party_id: row.get(3)?,
            party_type: row.get(4)?,
            status: row.get(5)?,
            payment_status: row.get(6)?,
            total_amount: row.get(7)?,
            paid_amount: row.get(8)?,
            notes: row.get(9).ok(),
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
            created_by: row.get(12).ok(),
        })
    ).map_err(|e| e.to_string())?;

    if tx.status == "Completed" {
        return Ok(());
    }

    // 1. Update Inventory
    let mut stmt = conn.prepare("SELECT item_id, quantity FROM transaction_items WHERE transaction_id = ?1").map_err(|e| e.to_string())?;
    let items: Vec<(Option<String>, i32)> = stmt.query_map(params![tx_id], |row| Ok((row.get(0).ok(), row.get(1)?))).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();

    for (item_id_opt, qty) in items {
        if let Some(item_id) = item_id_opt {
            let qty_change = if tx.transaction_type == "Sale" { -(qty as i64) } else { qty as i64 };
            conn.execute("UPDATE inventory_items SET quantity_in_stock = COALESCE(quantity_in_stock, 0) + ?1 WHERE id = ?2", params![qty_change, item_id]).ok();
            
            let h_id = Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO inventory_history (id, item_id, date, event_type, quantity_change, notes, related_id) 
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![h_id, item_id, Utc::now().to_rfc3339(), if tx.transaction_type == "Sale" { "Sold" } else { "Purchased" }, qty_change, format!("{} {}", tx.transaction_type, tx.transaction_number), tx.id],
            ).ok();
        }
    }

    // 2. Update Party Balance
    if tx.party_type == "Client" {
        conn.execute("UPDATE clients SET credit_balance = COALESCE(credit_balance, 0) + ?1 WHERE id = ?2", params![tx.total_amount, tx.party_id]).ok();
        let h_id = Uuid::new_v4().to_string();
        conn.execute("INSERT INTO client_history (id, client_id, date, type, notes, amount, changed_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![h_id, tx.party_id, Utc::now().to_rfc3339(), "Sale Completed", format!("Sale {}", tx.transaction_number), tx.total_amount, None::<String>]).ok();
    } else {
        conn.execute("UPDATE suppliers SET credit_balance = COALESCE(credit_balance, 0) + ?1 WHERE id = ?2", params![tx.total_amount, tx.party_id]).ok();
        let h_id = Uuid::new_v4().to_string();
        conn.execute("INSERT INTO supplier_history (id, supplier_id, date, type, notes, amount, changed_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![h_id, tx.party_id, Utc::now().to_rfc3339(), "Purchase Order Completed", format!("Order {}", tx.transaction_number), tx.total_amount, None::<String>]).ok();
    }

    // 3. Update Status
    conn.execute("UPDATE transactions SET status = 'Completed', updated_at = ?2 WHERE id = ?1", params![tx_id, Utc::now().to_rfc3339()]).map_err(|e| e.to_string())?;

    Ok(())
}

fn recalculate_transaction_totals(tx_id: &str) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    let total_amount: f64 = conn.query_row(
        "SELECT COALESCE(SUM(total_price), 0) FROM transaction_items WHERE transaction_id = ?1",
        params![tx_id],
        |row| row.get(0)
    ).unwrap_or(0.0);

    let paid_amount: f64 = conn.query_row(
        "SELECT COALESCE(SUM(amount), 0) FROM transaction_payments WHERE transaction_id = ?1",
        params![tx_id],
        |row| row.get(0)
    ).unwrap_or(0.0);

    let payment_status = if paid_amount >= total_amount {
        "Paid"
    } else if paid_amount > 0.0 {
        "Partially"
    } else {
        "Unpaid"
    };

    conn.execute(
        "UPDATE transactions SET total_amount = ?1, paid_amount = ?2, payment_status = ?3, updated_at = ?4 WHERE id = ?5",
        params![total_amount, paid_amount, payment_status, Utc::now().to_rfc3339(), tx_id]
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn submit_transaction(mut transaction: Transaction, items: Vec<TransactionItem>, payments: Vec<TransactionPayment>) -> Result<(), String> {
    let mut conn = db::get_connection().map_err(|e| e.to_string())?;
    
    // Start a manual SQL transaction
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // 1. Generate number if needed
    if transaction.transaction_number.is_empty() {
        transaction.transaction_number = generate_transaction_number_internal(&tx, &transaction.transaction_type)?;
    }

    // 2. Insert Header
    tx.execute(
        "INSERT INTO transactions (id, transaction_number, transaction_type, party_id, party_type, status, payment_status, total_amount, paid_amount, notes, created_at, updated_at, created_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![
            transaction.id,
            transaction.transaction_number,
            transaction.transaction_type,
            transaction.party_id,
            transaction.party_type,
            transaction.status,
            transaction.payment_status,
            transaction.total_amount,
            transaction.paid_amount,
            transaction.notes,
            transaction.created_at,
            transaction.updated_at,
            transaction.created_by,
        ],
    ).map_err(|e| e.to_string())?;

    // 3. Insert Items
    for item in &items {
        tx.execute(
            "INSERT INTO transaction_items (id, transaction_id, item_id, item_name, quantity, unit_price, total_price, notes) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![item.id, item.transaction_id, item.item_id, item.item_name, item.quantity, item.unit_price, item.total_price, item.notes],
        ).map_err(|e| e.to_string())?;
    }

    // 4. Insert Payments
    for payment in &payments {
        tx.execute(
            "INSERT INTO transaction_payments (id, transaction_id, amount, method, date, received_by, notes, session_id) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![payment.id, payment.transaction_id, payment.amount, payment.method, payment.date, payment.received_by, payment.notes, payment.session_id],
        ).map_err(|e| e.to_string())?;
    }

    // 5. If status is Completed, handle inventory and balance
    if transaction.status == "Completed" {
        // Inventory
        for item in &items {
            if let Some(item_id) = &item.item_id {
                let qty_change = if transaction.transaction_type == "Sale" { -(item.quantity as i64) } else { item.quantity as i64 };
                tx.execute("UPDATE inventory_items SET quantity_in_stock = COALESCE(quantity_in_stock, 0) + ?1 WHERE id = ?2", params![qty_change, item_id]).map_err(|e| e.to_string())?;
                
                let h_id = Uuid::new_v4().to_string();
                tx.execute(
                    "INSERT INTO inventory_history (id, item_id, date, event_type, quantity_change, notes, related_id) 
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                    params![h_id, item_id, Utc::now().to_rfc3339(), if transaction.transaction_type == "Sale" { "Sold" } else { "Purchased" }, qty_change, format!("{} {}", transaction.transaction_type, transaction.transaction_number), transaction.id],
                ).map_err(|e| e.to_string())?;
            }
        }

        // Party Balance
        if transaction.party_type == "Client" {
            // Increase client balance by total
            tx.execute("UPDATE clients SET credit_balance = COALESCE(credit_balance, 0) + ?1 WHERE id = ?2", params![transaction.total_amount, transaction.party_id]).map_err(|e| e.to_string())?;
            let h_id = Uuid::new_v4().to_string();
            tx.execute("INSERT INTO client_history (id, client_id, date, type, notes, amount, changed_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![h_id, transaction.party_id, Utc::now().to_rfc3339(), "Sale Completed", format!("Sale {}", transaction.transaction_number), transaction.total_amount, None::<String>]).map_err(|e| e.to_string())?;
            
            // Subtract payments from balance
            for payment in &payments {
                tx.execute("UPDATE clients SET credit_balance = COALESCE(credit_balance, 0) - ?1 WHERE id = ?2", params![payment.amount, transaction.party_id]).map_err(|e| e.to_string())?;
                let p_h_id = Uuid::new_v4().to_string();
                tx.execute("INSERT INTO client_history (id, client_id, date, type, notes, amount, changed_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                    params![p_h_id, transaction.party_id, Utc::now().to_rfc3339(), "Payment Received", format!("Payment for Sale {}", transaction.transaction_number), -payment.amount, payment.received_by]).map_err(|e| e.to_string())?;
            }
        } else {
            // Supplier
            tx.execute("UPDATE suppliers SET credit_balance = COALESCE(credit_balance, 0) + ?1 WHERE id = ?2", params![transaction.total_amount, transaction.party_id]).map_err(|e| e.to_string())?;
            let h_id = Uuid::new_v4().to_string();
            tx.execute("INSERT INTO supplier_history (id, supplier_id, date, type, notes, amount, changed_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![h_id, transaction.party_id, Utc::now().to_rfc3339(), "Purchase Order Completed", format!("Order {}", transaction.transaction_number), transaction.total_amount, None::<String>],
            ).map_err(|e| e.to_string())?;

            // Subtract payments
            for payment in &payments {
                tx.execute("UPDATE suppliers SET credit_balance = COALESCE(credit_balance, 0) - ?1 WHERE id = ?2", params![payment.amount, transaction.party_id]).map_err(|e| e.to_string())?;
                let p_h_id = Uuid::new_v4().to_string();
                tx.execute("INSERT INTO supplier_history (id, supplier_id, date, type, notes, amount, changed_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                    params![p_h_id, transaction.party_id, Utc::now().to_rfc3339(), "Payment Made", format!("Payment for Purchase {}", transaction.transaction_number), -payment.amount, payment.received_by]).map_err(|e| e.to_string())?;
            }
        }
    }

    // 6. Log History
    let h_id = Uuid::new_v4().to_string();
    tx.execute(
        "INSERT INTO transaction_history (id, transaction_id, date, event_type, details, changed_by)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![h_id, transaction.id, Utc::now().to_rfc3339(), if transaction.status == "Completed" { "completed" } else { "created_draft" }, format!("{} {} {}", transaction.transaction_type, transaction.transaction_number, transaction.status), transaction.created_by],
    ).map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}
