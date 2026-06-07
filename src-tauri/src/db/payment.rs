use crate::db;
use crate::db::models::UnifiedPayment;
use rusqlite::Result;

#[tauri::command]
pub fn get_all_payments() -> Result<Vec<UnifiedPayment>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;

    let mut payments = Vec::new();

    // 1. Repair Payments
    let mut stmt = conn.prepare(
        "SELECT p.id, p.repair_id, 'Repair', p.amount, p.date, p.method, p.received_by, NULL, r.code, r.customer_name
         FROM repair_payments p
         JOIN repairs r ON p.repair_id = r.id"
    ).map_err(|e| e.to_string())?;
    
    let repair_payments = stmt.query_map([], |row| {
        Ok(UnifiedPayment {
            id: row.get(0)?,
            source_id: row.get(1)?,
            source_type: row.get(2)?,
            amount: row.get(3)?,
            date: row.get(4)?,
            method: row.get(5)?,
            received_by: row.get(6).ok(),
            notes: row.get(7).ok(),
            source_number: row.get(8).ok(),
            party_name: row.get(9).ok(),
        })
    }).map_err(|e| e.to_string())?;

    for p in repair_payments {
        if let Ok(payment) = p {
            payments.push(payment);
        }
    }

    // 2. Transaction Payments (Sales & Purchases)
    let mut stmt = conn.prepare(
        "SELECT p.id, p.transaction_id, t.transaction_type, p.amount, p.date, p.method, p.received_by, p.notes, t.transaction_number, 
         CASE 
            WHEN t.party_type = 'Client' THEN (SELECT name FROM clients WHERE id = t.party_id)
            WHEN t.party_type = 'Supplier' THEN (SELECT name FROM suppliers WHERE id = t.party_id)
            ELSE 'Unknown'
         END as party_name
         FROM transaction_payments p
         JOIN transactions t ON p.transaction_id = t.id"
    ).map_err(|e| e.to_string())?;

    let tx_payments = stmt.query_map([], |row| {
        Ok(UnifiedPayment {
            id: row.get(0)?,
            source_id: row.get(1)?,
            source_type: row.get(2)?,
            amount: row.get(3)?,
            date: row.get(4)?,
            method: row.get(5)?,
            received_by: row.get(6).ok(),
            notes: row.get(7).ok(),
            source_number: row.get(8).ok(),
            party_name: row.get(9).ok(),
        })
    }).map_err(|e| e.to_string())?;

    for p in tx_payments {
        if let Ok(payment) = p {
            payments.push(payment);
        }
    }

    // 3. Client Standalone Payments
    let mut stmt = conn.prepare(
        "SELECT p.id, p.client_id, 'Client', p.amount, p.date, p.method, NULL, p.notes, NULL, c.name
         FROM client_payments p
         JOIN clients c ON p.client_id = c.id"
    ).map_err(|e| e.to_string())?;

    let client_payments = stmt.query_map([], |row| {
        Ok(UnifiedPayment {
            id: row.get(0)?,
            source_id: row.get(1)?,
            source_type: row.get(2)?,
            amount: row.get(3)?,
            date: row.get(4)?,
            method: row.get(5)?,
            received_by: row.get(6).ok(),
            notes: row.get(7).ok(),
            source_number: row.get(8).ok(),
            party_name: row.get(9).ok(),
        })
    }).map_err(|e| e.to_string())?;

    for p in client_payments {
        if let Ok(payment) = p {
            payments.push(payment);
        }
    }

    // 4. Supplier Standalone Payments
    let mut stmt = conn.prepare(
        "SELECT p.id, p.supplier_id, 'Supplier', p.amount, p.date, p.method, NULL, p.notes, NULL, s.name
         FROM supplier_payments p
         JOIN suppliers s ON p.supplier_id = s.id"
    ).map_err(|e| e.to_string())?;

    let supplier_payments = stmt.query_map([], |row| {
        Ok(UnifiedPayment {
            id: row.get(0)?,
            source_id: row.get(1)?,
            source_type: row.get(2)?,
            amount: row.get(3)?,
            date: row.get(4)?,
            method: row.get(5)?,
            received_by: row.get(6).ok(),
            notes: row.get(7).ok(),
            source_number: row.get(8).ok(),
            party_name: row.get(9).ok(),
        })
    }).map_err(|e| e.to_string())?;

    for p in supplier_payments {
        if let Ok(payment) = p {
            payments.push(payment);
        }
    }

    // Sort by date descending
    payments.sort_by(|a, b| b.date.cmp(&a.date));

    Ok(payments)
}
