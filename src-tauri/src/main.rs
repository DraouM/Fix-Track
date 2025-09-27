// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;

use db::inventory::{
    delete_item, get_history_for_item, get_item_by_id, get_items, get_low_stock_items,
    insert_history_event, insert_item, search_items, update_item, update_item_quantity,
};
use db::repair::{
    add_payment, add_used_part, delete_repair, get_history_for_repair, get_payments_for_repair,
    get_repair_by_id, get_repairs, get_used_parts_for_repair, insert_repair, insert_repair_history,
    update_repair, update_repair_status,
};
use db::schema;

fn main() {
    // Initialize database path
    db::init_db_path();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            schema::init_database,
            // INVENTORY
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
            // REPAIRS
            insert_repair,
            get_repairs,
            get_repair_by_id,
            update_repair,
            update_repair_status,
            //Removed update_payment_status as it's now automatically calculated
            delete_repair,
            add_payment,
            get_payments_for_repair,
            add_used_part,
            get_used_parts_for_repair,
            insert_repair_history,
            get_history_for_repair,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
