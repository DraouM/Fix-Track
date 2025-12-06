pub mod inventory;
pub mod models;
pub mod repair;
pub mod schema;
pub mod supplier;

use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::sync::Mutex;

lazy_static::lazy_static! {
    static ref DB_PATH: Mutex<PathBuf> = Mutex::new(PathBuf::new());
}

/// Initialize the database path.
/// For a Tauri app, you could use tauri::api::path::app_data_dir to get a platform-safe location.
pub fn init_db_path() {
    let app_dir = PathBuf::from("../"); // Change to Tauri app_data_dir if needed
    let db_path = app_dir.join("fixary.db");

    let mut path = DB_PATH.lock().unwrap();
    *path = db_path;
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
