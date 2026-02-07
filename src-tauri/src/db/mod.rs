pub mod inventory;
pub mod models;
pub mod repair;
pub mod schema;
pub mod supplier;
pub mod order;
pub mod client;
pub mod sale;
pub mod expense;
pub mod session;
pub mod transaction;
pub mod dashboard;
pub mod task;

use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::sync::Mutex;

lazy_static::lazy_static! {
    static ref DB_PATH: Mutex<PathBuf> = Mutex::new(PathBuf::new());
}

/// Initialize the database path.
/// For a Tauri app, we use platform-safe application data location.
pub fn init_db_path() {
    let db_path = if cfg!(debug_assertions) {
        // In development, keep it in the project root for easy access
        PathBuf::from("fixary.db")
    } else {
        // In production, use the platform's local data directory
        let mut path = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
        path.push("Fixary");
        // Ensure the directory exists
        let _ = std::fs::create_dir_all(&path);
        path.push("fixary.db");
        path
    };

    let mut path_lock = DB_PATH.lock().unwrap();
    *path_lock = db_path;
}

/// Get the current DB path.
fn current_db_path() -> PathBuf {
    DB_PATH.lock().unwrap().clone()
}

/// Open a connection to the SQLite database.
pub fn get_connection() -> Result<Connection> {
    let path = current_db_path();

    // Ensure the directory exists
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).unwrap();
    }

    let conn = Connection::open(&path)?;
    // Enable WAL mode to improve concurrency
    conn.pragma_update(None, "journal_mode", "WAL")?;
    Ok(conn)
}
