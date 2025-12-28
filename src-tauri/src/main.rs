// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod printer; // Add this line

use db::client::{
    add_client_payment, adjust_client_balance, delete_client, get_client_by_id, get_client_history,
    get_clients, insert_client, insert_client_history, update_client,
};
use db::expense::{add_expense, get_expenses_by_session, get_today_expenses};
use db::inventory::{
    delete_item, get_history_for_item, get_item_by_id, get_items, get_low_stock_items,
    insert_history_event, insert_item, search_items, update_item, update_item_quantity,
};
use db::order::{
    add_order_item, add_order_payment, complete_order, create_order, get_order_by_id,
    get_order_payments, get_orders, get_orders_by_supplier, remove_order_item, update_order,
    update_order_item,
};
use db::repair::{
    add_payment, add_used_part, delete_repair, get_history_for_repair, get_payments_for_repair,
    get_repair_by_id, get_repairs, get_used_parts_for_repair, insert_repair, insert_repair_history,
    update_repair, update_repair_status,
};
use db::sale::{
    add_sale_item, add_sale_payment, complete_sale, create_sale, get_sale_by_id, get_sales,
    remove_sale_item, update_sale, update_sale_item,
};
use db::schema;
use db::session::{
    close_session, get_current_session, get_last_session_closing_balance, start_session,
};
use db::supplier::{
    add_supplier_payment, adjust_supplier_credit, delete_supplier, get_supplier_by_id,
    get_supplier_history, get_suppliers, insert_supplier, insert_supplier_history, update_supplier,
};
use db::transaction::{
    add_transaction_item, add_transaction_payment, complete_transaction, create_transaction,
    get_transaction_by_id, get_transactions, remove_transaction_item, submit_transaction,
    update_transaction,
};
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
            // SUPPLIERS
            get_suppliers,
            get_supplier_by_id,
            insert_supplier,
            update_supplier,
            delete_supplier,
            add_supplier_payment,
            adjust_supplier_credit,
            get_supplier_history,
            insert_supplier_history,
            // ORDERS
            create_order,
            get_orders,
            get_order_by_id,
            update_order,
            add_order_item,
            update_order_item,
            remove_order_item,
            add_order_payment,
            get_order_payments,
            complete_order,
            get_orders_by_supplier,
            // CLIENTS
            get_clients,
            get_client_by_id,
            insert_client,
            update_client,
            delete_client,
            add_client_payment,
            adjust_client_balance,
            get_client_history,
            insert_client_history,
            // SALES
            create_sale,
            get_sales,
            get_sale_by_id,
            update_sale,
            add_sale_item,
            update_sale_item,
            remove_sale_item,
            add_sale_payment,
            complete_sale,
            // EXPENSES
            add_expense,
            get_today_expenses,
            get_expenses_by_session,
            // SESSIONS
            start_session,
            get_current_session,
            close_session,
            get_last_session_closing_balance,
            // PRINTER - Add these lines
            print_escpos_commands,
            get_available_printers,
            get_printer_status,
            // TRANSACTIONS
            create_transaction,
            get_transactions,
            get_transaction_by_id,
            add_transaction_item,
            remove_transaction_item,
            add_transaction_payment,
            complete_transaction,
            submit_transaction,
            update_transaction,
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
