// Technicians (repair technicians / réparateurs) CRUD
use rusqlite::{params, Connection};

use crate::db::models::Technician;

fn map_technician_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<Technician> {
    Ok(Technician {
        id: row.get(0)?,
        name: row.get(1)?,
        phone: row.get(2).ok(),
        specialties: row.get(3).ok(),
        active: row.get::<_, bool>(4).unwrap_or(true),
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
    })
}

/// Fetch all technicians (active first, then by name)
#[tauri::command]
pub fn get_technicians() -> Result<Vec<Technician>, String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, name, phone, specialties, active, created_at, updated_at
             FROM technicians
             ORDER BY active DESC, name COLLATE NOCASE ASC",
        )
        .map_err(|e| e.to_string())?;
    let technicians = stmt
        .query_map([], map_technician_row)
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();
    Ok(technicians)
}

/// Create a new technician
#[tauri::command]
pub fn insert_technician(technician: Technician) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO technicians (id, name, phone, specialties, active, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), datetime('now'))",
        params![
            technician.id,
            technician.name,
            technician.phone,
            technician.specialties,
            technician.active,
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Update a technician (rename, phone, activate/deactivate)
#[tauri::command]
pub fn update_technician(technician: Technician) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE technicians SET name = ?2, phone = ?3, specialties = ?4, active = ?5, updated_at = datetime('now')
         WHERE id = ?1",
        params![
            technician.id,
            technician.name,
            technician.phone,
            technician.specialties,
            technician.active,
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Count repairs currently assigned to a technician
/// (owned String: params! requires 'static values, not borrowed &str)
fn count_assigned_repairs(conn: &Connection, technician_id: String) -> Result<i64, String> {
    conn.query_row(
        "SELECT COUNT(*) FROM repairs WHERE technician_id = ?1",
        params![technician_id],
        |row| row.get(0),
    )
    .map_err(|e| e.to_string())
}

/// Delete a technician. Soft-deactivates when the technician still has
/// assigned repairs (matching the inventory/supplier soft-delete convention),
/// otherwise hard-deletes the record.
#[tauri::command]
pub fn delete_technician(id: String) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    let assigned = count_assigned_repairs(&conn, id.clone())?;
    if assigned > 0 {
        conn.execute(
            "UPDATE technicians SET active = 0, updated_at = datetime('now') WHERE id = ?1",
            params![id],
        )
        .map_err(|e| e.to_string())?;
    } else {
        conn.execute("DELETE FROM technicians WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Re-assign or unassign all repairs from a technician (used when
/// deactivating with the "reassign to Unassigned" option).
#[tauri::command]
pub fn unassign_technician_repairs(id: String) -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE repairs SET technician_id = NULL, updated_at = datetime('now') WHERE technician_id = ?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
