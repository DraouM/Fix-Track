use crate::db::models::ClientHistoryEvent;
use serde::{Deserialize, Serialize};
use rusqlite::params;

#[derive(Debug, Serialize, Deserialize)]
pub struct ClientFrontend {
    pub id: String,
    pub name: String,
    pub contact_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
    pub outstanding_balance: f64,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[tauri::command]
pub fn get_clients() -> Result<Vec<ClientFrontend>, String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, contact_name, email, phone, address, notes, credit_balance, active, created_at, updated_at FROM clients")
        .map_err(|e| e.to_string())?;
    
    let clients = stmt
        .query_map([], |row| {
            let active: i32 = row.get(8)?;
            Ok(ClientFrontend {
                id: row.get(0)?,
                name: row.get(1)?,
                contact_name: row.get(2).ok(),
                email: row.get(3).ok(),
                phone: row.get(4).ok(),
                address: row.get(5).ok(),
                notes: row.get(6).ok(),
                outstanding_balance: row.get(7).unwrap_or(0.0),
                status: if active == 1 { "active".to_string() } else { "inactive".to_string() },
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();
    
    Ok(clients)
}

#[tauri::command]
pub fn get_client_by_id(client_id: String) -> Result<Option<ClientFrontend>, String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, contact_name, email, phone, address, notes, credit_balance, active, created_at, updated_at FROM clients WHERE id = ?1")
        .map_err(|e| e.to_string())?;
    
    let client = stmt.query_row(params![client_id], |row| {
        let active: i32 = row.get(8)?;
        Ok(ClientFrontend {
            id: row.get(0)?,
            name: row.get(1)?,
            contact_name: row.get(2).ok(),
            email: row.get(3).ok(),
            phone: row.get(4).ok(),
            address: row.get(5).ok(),
            notes: row.get(6).ok(),
            outstanding_balance: row.get(7).unwrap_or(0.0),
            status: if active == 1 { "active".to_string() } else { "inactive".to_string() },
            created_at: row.get(9)?,
            updated_at: row.get(10)?,
        })
    }).ok();

    Ok(client)
}

#[tauri::command]
pub fn insert_client(client: ClientFrontend) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO clients (id, name, contact_name, email, phone, address, notes, credit_balance, active, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            client.id,
            client.name,
            client.contact_name,
            client.email,
            client.phone,
            client.address,
            client.notes,
            client.outstanding_balance,
            if client.status == "active" { 1 } else { 0 },
            client.created_at,
            client.updated_at
        ],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_client(client: ClientFrontend) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE clients SET name = ?2, contact_name = ?3, email = ?4, phone = ?5, address = ?6, notes = ?7, active = ?8, updated_at = ?9 WHERE id = ?1",
        params![
            client.id,
            client.name,
            client.contact_name,
            client.email,
            client.phone,
            client.address,
            client.notes,
            if client.status == "active" { 1 } else { 0 },
            chrono::Utc::now().to_rfc3339()
        ],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_client(client_id: String) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM clients WHERE id = ?1", params![client_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn add_client_payment(
    id: String,
    client_id: String,
    amount: f64,
    method: String,
    notes: Option<String>,
) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO client_payments (id, client_id, amount, method, date, notes) VALUES (?1, ?2, ?3, ?4, datetime('now'), ?5)",
        params![id, client_id, amount, method, notes],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn adjust_client_balance(
    client_id: String,
    amount: f64,
    notes: Option<String>,
) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE clients SET credit_balance = COALESCE(credit_balance, 0) + ?1 WHERE id = ?2",
        params![amount, client_id],
    )
    .map_err(|e| e.to_string())?;

    if amount.abs() > 0.001 {
        let history_id = uuid::Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO client_history (id, client_id, date, type, notes, amount)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                history_id,
                client_id,
                chrono::Utc::now().to_rfc3339(),
                "Balance Adjusted",
                notes.unwrap_or_else(|| "Manual entry".to_string()),
                amount,
            ],
        ).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn get_client_history(client_id: String) -> Result<Vec<ClientHistoryEvent>, String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, client_id, date, type, notes, amount FROM client_history WHERE client_id = ?1 ORDER BY date DESC")
        .map_err(|e| e.to_string())?;
    
    let history = stmt
        .query_map(params![client_id], |row| {
            Ok(ClientHistoryEvent {
                id: row.get(0)?,
                client_id: row.get(1)?,
                date: row.get(2)?,
                event_type: row.get(3)?,
                notes: row.get(4).ok(),
                amount: row.get::<_, f64>(5).unwrap_or(0.0),
                changed_by: None,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();
    
    Ok(history)
}

#[tauri::command]
pub fn insert_client_history(event: ClientHistoryEvent) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO client_history (id, client_id, date, type, notes, amount) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            event.id,
            event.client_id,
            event.date,
            event.event_type,
            event.notes,
            event.amount,
        ],
    ).map_err(|e| e.to_string())?;
    Ok(())
}
