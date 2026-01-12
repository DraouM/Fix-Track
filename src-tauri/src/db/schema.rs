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
            barcode TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Migration: Add barcode column to inventory_items if it doesn't exist
    let _ = conn.execute("ALTER TABLE inventory_items ADD COLUMN barcode TEXT", []);

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
            payment_status TEXT NOT NULL CHECK(payment_status IN ('Unpaid','Partially','Paid','Refunded')),
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Migration: Update status from 'Partially Paid' to 'Partially' for consistency
    let _ = conn.execute("UPDATE repairs SET payment_status = 'Partially' WHERE payment_status = 'Partially Paid'", []);

    // Migration: Add code column if it doesn't exist
    // We try to add it, ignoring error if it exists (simplest migration for SQLite without dedicated migration tool)
    let _ = conn.execute("ALTER TABLE repairs ADD COLUMN code TEXT", []);

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

    // Supplier history table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS supplier_history (
            id TEXT PRIMARY KEY,
            supplier_id TEXT NOT NULL,
            date TEXT NOT NULL,
            type TEXT NOT NULL,
            notes TEXT,
            amount REAL,
            changed_by TEXT,
            FOREIGN KEY(supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Orders tables
    conn.execute(
        "CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            order_number TEXT NOT NULL UNIQUE,
            supplier_id TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('draft','completed')),
            payment_status TEXT NOT NULL CHECK(payment_status IN ('unpaid','partial','paid')),
            total_amount REAL NOT NULL DEFAULT 0,
            paid_amount REAL NOT NULL DEFAULT 0,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT,
            FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS order_items (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            item_id TEXT,
            item_name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            total_price REAL NOT NULL,
            notes TEXT,
            FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY(item_id) REFERENCES inventory_items(id)
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS order_payments (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            amount REAL NOT NULL,
            method TEXT NOT NULL,
            date TEXT NOT NULL,
            received_by TEXT,
            notes TEXT,
            FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS order_history (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            date TEXT NOT NULL,
            event_type TEXT NOT NULL CHECK(event_type IN ('created','completed','payment_added','item_added','item_removed','updated')),
            details TEXT NOT NULL,
            changed_by TEXT,
            FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Indexes for orders
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_orders_supplier ON orders(supplier_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_order_items_item ON order_items(item_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_order_payments_order ON order_payments(order_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_order_history_order ON order_history(order_id)",
        [],
    )?;

    // Sales table (Simplified version existed, upgrading it or keeping for legacy if needed)
    // conn.execute("CREATE TABLE IF NOT EXISTS sales ...", [])?;

    // Clients table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS clients (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            contact_name TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            notes TEXT,
            credit_balance REAL,
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Client payments table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS client_payments (
            id TEXT PRIMARY KEY,
            client_id TEXT NOT NULL,
            amount REAL NOT NULL,
            method TEXT NOT NULL,
            date TEXT NOT NULL,
            notes TEXT,
            FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Client history table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS client_history (
            id TEXT PRIMARY KEY,
            client_id TEXT NOT NULL,
            date TEXT NOT NULL,
            type TEXT NOT NULL,
            notes TEXT,
            amount REAL,
            changed_by TEXT,
            FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Full Sales tables (replacing/upgrading the simple 'sales' table)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS customer_sales (
            id TEXT PRIMARY KEY,
            sale_number TEXT NOT NULL UNIQUE,
            client_id TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('draft','completed')),
            payment_status TEXT NOT NULL CHECK(payment_status IN ('unpaid','partial','paid')),
            total_amount REAL NOT NULL DEFAULT 0,
            paid_amount REAL NOT NULL DEFAULT 0,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT,
            FOREIGN KEY(client_id) REFERENCES clients(id)
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS sale_items (
            id TEXT PRIMARY KEY,
            sale_id TEXT NOT NULL,
            item_id TEXT,
            item_name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            total_price REAL NOT NULL,
            notes TEXT,
            FOREIGN KEY(sale_id) REFERENCES customer_sales(id) ON DELETE CASCADE,
            FOREIGN KEY(item_id) REFERENCES inventory_items(id)
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS sale_payments (
            id TEXT PRIMARY KEY,
            sale_id TEXT NOT NULL,
            amount REAL NOT NULL,
            method TEXT NOT NULL,
            date TEXT NOT NULL,
            received_by TEXT,
            notes TEXT,
            FOREIGN KEY(sale_id) REFERENCES customer_sales(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS sale_history (
            id TEXT PRIMARY KEY,
            sale_id TEXT NOT NULL,
            date TEXT NOT NULL,
            event_type TEXT NOT NULL CHECK(event_type IN ('created','completed','payment_added','item_added','item_removed','updated')),
            details TEXT NOT NULL,
            changed_by TEXT,
            FOREIGN KEY(sale_id) REFERENCES customer_sales(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Indexes for sales
    conn.execute("CREATE INDEX IF NOT EXISTS idx_sales_client ON customer_sales(client_id)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_sales_status ON customer_sales(status)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_sale_payments_sale ON sale_payments(sale_id)", [])?;

    // Keep legacy sales table for now to avoid breaking existing data if any
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

    // Daily Sessions table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS daily_sessions (
            id TEXT PRIMARY KEY,
            start_time TEXT NOT NULL,
            end_time TEXT,
            opening_balance REAL NOT NULL,
            closing_balance REAL,
            counted_amount REAL,
            withdrawal_amount REAL,
            status TEXT NOT NULL CHECK(status IN ('open','closed')),
            notes TEXT,
            created_by TEXT
        )",
        [],
    )?;

    // Expenses table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY,
            amount REAL NOT NULL,
            reason TEXT NOT NULL,
            date TEXT NOT NULL,
            session_id TEXT,
            category TEXT,
            created_by TEXT,
            FOREIGN KEY(session_id) REFERENCES daily_sessions(id)
        )",
        [],
    )?;

    // Unified Transactions tables
    conn.execute(
        "CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            transaction_number TEXT NOT NULL UNIQUE,
            transaction_type TEXT NOT NULL CHECK(transaction_type IN ('Sale','Purchase')),
            party_id TEXT NOT NULL,
            party_type TEXT NOT NULL CHECK(party_type IN ('Client','Supplier')),
            status TEXT NOT NULL CHECK(status IN ('Draft','Completed','Cancelled')),
            payment_status TEXT NOT NULL CHECK(payment_status IN ('Unpaid','Partially','Paid')),
            total_amount REAL NOT NULL DEFAULT 0,
            paid_amount REAL NOT NULL DEFAULT 0,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS transaction_items (
            id TEXT PRIMARY KEY,
            transaction_id TEXT NOT NULL,
            item_id TEXT,
            item_name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            total_price REAL NOT NULL,
            notes TEXT,
            FOREIGN KEY(transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
            FOREIGN KEY(item_id) REFERENCES inventory_items(id)
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS transaction_payments (
            id TEXT PRIMARY KEY,
            transaction_id TEXT NOT NULL,
            amount REAL NOT NULL,
            method TEXT NOT NULL,
            date TEXT NOT NULL,
            received_by TEXT,
            notes TEXT,
            session_id TEXT,
            FOREIGN KEY(transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
            FOREIGN KEY(session_id) REFERENCES daily_sessions(id)
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS transaction_history (
            id TEXT PRIMARY KEY,
            transaction_id TEXT NOT NULL,
            date TEXT NOT NULL,
            event_type TEXT NOT NULL,
            details TEXT NOT NULL,
            changed_by TEXT,
            FOREIGN KEY(transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Indexes for transactions
    conn.execute("CREATE INDEX IF NOT EXISTS idx_transactions_party ON transactions(party_id)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_transaction_items_tx ON transaction_items(transaction_id)", [])?;
    conn.execute("CREATE INDEX IF NOT EXISTS idx_transaction_payments_tx ON transaction_payments(transaction_id)", [])?;

    // Migrations to add session_id to payment tables (ignore errors if column exists)
    let _ = conn.execute("ALTER TABLE sale_payments ADD COLUMN session_id TEXT", []);
    let _ = conn.execute("ALTER TABLE repair_payments ADD COLUMN session_id TEXT", []);
    let _ = conn.execute("ALTER TABLE order_payments ADD COLUMN session_id TEXT", []);
    let _ = conn.execute("ALTER TABLE client_payments ADD COLUMN session_id TEXT", []);
    let _ = conn.execute("ALTER TABLE supplier_payments ADD COLUMN session_id TEXT", []);

    Ok(())
}

#[tauri::command]
pub fn init_database() -> Result<(), String> {
    let conn = crate::db::get_connection().map_err(|e| e.to_string())?;
    init_all_tables(&conn).map_err(|e| e.to_string())?;
    Ok(())
}
