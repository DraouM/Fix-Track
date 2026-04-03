// printing.rs
// Thermal printer support module for Tauri backend
// Provides native printing commands: list printers, send raw data, print HTML

use serde::{Deserialize, Serialize};
use std::process::Command;

/// Printer configuration passed from the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrinterConfig {
    pub printer_type: String,      // "58mm", "80mm", "custom"
    pub custom_width: Option<f64>, // mm
    pub custom_height: Option<f64>, // mm
    pub offset_top: f64,           // mm
    pub offset_left: f64,          // mm
    pub printer_name: Option<String>,
    pub use_native_print: bool,
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
        let stderr = String::from_utf8_lossy(&output.stderr);
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
    use std::io::Write;

    // Write data to a temp file, then send via shell
    let temp_dir = std::env::temp_dir();
    let temp_file = temp_dir.join("fixary_print_raw.bin");

    std::fs::write(&temp_file, data)
        .map_err(|e| format!("Failed to write temp file: {}", e))?;

    let output = Command::new("powershell")
        .args(&[
            "-NoProfile",
            "-Command",
            &format!(
                "Get-Content -Path '{}' -Encoding Byte -ReadCount 0 | Out-Printer -Name '{}'",
                temp_file.to_string_lossy(),
                printer_name
            ),
        ])
        .output()
        .map_err(|e| format!("Failed to send to printer: {}", e))?;

    // Clean up temp file
    let _ = std::fs::remove_file(&temp_file);

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Printer error: {}", stderr));
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
        // On Windows, use the default browser/handler to print HTML
        let file_path = temp_file.to_string_lossy().to_string();
        
        if let Some(ref pname) = printer_name {
            // Try to print directly to the specified printer
            let output = Command::new("powershell")
                .args(&[
                    "-NoProfile",
                    "-Command",
                    &format!(
                        "Start-Process '{}' -Verb Print",
                        file_path
                    ),
                ])
                .output()
                .map_err(|e| format!("Failed to print HTML: {}", e))?;
                
            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                return Err(format!("Print error: {}", stderr));
            }
        } else {
            // Open with default handler
            Command::new("cmd")
                .args(&["/C", "start", "", &file_path])
                .output()
                .map_err(|e| format!("Failed to open HTML: {}", e))?;
        }
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
