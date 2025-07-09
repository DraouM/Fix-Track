// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rusqlite::{params, Connection, Result};
use tauri::command;

mod db;

use db::client;
use db::get_connection;
use db::inventory::{
    delete_item, get_item_by_id, get_items, init_inventory_table, insert_item, update_item,
};

pub fn init_table(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS client (
            id INTEGER PRIMARY KEY,
            name TEXT,
            email TEXT
        )",
        [],
    )?;
    Ok(())
}

pub fn add_client_db(conn: &Connection, name: &str, email: &str) -> Result<()> {
    conn.execute(
        "INSERT INTO client (name, email) VALUES (?1, ?2)",
        params![name, email],
    )?;
    Ok(())
}

#[command]
fn init_db() -> Result<(), String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    client::init_table(&conn).map_err(|e| e.to_string())?;
    // Call other table initializations as needed
    Ok(())
}

#[command]
fn add_client(name: String, email: String) -> Result<(), String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    client::add_client(&conn, &name, &email).map_err(|e| e.to_string())?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            add_client,
            init_db,
            get_items,
            insert_item,
            update_item,
            delete_item,
            get_item_by_id,
            init_inventory_table,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
