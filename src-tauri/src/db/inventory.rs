// Inventory table logic will go here.
use crate::db;
use rusqlite::{params, Result};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
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

#[tauri::command]
pub fn init_inventory_table() -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS inventory_items (
            id TEXT PRIMARY KEY,
            item_name TEXT NOT NULL,
            phone_brand TEXT NOT NULL,
            item_type TEXT NOT NULL,
            buying_price REAL NOT NULL,
            selling_price REAL NOT NULL,
            quantity_in_stock INTEGER,
            low_stock_threshold INTEGER,
            supplier_info TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

// Add more CRUD functions like insert_item(), get_items() etc.
#[tauri::command]
pub fn insert_item(item: InventoryItem) -> Result<(), String> {
    let conn = db::get_connection().map_err(|e| e.to_string())?;
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
