// Inventory table logic will go here.
use crate::db;
use rusqlite::{params, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct InventoryItem {
    pub id: String,
    pub item_name: String,
    pub phone_brand: String,
    pub item_type: String,
    pub buying_price: f64,
    pub selling_price: f64,
    pub quantity_in_stock: Option<i64>,
    pub low_stock_threshold: Option<i64>,
    pub supplier_info: Option<String>,
}

// #[tauri::command]
// pub fn init_inventory_table() -> Result<(), String> {
//     let conn = db::get_connection().map_err(|e| e.to_string())?;
//     conn.execute(
//         "CREATE TABLE IF NOT EXISTS inventory_items (
//             id TEXT PRIMARY KEY,
//             item_name TEXT NOT NULL,
//             phone_brand TEXT NOT NULL,
//             item_type TEXT NOT NULL,
//             buying_price REAL NOT NULL,
//             selling_price REAL NOT NULL,
//             quantity_in_stock INTEGER,
//             low_stock_threshold INTEGER,
//             supplier_info TEXT,
//             created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//         )",
//         [],
//     )
//     .map_err(|e| e.to_string())?;

//     Ok(())
// }

// Add more CRUD functions like insert_item(), get_items() etc.
#[tauri::command]
pub fn insert_item(item: InventoryItem) -> Result<(), String> {
    println!("Attempting to insert item: {:?}", item);

    // Make sure this doesn't panic
    let conn = match crate::db::get_connection() {
        Ok(conn) => conn,
        Err(e) => return Err(format!("Database connection failed: {}", e)),
    };

    conn.execute(
        "INSERT INTO inventory_items (id, item_name, phone_brand, item_type, buying_price, selling_price, quantity_in_stock, low_stock_threshold, supplier_info) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            item.id,
            item.item_name,
            item.phone_brand,
            item.item_type,
            item.buying_price,
            item.selling_price,
            item.quantity_in_stock,
            item.low_stock_threshold,
            item.supplier_info
        ],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_items() -> Result<Vec<InventoryItem>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, item_name, phone_brand, item_type, buying_price, selling_price, quantity_in_stock, low_stock_threshold, supplier_info FROM inventory_items").map_err(|e| e.to_string())?;
    let items = stmt
        .query_map([], |row| {
            Ok(InventoryItem {
                id: row.get(0)?,
                item_name: row.get(1)?,
                phone_brand: row.get(2)?,
                item_type: row.get(3)?,
                buying_price: row.get(4)?,
                selling_price: row.get(5)?,
                quantity_in_stock: row.get(6).ok(),
                low_stock_threshold: row.get(7).ok(),
                supplier_info: row.get(8).ok(),
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();
    Ok(items)
}

#[tauri::command]
pub fn get_item_by_id(item_id: String) -> Result<Option<InventoryItem>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, item_name, phone_brand, item_type, buying_price, selling_price, quantity_in_stock, low_stock_threshold, supplier_info FROM inventory_items WHERE id = ?1").map_err(|e| e.to_string())?;
    let mut rows = stmt.query(params![item_id]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        Ok(Some(InventoryItem {
            id: row.get(0).map_err(|e| e.to_string())?,
            item_name: row.get(1).map_err(|e| e.to_string())?,
            phone_brand: row.get(2).map_err(|e| e.to_string())?,
            item_type: row.get(3).map_err(|e| e.to_string())?,
            buying_price: row.get(4).map_err(|e| e.to_string())?,
            selling_price: row.get(5).map_err(|e| e.to_string())?,
            quantity_in_stock: row.get(6).ok(),
            low_stock_threshold: row.get(7).ok(),
            supplier_info: row.get(8).ok(),
        }))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn update_item(item: InventoryItem) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE inventory_items SET item_name = ?2, phone_brand = ?3, item_type = ?4, buying_price = ?5, selling_price = ?6, quantity_in_stock = ?7, low_stock_threshold = ?8, supplier_info = ?9 WHERE id = ?1",
        params![
            item.id,
            item.item_name,
            item.phone_brand,
            item.item_type,
            item.buying_price,
            item.selling_price,
            item.quantity_in_stock,
            item.low_stock_threshold,
            item.supplier_info
        ],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_item(item_id: String) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "DELETE FROM inventory_items WHERE id = ?1",
        params![item_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_item_quantity(item_id: String, new_quantity: i64) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE inventory_items SET quantity_in_stock = ?2 WHERE id = ?1",
        params![item_id, new_quantity],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_low_stock_items() -> Result<Vec<InventoryItem>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, item_name, phone_brand, item_type, buying_price, selling_price, quantity_in_stock, low_stock_threshold, supplier_info 
         FROM inventory_items 
         WHERE quantity_in_stock IS NOT NULL 
         AND low_stock_threshold IS NOT NULL 
         AND quantity_in_stock <= low_stock_threshold"
    ).map_err(|e| e.to_string())?;

    let items = stmt
        .query_map([], |row| {
            Ok(InventoryItem {
                id: row.get(0)?,
                item_name: row.get(1)?,
                phone_brand: row.get(2)?,
                item_type: row.get(3)?,
                buying_price: row.get(4)?,
                selling_price: row.get(5)?,
                quantity_in_stock: row.get(6).ok(),
                low_stock_threshold: row.get(7).ok(),
                supplier_info: row.get(8).ok(),
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();
    Ok(items)
}

#[tauri::command]
pub fn search_items(query: String) -> Result<Vec<InventoryItem>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    let search_pattern = format!("%{}%", query);
    let mut stmt = conn.prepare(
        "SELECT id, item_name, phone_brand, item_type, buying_price, selling_price, quantity_in_stock, low_stock_threshold, supplier_info 
         FROM inventory_items 
         WHERE item_name LIKE ?1 OR phone_brand LIKE ?1 OR item_type LIKE ?1"
    ).map_err(|e| e.to_string())?;

    let items = stmt
        .query_map(params![search_pattern], |row| {
            Ok(InventoryItem {
                id: row.get(0)?,
                item_name: row.get(1)?,
                phone_brand: row.get(2)?,
                item_type: row.get(3)?,
                buying_price: row.get(4)?,
                selling_price: row.get(5)?,
                quantity_in_stock: row.get(6).ok(),
                low_stock_threshold: row.get(7).ok(),
                supplier_info: row.get(8).ok(),
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();
    Ok(items)
}

#[derive(Serialize, Deserialize)]
pub struct InventoryHistoryEvent {
    pub id: String,
    pub item_id: String,
    pub date: String,       // ISO string
    pub event_type: String, // e.g., Purchased, Used in Repair, etc.
    pub quantity_change: i64,
    pub notes: Option<String>,
    pub related_id: Option<String>,
}

// #[tauri::command]
// pub fn init_history_table() -> Result<(), String> {
//     let conn = db::get_connection().map_err(|e| e.to_string())?;
//     conn.execute(
//         "CREATE TABLE IF NOT EXISTS inventory_history (
//             id TEXT PRIMARY KEY,
//             item_id TEXT NOT NULL,
//             date TEXT NOT NULL,
//             event_type TEXT NOT NULL,
//             quantity_change INTEGER NOT NULL,
//             notes TEXT,
//             related_id TEXT,
//             FOREIGN KEY(item_id) REFERENCES inventory_items(id)
//         )",
//         [],
//     )
//     .map_err(|e| e.to_string())?;
//     Ok(())
// }

#[tauri::command]
pub fn insert_history_event(event: InventoryHistoryEvent) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO inventory_history (id, item_id, date, event_type, quantity_change, notes, related_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            event.id,
            event.item_id,
            event.date,
            event.event_type,
            event.quantity_change,
            event.notes,
            event.related_id
        ],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_history_for_item(item_id: String) -> Result<Vec<InventoryHistoryEvent>, String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, item_id, date, event_type, quantity_change, notes, related_id FROM inventory_history WHERE item_id = ?1 ORDER BY date DESC"
    ).map_err(|e| e.to_string())?;
    let events = stmt
        .query_map(params![item_id], |row| {
            Ok(InventoryHistoryEvent {
                id: row.get(0)?,
                item_id: row.get(1)?,
                date: row.get(2)?,
                event_type: row.get(3)?,
                quantity_change: row.get(4)?,
                notes: row.get(5).ok(),
                related_id: row.get(6).ok(),
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|res| res.ok())
        .collect();
    Ok(events)
}
