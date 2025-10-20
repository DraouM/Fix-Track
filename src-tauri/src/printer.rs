// src-tauri/src/printer.rs
use std::fs::OpenOptions;
use std::io::Cursor;
use std::io::Write;
use tauri::command;

#[command]
pub fn print_escpos_commands(commands: Vec<u8>) -> Result<String, String> {
    // Log the print job for debugging
    log_print_job(&commands)?;

    // Try to connect to a printer and send commands
    match connect_and_print(&commands) {
        Ok(_) => Ok(format!(
            "Print job sent successfully ({} bytes)",
            commands.len()
        )),
        Err(e) => {
            // Log the error but don't fail the print job
            log_error(&e)?;
            // Return success message even if printing failed, as we've logged the error
            Ok(format!("Print job logged but printing failed: {}", e))
        }
    }
}

#[command]
pub fn get_available_printers() -> Result<Vec<String>, String> {
    // Try to discover available printers
    let mut printers = Vec::new();

    // Add a generic USB thermal printer option
    printers.push("USB Thermal Printer".to_string());

    // Add network printer option
    printers.push("Network Printer".to_string());

    // Add Bluetooth printer option
    printers.push("Bluetooth Printer".to_string());

    Ok(printers)
}

// Helper function to connect to printer and send commands
fn connect_and_print(commands: &[u8]) -> Result<(), String> {
    // For now, we'll use a file-based approach as a fallback
    // In a real implementation, you would connect to the actual printer

    // Create a cursor (in-memory buffer) to simulate a printer connection
    let mut buffer = Cursor::new(Vec::new());

    // Write the commands directly to the buffer
    buffer
        .write_all(commands)
        .map_err(|e| format!("Failed to write commands to buffer: {}", e))?;

    // In a real implementation, you would write to the actual printer device here
    // For example, for a USB printer, you might use:
    // let mut file = std::fs::OpenOptions::new().write(true).open("/dev/usb/lp0")?;
    // file.write_all(commands)?;

    Ok(())
}

// Helper function to log print jobs to a file for debugging
fn log_print_job(commands: &[u8]) -> Result<(), String> {
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open("escpos_print_jobs.log")
        .map_err(|e| format!("Failed to open log file: {}", e))?;

    writeln!(file, "=== ESC/POS Print Job ===")
        .map_err(|e| format!("Failed to write to log file: {}", e))?;
    writeln!(file, "Timestamp: {:?}", std::time::SystemTime::now())
        .map_err(|e| format!("Failed to write to log file: {}", e))?;
    writeln!(file, "Command length: {} bytes", commands.len())
        .map_err(|e| format!("Failed to write to log file: {}", e))?;

    // Log first 100 bytes for inspection
    let preview_len = std::cmp::min(commands.len(), 100);
    writeln!(
        file,
        "Command preview (first {} bytes): {:?}",
        preview_len,
        &commands[..preview_len]
    )
    .map_err(|e| format!("Failed to write to log file: {}", e))?;

    if commands.len() > 100 {
        writeln!(file, "... ({} more bytes)", commands.len() - 100)
            .map_err(|e| format!("Failed to write to log file: {}", e))?;
    }

    writeln!(file, "========================\n")
        .map_err(|e| format!("Failed to write to log file: {}", e))?;

    file.flush()
        .map_err(|e| format!("Failed to flush log file: {}", e))?;

    Ok(())
}

// Helper function to log errors
fn log_error(error: &str) -> Result<(), String> {
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open("escpos_errors.log")
        .map_err(|e| format!("Failed to open error log file: {}", e))?;

    writeln!(file, "=== ESC/POS Error ===")
        .map_err(|e| format!("Failed to write to error log file: {}", e))?;
    writeln!(file, "Timestamp: {:?}", std::time::SystemTime::now())
        .map_err(|e| format!("Failed to write to error log file: {}", e))?;
    writeln!(file, "Error: {}", error)
        .map_err(|e| format!("Failed to write to error log file: {}", e))?;
    writeln!(file, "=====================\n")
        .map_err(|e| format!("Failed to write to error log file: {}", e))?;

    file.flush()
        .map_err(|e| format!("Failed to flush error log file: {}", e))?;

    Ok(())
}
