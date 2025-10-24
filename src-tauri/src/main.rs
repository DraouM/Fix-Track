// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod printer; // Add this line

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
use printer::{get_available_printers, get_printer_status, print_escpos_commands}; // Add this line
use std::panic;

fn main() {
    // Set up panic handler for better crash reporting
    panic::set_hook(Box::new(|panic_info| {
        eprintln!("Application panicked: {}", panic_info);
        // In a real application, you might want to log this to a file or send it to a server
    }));

    // Initialize database path
    db::init_db_path();

    // Use a more robust approach to start the application
    match tauri::Builder::default()
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
            // PRINTER - Add these lines
            print_escpos_commands,
            get_available_printers,
            get_printer_status,
        ])
        .build(tauri::generate_context!())
    {
        Ok(app) => {
            app.run(|_app_handle, _event| {
                // Handle application events if needed
            });
            // app.run never returns, so we don't need to handle errors here
        }
        Err(error) => {
            eprintln!("Error building Tauri application: {}", error);
            std::process::exit(1);
        }
    }
}
