// src-tauri/src/printer.rs - SIMPLIFIED & WORKING VERSION

use serde::{Deserialize, Serialize};
use std::io::Write;
use std::time::Duration;
use tauri::command;

use chrono;
use escposify::device::File as EscposFile;
use escposify::printer::Printer;

// ============================================================================
// DATA STRUCTURES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReceiptItem {
    pub name: String,
    pub quantity: f32,
    pub price: f32,
    pub total: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReceiptData {
    pub store_name: String,
    pub store_address: Option<String>,
    pub store_phone: Option<String>,
    pub receipt_number: String,
    pub cashier: Option<String>,
    pub items: Vec<ReceiptItem>,
    pub subtotal: f32,
    pub tax: f32,
    pub total: f32,
    pub payment_method: String,
    pub amount_paid: f32,
    pub change: f32,
    pub footer_text: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrinterInfo {
    pub name: String,
    pub address: String,
    pub printer_type: String,
}

// ============================================================================
// MAIN COMMANDS
// ============================================================================

#[command]
pub fn print_receipt(
    receipt_data: ReceiptData,
    printer_address: Option<String>,
) -> Result<String, String> {
    // Generate ESC/POS commands
    let commands = generate_receipt_commands(&receipt_data)?;

    // Print to specified printer or auto-detect
    if let Some(address) = printer_address {
        print_to_printer(&commands, &address)?;
    } else {
        auto_print(&commands)?;
    }

    Ok(format!(
        "Receipt printed successfully ({} bytes)",
        commands.len()
    ))
}

#[command]
pub fn get_available_printers() -> Result<Vec<PrinterInfo>, String> {
    let mut printers = Vec::new();

    // USB Printers
    #[cfg(windows)]
    {
        if let Ok(usb_printers) = get_windows_usb_printers() {
            printers.extend(usb_printers);
        }
    }

    #[cfg(unix)]
    {
        if let Ok(usb_printers) = get_unix_usb_printers() {
            printers.extend(usb_printers);
        }
    }

    // Network printers (common IP ranges only)
    printers.push(PrinterInfo {
        name: "Network Printer (Manual)".to_string(),
        address: "192.168.1.100:9100".to_string(),
        printer_type: "Network".to_string(),
    });

    Ok(printers)
}

#[command]
pub fn test_print(printer_address: String) -> Result<String, String> {
    let test_data = ReceiptData {
        store_name: "TEST PRINT".to_string(),
        store_address: None,
        store_phone: None,
        receipt_number: format!("TEST-{}", chrono::Local::now().timestamp()),
        cashier: None,
        items: vec![ReceiptItem {
            name: "Test Item".to_string(),
            quantity: 1.0,
            price: 0.01,
            total: 0.01,
        }],
        subtotal: 0.01,
        tax: 0.0,
        total: 0.01,
        payment_method: "CASH".to_string(),
        amount_paid: 0.01,
        change: 0.0,
        footer_text: Some("This is a test receipt".to_string()),
    };

    print_receipt(test_data, Some(printer_address))
}

// ============================================================================
// RECEIPT GENERATION
// ============================================================================

fn generate_receipt_commands(receipt: &ReceiptData) -> Result<Vec<u8>, String> {
    let mut commands = Vec::new();

    // Initialize printer
    commands.extend_from_slice(&[0x1B, 0x40]); // ESC @ - Initialize

    // Center align
    commands.extend_from_slice(&[0x1B, 0x61, 0x01]); // ESC a 1

    // Large text for store name
    commands.extend_from_slice(&[0x1D, 0x21, 0x11]); // GS ! 17 (double height + width)
    commands.extend_from_slice(receipt.store_name.as_bytes());
    commands.extend_from_slice(&[0x0A]); // Line feed

    // Normal text
    commands.extend_from_slice(&[0x1D, 0x21, 0x00]); // GS ! 0 (normal)

    // Store info
    if let Some(address) = &receipt.store_address {
        commands.extend_from_slice(address.as_bytes());
        commands.extend_from_slice(&[0x0A]);
    }
    if let Some(phone) = &receipt.store_phone {
        commands.extend_from_slice(phone.as_bytes());
        commands.extend_from_slice(&[0x0A]);
    }

    commands.extend_from_slice(&[0x0A]); // Blank line

    // Receipt info
    commands.extend_from_slice(format!("Receipt: {}", receipt.receipt_number).as_bytes());
    commands.extend_from_slice(&[0x0A]);

    let date = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");
    commands.extend_from_slice(format!("Date: {}", date).as_bytes());
    commands.extend_from_slice(&[0x0A]);

    if let Some(cashier) = &receipt.cashier {
        commands.extend_from_slice(format!("Cashier: {}", cashier).as_bytes());
        commands.extend_from_slice(&[0x0A]);
    }

    commands.extend_from_slice(&[0x0A]); // Blank line

    // Left align for items
    commands.extend_from_slice(&[0x1B, 0x61, 0x00]); // ESC a 0

    // Separator
    commands.extend_from_slice(b"----------------------------------------");
    commands.extend_from_slice(&[0x0A]);

    // Items
    for item in &receipt.items {
        let item_line = format!("{} x{:.2}", truncate_str(&item.name, 25), item.quantity);
        commands.extend_from_slice(item_line.as_bytes());
        commands.extend_from_slice(&[0x0A]);

        let price_line = format!("  ${:.2} each    ${:.2}", item.price, item.total);
        commands.extend_from_slice(price_line.as_bytes());
        commands.extend_from_slice(&[0x0A]);
    }

    commands.extend_from_slice(&[0x0A]); // Blank line
    commands.extend_from_slice(b"----------------------------------------");
    commands.extend_from_slice(&[0x0A]);

    // Right align for totals
    commands.extend_from_slice(&[0x1B, 0x61, 0x02]); // ESC a 2

    commands.extend_from_slice(format!("Subtotal: ${:.2}", receipt.subtotal).as_bytes());
    commands.extend_from_slice(&[0x0A]);
    commands.extend_from_slice(format!("Tax:      ${:.2}", receipt.tax).as_bytes());
    commands.extend_from_slice(&[0x0A]);

    // Bold + larger for total
    commands.extend_from_slice(&[0x1B, 0x45, 0x01]); // ESC E 1 (bold on)
    commands.extend_from_slice(&[0x1D, 0x21, 0x11]); // Double size
    commands.extend_from_slice(format!("TOTAL:    ${:.2}", receipt.total).as_bytes());
    commands.extend_from_slice(&[0x0A]);
    commands.extend_from_slice(&[0x1B, 0x45, 0x00]); // ESC E 0 (bold off)
    commands.extend_from_slice(&[0x1D, 0x21, 0x00]); // Normal size

    commands.extend_from_slice(&[0x0A]);
    commands.extend_from_slice(
        format!(
            "Paid ({}): ${:.2}",
            receipt.payment_method, receipt.amount_paid
        )
        .as_bytes(),
    );
    commands.extend_from_slice(&[0x0A]);
    commands.extend_from_slice(format!("Change:   ${:.2}", receipt.change).as_bytes());
    commands.extend_from_slice(&[0x0A, 0x0A]);

    // Center align for footer
    commands.extend_from_slice(&[0x1B, 0x61, 0x01]); // ESC a 1

    if let Some(footer) = &receipt.footer_text {
        commands.extend_from_slice(footer.as_bytes());
        commands.extend_from_slice(&[0x0A]);
    }

    commands.extend_from_slice(b"Thank you for your business!");
    commands.extend_from_slice(&[0x0A, 0x0A]);

    // QR Code with receipt number
    let qr_data = receipt.receipt_number.as_bytes();
    let qr_len = qr_data.len();

    // QR Code commands (Model 2, Size 6, Error correction M)
    commands.extend_from_slice(&[0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]); // Model
    commands.extend_from_slice(&[0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x06]); // Size
    commands.extend_from_slice(&[0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x30]); // Error correction

    // Store QR data
    let pL = ((qr_len + 3) % 256) as u8;
    let pH = ((qr_len + 3) / 256) as u8;
    commands.extend_from_slice(&[0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30]);
    commands.extend_from_slice(qr_data);

    // Print QR code
    commands.extend_from_slice(&[0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]);

    commands.extend_from_slice(&[0x0A, 0x0A, 0x0A]); // Feed paper

    // Cut paper
    commands.extend_from_slice(&[0x1D, 0x56, 0x00]); // GS V 0 (full cut)

    Ok(commands)
}

fn truncate_str(s: &str, max_len: usize) -> String {
    if s.len() <= max_len {
        s.to_string()
    } else {
        format!("{}...", &s[..max_len - 3])
    }
}

// ============================================================================
// PRINTER COMMUNICATION
// ============================================================================

fn print_to_printer(commands: &[u8], address: &str) -> Result<(), String> {
    if address.starts_with("USB:") || address.starts_with("usb:") {
        print_to_usb(commands, address)
    } else if address.contains(':') {
        print_to_network(commands, address)
    } else {
        Err(format!("Invalid printer address format: {}", address))
    }
}

fn auto_print(commands: &[u8]) -> Result<(), String> {
    // Try USB first
    if print_to_usb(commands, "USB:").is_ok() {
        return Ok(());
    }

    // Try common network addresses
    let common_ips = ["192.168.1.100:9100", "192.168.0.100:9100"];
    for ip in &common_ips {
        if print_to_network(commands, ip).is_ok() {
            return Ok(());
        }
    }

    Err("No accessible printer found. Please specify a printer address.".to_string())
}

// ============================================================================
// USB PRINTING
// ============================================================================

fn print_to_usb(commands: &[u8], _address: &str) -> Result<(), String> {
    #[cfg(windows)]
    {
        use std::ffi::OsString;
        use std::os::windows::ffi::OsStrExt;
        use winapi::um::fileapi::{CreateFileW, WriteFile, OPEN_EXISTING};
        use winapi::um::handleapi::{CloseHandle, INVALID_HANDLE_VALUE};
        use winapi::um::winnt::{FILE_SHARE_READ, GENERIC_WRITE};

        let paths = [r"\\.\USBPRINT001", r"\\.\USBPRINT000", r"\\.\LPT1"];

        for path in &paths {
            let wide_path: Vec<u16> = OsString::from(path)
                .encode_wide()
                .chain(std::iter::once(0))
                .collect();

            unsafe {
                let handle = CreateFileW(
                    wide_path.as_ptr(),
                    GENERIC_WRITE,
                    FILE_SHARE_READ,
                    std::ptr::null_mut(),
                    OPEN_EXISTING,
                    0,
                    std::ptr::null_mut(),
                );

                if handle != INVALID_HANDLE_VALUE {
                    let mut written = 0;
                    let result = WriteFile(
                        handle,
                        commands.as_ptr() as *const _,
                        commands.len() as u32,
                        &mut written,
                        std::ptr::null_mut(),
                    );

                    CloseHandle(handle);

                    if result != 0 && written as usize == commands.len() {
                        return Ok(());
                    }
                }
            }
        }

        Err("No USB printer found. Check USB connection and drivers.".to_string())
    }

    #[cfg(unix)]
    {
        let paths = ["/dev/usb/lp0", "/dev/usb/lp1", "/dev/usblp0", "/dev/usblp1"];

        for path in &paths {
            if let Ok(mut file) = std::fs::OpenOptions::new().write(true).open(path) {
                if file.write_all(commands).is_ok() {
                    let _ = file.flush();
                    return Ok(());
                }
            }
        }

        Err("No USB printer found. Check /dev/usb/lp* permissions.".to_string())
    }

    #[cfg(not(any(windows, unix)))]
    {
        Err("USB printing not supported on this platform".to_string())
    }
}

// ============================================================================
// NETWORK PRINTING
// ============================================================================

fn print_to_network(commands: &[u8], address: &str) -> Result<(), String> {
    use std::net::TcpStream;

    let addr = address
        .parse::<std::net::SocketAddr>()
        .map_err(|e| format!("Invalid network address '{}': {}", address, e))?;

    let mut stream = TcpStream::connect_timeout(&addr, Duration::from_secs(3))
        .map_err(|e| format!("Failed to connect to {}: {}", address, e))?;

    stream
        .set_write_timeout(Some(Duration::from_secs(5)))
        .map_err(|e| format!("Failed to set timeout: {}", e))?;

    stream
        .write_all(commands)
        .map_err(|e| format!("Failed to write to printer: {}", e))?;

    stream
        .flush()
        .map_err(|e| format!("Failed to flush: {}", e))?;

    Ok(())
}

// ============================================================================
// USB PRINTER DETECTION
// ============================================================================

#[cfg(windows)]
fn get_windows_usb_printers() -> Result<Vec<PrinterInfo>, String> {
    let mut printers = Vec::new();

    // Check standard USB print paths
    let paths = [
        (r"\\.\USBPRINT001", "USB Printer 1"),
        (r"\\.\USBPRINT000", "USB Printer 0"),
        (r"\\.\LPT1", "Parallel Port 1"),
    ];

    for (path, name) in &paths {
        // We can't easily check if path exists on Windows, so just add it
        printers.push(PrinterInfo {
            name: name.to_string(),
            address: format!("USB:{}", path),
            printer_type: "USB".to_string(),
        });
    }

    Ok(printers)
}

#[cfg(unix)]
fn get_unix_usb_printers() -> Result<Vec<PrinterInfo>, String> {
    let mut printers = Vec::new();

    let paths = [
        ("/dev/usb/lp0", "USB Printer 0"),
        ("/dev/usb/lp1", "USB Printer 1"),
        ("/dev/usblp0", "USB Printer 0"),
        ("/dev/usblp1", "USB Printer 1"),
    ];

    for (path, name) in &paths {
        if std::path::Path::new(path).exists() {
            printers.push(PrinterInfo {
                name: name.to_string(),
                address: format!("USB:{}", path),
                printer_type: "USB".to_string(),
            });
        }
    }

    Ok(printers)
}
