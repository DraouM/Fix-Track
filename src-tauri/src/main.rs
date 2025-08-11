// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;

use db::inventory::{
    delete_item, get_history_for_item, get_item_by_id, get_items, get_low_stock_items,
    insert_history_event, insert_item, search_items, update_item, update_item_quantity,
};
use db::schema;

fn main() {
    // Initialize database path
    db::init_db_path();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            schema::init_database,
            insert_item,
            get_items,
            get_item_by_id,
            update_item,
            delete_item,
            update_item_quantity,
            get_low_stock_items,
            search_items,
            insert_history_event,
            get_history_for_item,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
