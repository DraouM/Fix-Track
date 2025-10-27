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

    // Repairs tables (normalized)
    // Repairs main table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS repairs (
            id TEXT PRIMARY KEY,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            device_brand TEXT NOT NULL,
            device_model TEXT NOT NULL,
            issue_description TEXT NOT NULL,
            estimated_cost REAL NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('Pending','In Progress','Completed','Delivered')),
            payment_status TEXT NOT NULL CHECK(payment_status IN ('Unpaid','Partially Paid','Paid','Refunded')),
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Repair payments (supports multiple/partial payments)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS repair_payments (
            id TEXT PRIMARY KEY,
            repair_id TEXT NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            method TEXT NOT NULL,
            received_by TEXT,
            FOREIGN KEY(repair_id) REFERENCES repairs(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Parts used in repair (linked to inventory if needed later)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS repair_used_parts (
            id TEXT PRIMARY KEY,
            repair_id TEXT NOT NULL,
            part_id TEXT NOT NULL,
            part_name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            FOREIGN KEY(repair_id) REFERENCES repairs(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // History table for tracking repair lifecycle
    conn.execute(
        "CREATE TABLE IF NOT EXISTS repair_history (
            id TEXT PRIMARY KEY,
            repair_id TEXT NOT NULL,
            date TEXT NOT NULL,
            event_type TEXT NOT NULL CHECK(event_type IN ('status_change','payment_added','part_added','note')),
            details TEXT NOT NULL,
            changed_by TEXT,
            FOREIGN KEY(repair_id) REFERENCES repairs(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Suppliers table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS suppliers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            contact_name TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            notes TEXT,
            preferred_payment_method TEXT,
            credit_balance REAL,
            active INTEGER NOT NULL DEFAULT 1, -- 1 for active, 0 for inactive
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;
    // Supplier payments table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS supplier_payments (
            id TEXT PRIMARY KEY,
            supplier_id TEXT NOT NULL,
            amount REAL NOT NULL,
            method TEXT NOT NULL,
            date TEXT NOT NULL,
            notes TEXT,
            FOREIGN KEY(supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
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
