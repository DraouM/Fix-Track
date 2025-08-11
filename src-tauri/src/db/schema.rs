use rusqlite::{Connection, Result};

pub fn init_all_tables(conn: &Connection) -> Result<()> {
    // Inventory tables
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
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS inventory_history (
            id TEXT PRIMARY KEY,
            item_id TEXT NOT NULL,
            date TEXT NOT NULL,
            event_type TEXT NOT NULL,
            quantity_change INTEGER NOT NULL,
            notes TEXT,
            related_id TEXT,
            FOREIGN KEY(item_id) REFERENCES inventory_items(id)
        )",
        [],
    )?;

    // Repairs table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS repairs (
            id TEXT PRIMARY KEY,
            customer_name TEXT NOT NULL,
            phone_model TEXT NOT NULL,
            issue_description TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            cost REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME
        )",
        [],
    )?;

    // Sales table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sales (
            id TEXT PRIMARY KEY,
            item_id TEXT,
            customer_name TEXT,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            total_price REAL NOT NULL,
            sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(item_id) REFERENCES inventory_items(id)
        )",
        [],
    )?;

    Ok(())
}

#[tauri::command]
pub fn init_database() -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    init_all_tables(&conn).map_err(|e| e.to_string())?;
    Ok(())
}
