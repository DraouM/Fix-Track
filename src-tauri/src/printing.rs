// printing.rs
// Thermal printer support module for Tauri backend
// Provides native printing commands: list printers, send raw data, print HTML

use serde::{Deserialize, Serialize};
use std::process::Command;

/// Printer configuration passed from the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrinterConfig {
    pub printer_type: String,      // "58mm", "80mm", "custom"
    pub custom_width: Option<f64>, // mm
    pub custom_height: Option<f64>, // mm
    pub offset_top: f64,           // mm
    pub offset_left: f64,          // mm
    
    pub receipt_connection_type: Option<String>, // "usb" or "tcp"
    pub receipt_printer_name: Option<String>,
    pub receipt_printer_ip: Option<String>,
    pub receipt_printer_port: Option<u16>,
    
    pub sticker_connection_type: Option<String>, // "usb" or "tcp"
    pub sticker_printer_name: Option<String>,
    pub sticker_printer_ip: Option<String>,
    pub sticker_printer_port: Option<u16>,
    
    pub use_native_print: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShopInfo {
    pub shop_name: String,
    pub phone_number: String,
    pub address: String,
    pub receipt_footer: String,
    pub logo_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReceiptItem {
    pub name: String,
    pub qty: i32,
    pub price: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReceiptData {
    pub order_id: String,
    pub customer: String,
    pub device: Option<String>,
    pub issue: Option<String>,
    pub items: Vec<ReceiptItem>,
    pub total: f64,
    pub shop_info: Option<ShopInfo>,
    pub date: Option<String>,
    pub currency_symbol: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StickerData {
    pub barcode: String,
    pub item_name: String,
    pub customer_name: Option<String>,
    pub customer_phone: Option<String>,
    pub issue: Option<String>,
    pub price: f64,
    pub currency_symbol: Option<String>,
}

/// Information about an available printer.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrinterInfo {
    pub name: String,
    pub is_default: bool,
}

/// List available printers on the system.
#[tauri::command]
pub fn list_printers() -> Result<Vec<PrinterInfo>, String> {
    #[cfg(target_os = "windows")]
    {
        list_printers_windows()
    }

    #[cfg(not(target_os = "windows"))]
    {
        // Fallback for non-Windows: use lpstat
        list_printers_unix()
    }
}

#[cfg(target_os = "windows")]
fn list_printers_windows() -> Result<Vec<PrinterInfo>, String> {
    // Use PowerShell to enumerate printers
    let output = Command::new("powershell")
        .args(&[
            "-NoProfile",
            "-Command",
            "Get-Printer | Select-Object Name, @{N='IsDefault';E={$_.IsDefault}} | ConvertTo-Json",
        ])
        .output()
        .map_err(|e| format!("Failed to run PowerShell: {}", e))?;

    if !output.status.success() {
        // let stderr = String::from_utf8_lossy(&output.stderr);
        // Fallback: try wmic
        return list_printers_wmic();
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let trimmed = stdout.trim();
    
    if trimmed.is_empty() {
        return Ok(vec![]);
    }

    // Parse JSON output
    let printers: Vec<PrinterInfo> = if trimmed.starts_with('[') {
        // Array of printers
        let parsed: Vec<serde_json::Value> = serde_json::from_str(trimmed)
            .map_err(|e| format!("Failed to parse printer list: {}", e))?;
        parsed
            .iter()
            .map(|p| PrinterInfo {
                name: p["Name"].as_str().unwrap_or("Unknown").to_string(),
                is_default: p["IsDefault"].as_bool().unwrap_or(false),
            })
            .collect()
    } else {
        // Single printer object
        let parsed: serde_json::Value = serde_json::from_str(trimmed)
            .map_err(|e| format!("Failed to parse printer: {}", e))?;
        vec![PrinterInfo {
            name: parsed["Name"].as_str().unwrap_or("Unknown").to_string(),
            is_default: parsed["IsDefault"].as_bool().unwrap_or(false),
        }]
    };

    Ok(printers)
}

#[cfg(target_os = "windows")]
fn list_printers_wmic() -> Result<Vec<PrinterInfo>, String> {
    let output = Command::new("wmic")
        .args(&["printer", "get", "Name,Default", "/format:csv"])
        .output()
        .map_err(|e| format!("Failed to run wmic: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut printers = Vec::new();

    for line in stdout.lines().skip(1) {
        let parts: Vec<&str> = line.split(',').collect();
        if parts.len() >= 3 {
            let is_default = parts[1].trim().eq_ignore_ascii_case("TRUE");
            let name = parts[2].trim().to_string();
            if !name.is_empty() {
                printers.push(PrinterInfo { name, is_default });
            }
        }
    }

    Ok(printers)
}

#[cfg(not(target_os = "windows"))]
fn list_printers_unix() -> Result<Vec<PrinterInfo>, String> {
    let output = Command::new("lpstat")
        .args(&["-p", "-d"])
        .output()
        .map_err(|e| format!("Failed to run lpstat: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut printers = Vec::new();
    let mut default_printer = String::new();

    for line in stdout.lines() {
        if line.starts_with("printer ") {
            let name = line
                .trim_start_matches("printer ")
                .split_whitespace()
                .next()
                .unwrap_or("")
                .to_string();
            if !name.is_empty() {
                printers.push(PrinterInfo {
                    name,
                    is_default: false,
                });
            }
        } else if line.starts_with("system default destination:") {
            default_printer = line
                .trim_start_matches("system default destination:")
                .trim()
                .to_string();
        }
    }

    // Mark default
    for p in &mut printers {
        if p.name == default_printer {
            p.is_default = true;
        }
    }

    Ok(printers)
}

/// Send raw bytes to a printer (for ESC/POS commands).
#[tauri::command]
pub fn print_raw(printer_name: String, data: Vec<u8>) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        print_raw_windows(&printer_name, &data)
    }

    #[cfg(not(target_os = "windows"))]
    {
        print_raw_unix(&printer_name, &data)
    }
}

#[cfg(target_os = "windows")]
fn print_raw_windows(printer_name: &str, data: &[u8]) -> Result<(), String> {
    use std::ptr;
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use winapi::um::winspool::{OpenPrinterW, ClosePrinter, StartDocPrinterW, EndDocPrinter, StartPagePrinter, EndPagePrinter, WritePrinter, DOC_INFO_1W};
    use winapi::shared::minwindef::DWORD;
    use winapi::um::winnt::HANDLE;

    let mut printer_name_wide: Vec<u16> = OsStr::new(printer_name).encode_wide().chain(Some(0)).collect();
    let mut h_printer: HANDLE = ptr::null_mut();

    unsafe {
        if OpenPrinterW(printer_name_wide.as_mut_ptr(), &mut h_printer, ptr::null_mut()) == 0 {
            return Err(format!("Failed to open printer: {}", printer_name));
        }

        let doc_name: Vec<u16> = OsStr::new("FixTrack Direct Print").encode_wide().chain(Some(0)).collect();
        let data_type: Vec<u16> = OsStr::new("RAW").encode_wide().chain(Some(0)).collect();

        let mut doc_info = DOC_INFO_1W {
            pDocName: doc_name.as_ptr() as *mut u16,
            pOutputFile: ptr::null_mut(),
            pDatatype: data_type.as_ptr() as *mut u16,
        };

        let doc_id = StartDocPrinterW(h_printer, 1, &mut doc_info as *mut _ as *mut u8);
        if doc_id == 0 {
            ClosePrinter(h_printer);
            return Err("Failed to start document printer".to_string());
        }

        if StartPagePrinter(h_printer) == 0 {
            EndDocPrinter(h_printer);
            ClosePrinter(h_printer);
            return Err("Failed to start page printer".to_string());
        }

        let mut bytes_written: DWORD = 0;
        let write_result = WritePrinter(
            h_printer,
            data.as_ptr() as *mut _,
            data.len() as DWORD,
            &mut bytes_written,
        );

        EndPagePrinter(h_printer);
        EndDocPrinter(h_printer);
        ClosePrinter(h_printer);

        if write_result == 0 {
            return Err("Failed to write to printer".to_string());
        }
    }

    Ok(())
}

#[cfg(not(target_os = "windows"))]
fn print_raw_unix(printer_name: &str, data: &[u8]) -> Result<(), String> {
    use std::io::Write;

    let temp_dir = std::env::temp_dir();
    let temp_file = temp_dir.join("fixary_print_raw.bin");

    std::fs::write(&temp_file, data)
        .map_err(|e| format!("Failed to write temp file: {}", e))?;

    let output = Command::new("lp")
        .args(&[
            "-d",
            printer_name,
            "-o",
            "raw",
            &temp_file.to_string_lossy(),
        ])
        .output()
        .map_err(|e| format!("Failed to send to printer: {}", e))?;

    let _ = std::fs::remove_file(&temp_file);

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Printer error: {}", stderr));
    }

    Ok(())
}

/// Print HTML content by saving to a temp file and sending to the OS printer.
/// This acts as a PDF fallback path — the OS handles HTML-to-print rendering.
#[tauri::command]
pub fn print_html(html: String, printer_name: Option<String>) -> Result<(), String> {
    let temp_dir = std::env::temp_dir();
    let temp_file = temp_dir.join("fixary_print_receipt.html");

    std::fs::write(&temp_file, &html)
        .map_err(|e| format!("Failed to write temp HTML: {}", e))?;

    #[cfg(target_os = "windows")]
    {
        let file_path = temp_file.to_string_lossy().to_string();
        
        let ps_command = if let Some(ref pname) = printer_name {
            // Attempt silent print using Edge headless mode if available, 
            // or fallback to PowerShell's Start-Process with hidden window.
            format!(
                "Start-Process -FilePath 'msedge' -ArgumentList '--headless', '--print-to-pdf-no-header', '--print-to-pdf=\"$env:TEMP\\temp.pdf\"', '{}' -Wait; Start-Process -FilePath 'powershell' -ArgumentList '-NoProfile', '-Command', \"Start-Process -FilePath '$env:TEMP\\temp.pdf' -Verb PrintTo -ArgumentList '{}' -WindowStyle Hidden\" -WindowStyle Hidden",
                file_path, pname
            )
        } else {
            format!("Start-Process '{}' -Verb Print -WindowStyle Hidden", file_path)
        };

        Command::new("powershell")
            .args(&["-NoProfile", "-Command", &ps_command])
            .output()
            .map_err(|e| format!("Failed to execute print command: {}", e))?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        let file_path = temp_file.to_string_lossy().to_string();
        Command::new("xdg-open")
            .arg(&file_path)
            .output()
            .map_err(|e| format!("Failed to open HTML: {}", e))?;
    }

    Ok(())
}

/// Send raw direct commands (ESC/POS) for a receipt
#[tauri::command]
pub fn print_receipt_direct(config: PrinterConfig, data: ReceiptData) -> Result<(), String> {
    println!("Printing receipt: data={:?}, config={:?}", data, config);
    let mut payload: Vec<u8> = Vec::new();
    
    // ESC/POS Commands
    let esc: u8 = 0x1B;
    // let gs: u8 = 0x1D; // Unused for now, commenting out

    // 1. Initialize printer: ESC @
    payload.extend_from_slice(&[esc, 0x40]); 
    
    // 2. Header (Centered, Bold)
    if let Some(ref shop) = data.shop_info {
        payload.extend_from_slice(&[esc, 0x61, 0x01]); // Center
        
        // FUTURE: If shop.logo_url is present, convert to bitmap and send using GS v 0
        // For now, we ensure the data translation is verified.
        if shop.logo_url.is_some() {
            println!("Logo URL received: {}", shop.logo_url.as_ref().unwrap());
        }

        payload.extend_from_slice(&[esc, 0x45, 0x01]); // Bold ON
        payload.extend_from_slice(format!("{}\n", shop.shop_name.to_uppercase()).as_bytes());
        payload.extend_from_slice(&[esc, 0x45, 0x00]); // Bold OFF
        payload.extend_from_slice(format!("{}\n", shop.address).as_bytes());
        payload.extend_from_slice(format!("Tel: {}\n", shop.phone_number).as_bytes());
        payload.extend_from_slice(b"\n");
    } else {
        payload.extend_from_slice(&[esc, 0x61, 0x01]); // Center
        payload.extend_from_slice(b"--- FIXTRACK REPAIR ---\n\n");
    }

    // 3. Order Info (Left align)
    payload.extend_from_slice(&[esc, 0x61, 0x00]); // Left align
    payload.extend_from_slice(format!("ORDER ID: {}\n", data.order_id).as_bytes());
    if let Some(date) = data.date {
        payload.extend_from_slice(format!("DATE:     {}\n", date).as_bytes());
    }
    payload.extend_from_slice(format!("CUSTOMER: {}\n", data.customer).as_bytes());
    payload.extend_from_slice(b"--------------------------------\n");

    // 4. Device Details (Bold label)
    if let Some(dev) = data.device {
        payload.extend_from_slice(&[esc, 0x45, 0x01]); // Bold ON
        payload.extend_from_slice(b"DEVICE: ");
        payload.extend_from_slice(&[esc, 0x45, 0x00]); // Bold OFF
        payload.extend_from_slice(format!("{}\n", dev).as_bytes());
    }
    if let Some(issue) = data.issue {
        payload.extend_from_slice(&[esc, 0x45, 0x01]); // Bold ON
        payload.extend_from_slice(b"ISSUE:  ");
        payload.extend_from_slice(&[esc, 0x45, 0x00]); // Bold OFF
        payload.extend_from_slice(format!("{}\n", issue).as_bytes());
    }
    payload.extend_from_slice(b"--------------------------------\n");

    // 5. Items (Parts/Labor)
    payload.extend_from_slice(&[esc, 0x45, 0x01]); // Bold ON
    payload.extend_from_slice(b"ITEM             QTY      PRICE\n");
    payload.extend_from_slice(&[esc, 0x45, 0x00]); // Bold OFF
    
    let symbol = data.currency_symbol.as_deref().unwrap_or("$");

    for item in data.items {
        // Simple fixed-width formatting
        let name = if item.name.len() > 15 { &item.name[0..15] } else { &item.name };
        let line = format!("{:<16} {:<8} {:>1}{:>8.2}\n", name, item.qty, symbol, item.price);
        payload.extend_from_slice(line.as_bytes());
    }

    payload.extend_from_slice(b"--------------------------------\n");

    // 6. Total (Right align, Bold)
    payload.extend_from_slice(&[esc, 0x61, 0x02]); // Right align
    payload.extend_from_slice(&[esc, 0x21, 0x08]); // Bold/Emphasized
    payload.extend_from_slice(format!("TOTAL: {}{:.2}\n", symbol, data.total).as_bytes());
    payload.extend_from_slice(&[esc, 0x21, 0x00]); // Back to normal
    
    // 7. Footer
    payload.extend_from_slice(&[esc, 0x61, 0x01]); // Center
    payload.extend_from_slice(b"\n");
    if let Some(ref shop) = data.shop_info {
        payload.extend_from_slice(format!("{}\n", shop.receipt_footer).as_bytes());
    } else {
        payload.extend_from_slice(b"Thank you for your trust!\n");
    }
    
    // 8. Feed & Cut
    payload.extend_from_slice(&[esc, 0x64, 0x05]); // Feed 5 lines
    
    // If standard paper cutter exists: GS V 0
    // payload.extend_from_slice(&[gs, 0x56, 0x00]); 

    println!("Payload generated: {} bytes", payload.len());

    let connection_type = config.receipt_connection_type.as_deref().unwrap_or("usb");
    println!("Connection type: {}", connection_type);

    if connection_type == "tcp" {
        let ip = config.receipt_printer_ip.ok_or("Receipt printer IP address is required for TCP connection")?;
        let port = config.receipt_printer_port.unwrap_or(9100);
        println!("Connecting to TCP printer: {}:{}", ip, port);
        
        let mut stream = std::net::TcpStream::connect_timeout(
            &format!("{}:{}", ip, port).parse().map_err(|_| "Invalid IP/Port format")?,
            std::time::Duration::from_secs(3),
        ).map_err(|e| format!("Failed to connect to network printer: {}", e))?;

        use std::io::Write;
        stream.write_all(&payload).map_err(|e| format!("Failed to send data: {}", e))?;
        stream.flush().map_err(|e| format!("Failed to flush: {}", e))?;
        println!("TCP Print successful");
    } else {
        // Fallback to USB/OS spooler
        let printer_name = config.receipt_printer_name.ok_or("Receipt printer name is required for USB connection")?;
        println!("Sending to USB printer: {}", printer_name);
        print_raw(printer_name, payload)?;
        println!("USB Print successful");
    }

    Ok(())
}

/// Send raw direct commands (TSPL) for a sticker
#[tauri::command]
pub fn print_sticker_direct(config: PrinterConfig, data: StickerData) -> Result<(), String> {
    let customer = data.customer_name.as_deref().unwrap_or("");
    let phone = data.customer_phone.as_deref().unwrap_or("");
    let issue = data.issue.as_deref().unwrap_or("");

    // Build the customer + phone line: "NAME-PHONE" or just "NAME"
    let customer_line = if !phone.is_empty() {
        format!("{}-{}", customer, phone)
    } else {
        customer.to_string()
    };

    // TSPL template (often used for XPrinter XP-365B)
    // 50mm x 25mm label
    // Layout:
    //   Line 1: Repair code / Barcode
    //   Line 2: Issue or Item Name (Main display)
    //   Line 3: Customer info
    
    // Use item_name if issue is empty (e.g. for inventory stickers)
    let display_text = if issue.is_empty() { &data.item_name } else { issue };
    
    // Truncate to prevent overflow (Font 3 is 16 dots wide, 400 dots max -> ~25 characters)
    let mut main_text = display_text.to_string();
    if main_text.len() > 24 {
        main_text.truncate(24);
    }

    // Centering logic: Sticker is 50mm (~400 dots). Center point is 200.
    // Font "2" is 12 dots wide (6 dots half-width)
    // Font "3" is 16 dots wide (8 dots half-width)
    let code_x = (200 - (data.barcode.len() as i32 * 6)).max(10);
    let main_x = (200 - (main_text.len() as i32 * 8)).max(10);
    // Shift left by 20 dots to push name+number left
    let cust_x = (200 - (customer_line.len() as i32 * 6) - 20).max(10);

    let tspl_template = format!(
        "SIZE 50 mm, 25 mm\r\n\
         GAP 3 mm, 0 mm\r\n\
         DIRECTION 1,0\r\n\
         REFERENCE 0,0\r\n\
         CLS\r\n\
         TEXT {code_x},20,\"2\",0,1,1,\"{code}\"\r\n\
         TEXT {main_x},60,\"3\",0,1,1,\"{main_text}\"\r\n\
         TEXT {cust_x},105,\"2\",0,1,1,\"{customer_line}\"\r\n\
         PRINT 1\r\n",
        code = data.barcode,
        main_text = main_text,
        customer_line = customer_line
    );
    
    let payload = tspl_template.into_bytes();

    let connection_type = config.sticker_connection_type.as_deref().unwrap_or("usb");

    if connection_type == "tcp" {
        let ip = config.sticker_printer_ip.ok_or("Sticker printer IP address is required for TCP connection")?;
        let port = config.sticker_printer_port.unwrap_or(9100);
        
        let mut stream = std::net::TcpStream::connect_timeout(
            &format!("{}:{}", ip, port).parse().map_err(|_| "Invalid IP/Port format")?,
            std::time::Duration::from_secs(3),
        ).map_err(|e| format!("Failed to connect to network printer: {}", e))?;

        use std::io::Write;
        stream.write_all(&payload).map_err(|e| format!("Failed to send data: {}", e))?;
        stream.flush().map_err(|e| format!("Failed to flush: {}", e))?;
    } else {
        // Fallback to USB/OS spooler
        let printer_name = config.sticker_printer_name.ok_or("Sticker printer name is required for USB connection")?;
        print_raw(printer_name, payload)?;
    }

    Ok(())
}
