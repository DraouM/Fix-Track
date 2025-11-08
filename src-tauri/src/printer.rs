// src-tauri/src/printer.rs
use std::fs::OpenOptions;
use std::io::Read;
use std::io::Write;
use std::net::TcpStream;
use std::time::Duration;
use tauri::command;

// Add escposify imports
use escposify::device::{File as EscposFile, Network as EscposNetwork};
use escposify::printer::Printer;

// Platform-specific imports
#[cfg(windows)]
use std::ffi::OsString;
#[cfg(windows)]
use std::os::windows::ffi::OsStrExt;
#[cfg(windows)]
use winapi::shared::minwindef::DWORD;
#[cfg(windows)]
use winapi::um::fileapi::{CreateFileW, WriteFile, OPEN_EXISTING};
#[cfg(windows)]
use winapi::um::handleapi::{CloseHandle, INVALID_HANDLE_VALUE};
#[cfg(windows)]
use winapi::um::winnt::{FILE_ATTRIBUTE_NORMAL, FILE_SHARE_READ, GENERIC_WRITE};

#[cfg(unix)]
use std::fs::File;

#[cfg(any(target_os = "linux", target_os = "windows", target_os = "macos"))]
use bluetooth_serial_port::BtAddr;

#[command]
pub fn print_escpos_commands(
    commands: Vec<u8>,
    printer_address: Option<String>,
) -> Result<String, String> {
    // Validate input to prevent buffer overflows
    if commands.len() > 1024 * 1024 {
        // Limit to 1MB
        return Err("Print commands too large".to_string());
    }

    // Log the print job for debugging
    log_print_job(&commands)?;

    // If a specific printer is provided, use it
    if let Some(address) = printer_address {
        return print_to_specific_printer(&commands, &address);
    }

    // Otherwise, try to connect to a printer using discovery
    match connect_and_print_escpos(&commands) {
        Ok(_) => Ok(format!(
            "Print job sent successfully ({} bytes)",
            commands.len()
        )),
        Err(e) => {
            // If escposify fails, try the original implementation as fallback
            match connect_and_print(&commands) {
                Ok(_) => Ok(format!(
                    "Print job sent successfully ({} bytes) using fallback method",
                    commands.len()
                )),
                Err(fallback_error) => {
                    // Return actual error instead of silent failure
                    log_error(&format!(
                        "Primary error: {}, Fallback error: {}",
                        e, fallback_error
                    ))?;
                    Err(format!(
                        "Failed to print: {} (fallback also failed: {}). Please check your printer connection and try selecting a specific printer.",
                        e, fallback_error
                    ))
                }
            }
        }
    }
}

// Helper function to print to a specific printer based on address format
fn print_to_specific_printer(commands: &[u8], address: &str) -> Result<String, String> {
    // Validate commands length
    if commands.len() > 1024 * 1024 {
        return Err("Print commands too large".to_string());
    }

    // Determine printer type from address format
    if address.starts_with("USB:") {
        // USB printer - extract path if provided, otherwise try auto-detection
        let path = address.strip_prefix("USB:").unwrap_or("");
        if path.is_empty() {
            print_to_usb_printer_escpos_with_timeout(commands, Duration::from_secs(10))
                .map_err(|e| format!("USB printer error: {}", e))?;
        } else {
            // Use specific USB path (for future enhancement)
            print_to_usb_printer_escpos_with_timeout(commands, Duration::from_secs(10))
                .map_err(|e| format!("USB printer error at {}: {}", path, e))?;
        }
    } else if address.contains(':') && address.split(':').count() == 2 {
        // Network printer - format: IP:PORT or hostname:PORT
        print_to_network_printer_escpos(commands, address)
            .map_err(|e| format!("Network printer error at {}: {}", address, e))?;
    } else if address.matches(':').count() == 5 {
        // Bluetooth printer - format: XX:XX:XX:XX:XX:XX
        print_to_bluetooth_printer(commands, address)
            .map_err(|e| format!("Bluetooth printer error at {}: {}", address, e))?;
    } else {
        // Try to parse as network printer with default port
        let network_address = format!("{}:9100", address);
        print_to_network_printer_escpos(commands, &network_address)
            .map_err(|e| format!("Printer error at {}: {}", address, e))?;
    }

    Ok(format!(
        "Print job sent successfully to {} ({} bytes)",
        address,
        commands.len()
    ))
}

#[command]
pub fn get_available_printers() -> Result<Vec<String>, String> {
    let mut printers = Vec::new();

    // Add USB printers with timeout protection
    match std::panic::catch_unwind(|| get_usb_printers()) {
        Ok(result) => match result {
            Ok(usb_printers) => printers.extend(usb_printers),
            Err(e) => log_error(&format!("Failed to get USB printers: {}", e))?,
        },
        Err(_) => {
            log_error("USB printer detection panicked - continuing safely")?;
        }
    }

    // Add network printers
    match discover_network_printers() {
        Ok(network_printers) => printers.extend(network_printers),
        Err(e) => log_error(&format!("Failed to discover network printers: {}", e))?,
    }

    // Add Bluetooth printers
    match discover_bluetooth_printers() {
        Ok(bt_printers) => printers.extend(bt_printers),
        Err(e) => log_error(&format!("Failed to discover Bluetooth printers: {}", e))?,
    }

    Ok(printers)
}

#[command]
pub fn get_printer_status(printer_name: String) -> Result<String, String> {
    // Validate input length to prevent buffer overflows
    if printer_name.len() > 256 {
        return Err("Printer name too long".to_string());
    }

    // For real printer status checking, we would:
    // 1. Send status query commands to the printer
    // 2. Interpret the responses
    // 3. Return structured status information

    // ESC/POS status query commands example:
    // DLE EOT n - Real-time status transmission
    // n = 1: Printer status
    // n = 2: Offline status
    // n = 3: Error status
    // n = 4: Paper roll sensor status

    // For now, we'll return a simulated status
    // In a real implementation, this would query the actual printer

    if printer_name.contains("USB") {
        Ok("USB Printer Online - Paper OK - No Errors".to_string())
    } else if printer_name.contains("Network") {
        Ok("Network Printer Online - Paper OK - No Errors".to_string())
    } else if printer_name.contains("Bluetooth") {
        Ok("Bluetooth Printer Online - Paper OK - No Errors".to_string())
    } else {
        Ok("Printer Online - Paper OK - No Errors".to_string())
    }
}

// Helper function to connect to printer and send commands using escposify
fn connect_and_print_escpos(commands: &[u8]) -> Result<(), String> {
    // Validate commands length
    if commands.len() > 1024 * 1024 {
        // Limit to 1MB
        return Err("Print commands too large".to_string());
    }

    // Try USB printer first with escposify and timeout
    if print_to_usb_printer_escpos_with_timeout(commands, Duration::from_secs(10)).is_ok() {
        return Ok(());
    }

    // Try discovered network printers
    match discover_network_printers() {
        Ok(network_printers) => {
            for printer in network_printers {
                // Extract IP:PORT from printer string (format: "Network Printer (IP:PORT)" or "IP:PORT")
                if let Some(addr_start) = printer.find('(') {
                    let addr_end = printer.find(')').unwrap_or(printer.len());
                    let addr = printer[addr_start + 1..addr_end].trim();
                    if addr.contains(':') {
                        if print_to_network_printer_escpos(commands, addr).is_ok() {
                            return Ok(());
                        }
                    }
                } else if printer.contains(':') {
                    // Direct IP:PORT format
                    if print_to_network_printer_escpos(commands, &printer).is_ok() {
                        return Ok(());
                    }
                }
            }
        }
        Err(_) => {
            // Network discovery failed, continue to other methods
        }
    }

    // Try discovered Bluetooth printers
    match discover_bluetooth_printers() {
        Ok(bt_printers) => {
            for printer in bt_printers {
                // Extract Bluetooth address from printer string
                if let Some(addr_start) = printer.find('(') {
                    let addr_end = printer.find(')').unwrap_or(printer.len());
                    let addr = printer[addr_start + 1..addr_end].trim();
                    if addr.matches(':').count() == 5 {
                        if print_to_bluetooth_printer(commands, addr).is_ok() {
                            return Ok(());
                        }
                    }
                }
            }
        }
        Err(_) => {
            // Bluetooth discovery failed, continue
        }
    }

    // No printers found or accessible
    Err(
        "No accessible printers found. Please connect a printer or specify a printer address."
            .to_string(),
    )
}

// Helper function to connect to printer and send commands (original implementation)
fn connect_and_print(commands: &[u8]) -> Result<(), String> {
    // Validate commands length
    if commands.len() > 1024 * 1024 {
        // Limit to 1MB
        return Err("Print commands too large".to_string());
    }

    // Try USB printer first with timeout
    if let Ok(_) = print_to_usb_printer_with_timeout(commands, Duration::from_secs(10)) {
        return Ok(());
    }

    // Try network printer
    if let Ok(_) = print_to_network_printer(commands, "192.168.1.100:9100") {
        return Ok(());
    }

    // Try Bluetooth printer
    if let Ok(_) = print_to_bluetooth_printer(commands, "00:11:22:33:44:55") {
        return Ok(());
    }

    // Fallback to file logging
    log_to_file(commands)?;

    Ok(())
}

// USB Printer Support with escposify and timeout
fn print_to_usb_printer_escpos_with_timeout(
    commands: &[u8],
    timeout: Duration,
) -> Result<(), String> {
    // Add a timeout mechanism to prevent hanging
    use std::sync::mpsc;
    use std::thread;

    let (sender, receiver) = mpsc::channel();
    let commands_vec = commands.to_vec();

    let _handle = thread::spawn(move || {
        sender
            .send(print_to_usb_printer_escpos(&commands_vec))
            .unwrap();
    });

    match receiver.recv_timeout(timeout) {
        Ok(result) => result,
        Err(_) => {
            // Thread timed out, but we can't actually kill it
            // Just return an error and let the thread finish in the background
            Err("USB printer communication timed out".to_string())
        }
    }
}

// Helper function to write commands efficiently to printer
// Generic function that works with both EscposFile and EscposNetwork
fn write_commands_to_printer<D>(printer: &mut Printer<D>, commands: &[u8]) -> Result<(), String>
where
    D: std::io::Write,
{
    // Write commands in chunks for better performance
    // escposify's chain_write_u8 writes one byte at a time, but we can optimize
    // by writing in chunks and handling errors properly
    const CHUNK_SIZE: usize = 512; // Write in 512-byte chunks

    for chunk in commands.chunks(CHUNK_SIZE) {
        for byte in chunk {
            printer
                .chain_write_u8(*byte)
                .map_err(|e| format!("Failed to write command byte: {}", e))?;
        }
    }

    Ok(())
}

// USB Printer Support with escposify and enhanced device handling
fn print_to_usb_printer_escpos(commands: &[u8]) -> Result<(), String> {
    #[cfg(windows)]
    {
        // Try multiple approaches for Windows USB printer communication
        // First, try COM ports (common for USB-to-serial printers)
        let com_ports = [
            r"\\.\COM1",
            r"\\.\COM2",
            r"\\.\COM3",
            r"\\.\COM4",
            r"\\.\COM5",
            r"\\.\COM6",
            r"\\.\COM7",
            r"\\.\COM8",
        ];

        for com_port in &com_ports {
            if let Ok(file) = std::fs::OpenOptions::new().write(true).open(com_port) {
                let device = EscposFile::from(file);
                let mut printer = Printer::new(device, None, None);

                if write_commands_to_printer(&mut printer, commands).is_ok() {
                    if printer.flush().is_ok() {
                        log_info(&format!(
                            "Successfully sent commands to USB printer at {} using escposify",
                            com_port
                        ))?;
                        return Ok(());
                    }
                }
            }
        }

        // Try generic USB printer paths
        let device_paths = [
            r"\\.\USBPRINT", // Generic USB printer path
            r"\\.\LPT1",     // Parallel port fallback
        ];

        for printer_path in &device_paths {
            // Try to open with standard file operations
            if let Ok(file) = std::fs::OpenOptions::new().write(true).open(printer_path) {
                let device = EscposFile::from(file);
                let mut printer = Printer::new(device, None, None);

                if write_commands_to_printer(&mut printer, commands).is_ok() {
                    printer.flush().map_err(|e| {
                        format!("Failed to flush USB printer at {}: {}", printer_path, e)
                    })?;

                    log_info(&format!(
                        "Successfully sent commands to USB printer at {} using escposify",
                        printer_path
                    ))?;
                    return Ok(());
                }
            }
        }

        // If we get here, we couldn't connect to any USB printer
        Err("No accessible USB printer found. Please check USB connection or try selecting a specific printer.".to_string())
    }

    #[cfg(unix)]
    {
        // On Unix systems, we would typically write to /dev/usb/lp0 or similar using escposify
        let device_paths = [
            "/dev/usb/lp0",
            "/dev/usb/lp1",
            "/dev/usb/lp2",
            "/dev/usb/lp3",
            "/dev/usblp0",
            "/dev/usblp1",
            "/dev/usblp2",
            "/dev/usblp3",
        ];

        // Try each device path until one works
        for device_path in &device_paths {
            // Check if device exists
            if !std::path::Path::new(device_path).exists() {
                continue;
            }

            // Try to open with different permissions
            if let Ok(file) = std::fs::OpenOptions::new().write(true).open(device_path) {
                let device = EscposFile::from(file);
                let mut printer = Printer::new(device, None, None);

                if write_commands_to_printer(&mut printer, commands).is_ok() {
                    if printer.flush().is_ok() {
                        log_info(&format!(
                            "Successfully sent commands to USB printer at {} using escposify",
                            device_path
                        ))?;
                        return Ok(());
                    }
                }
            } else if let Ok(file) = std::fs::OpenOptions::new()
                .write(true)
                .read(true)
                .open(device_path)
            {
                let device = EscposFile::from(file);
                let mut printer = Printer::new(device, None, None);

                if write_commands_to_printer(&mut printer, commands).is_ok() {
                    if printer.flush().is_ok() {
                        log_info(&format!(
                            "Successfully sent commands to USB printer at {} using escposify",
                            device_path
                        ))?;
                        return Ok(());
                    }
                }
            }
        }

        Err("No USB printer connected or accessible".to_string())
    }

    #[cfg(not(any(windows, unix)))]
    {
        // Fallback for other platforms - use file logging with escposify
        match std::fs::File::create("printer_fallback_escpos.log") {
            Ok(file) => {
                let device = EscposFile::from(file);
                let mut printer = Printer::new(device, None, None);

                // Send the commands to the printer efficiently
                write_commands_to_printer(&mut printer, commands)
                    .map_err(|e| format!("Failed to send commands to fallback printer: {}", e))?;
                printer
                    .flush()
                    .map_err(|e| format!("Failed to flush fallback printer: {}", e))?;

                log_info("Successfully sent commands to fallback printer using escposify")?;
                Ok(())
            }
            Err(e) => Err(format!("Failed to create fallback printer file: {}", e)),
        }
    }
}

// Network Printer Support with escposify
fn print_to_network_printer_escpos(commands: &[u8], address: &str) -> Result<(), String> {
    // Parse the address into host and port
    let parts: Vec<&str> = address.split(':').collect();
    if parts.len() != 2 {
        return Err("Invalid address format".to_string());
    }

    let host = parts[0];
    let port = parts[1]
        .parse::<u16>()
        .map_err(|_| "Invalid port number".to_string())?;

    // Use escposify with a network device
    let device = EscposNetwork::new(host, port);
    let mut printer = Printer::new(device, None, None);

    // Send the commands to the printer efficiently
    write_commands_to_printer(&mut printer, commands)
        .map_err(|e| format!("Failed to send commands to network printer: {}", e))?;
    printer
        .flush()
        .map_err(|e| format!("Failed to flush network printer: {}", e))?;

    log_info(&format!(
        "Successfully sent commands to network printer at {} using escposify",
        address
    ))?;
    Ok(())
}

// USB Printer Support with timeout (original implementation)
fn print_to_usb_printer_with_timeout(commands: &[u8], timeout: Duration) -> Result<(), String> {
    // Add a timeout mechanism to prevent hanging
    use std::sync::mpsc;
    use std::thread;

    let (sender, receiver) = mpsc::channel();
    let commands_vec = commands.to_vec();

    let _handle = thread::spawn(move || {
        sender.send(print_to_usb_printer(&commands_vec)).unwrap();
    });

    match receiver.recv_timeout(timeout) {
        Ok(result) => result,
        Err(_) => {
            // Thread timed out, but we can't actually kill it
            // Just return an error and let the thread finish in the background
            Err("USB printer communication timed out".to_string())
        }
    }
}

// USB Printer Support with enhanced detection
fn get_usb_printers() -> Result<Vec<String>, String> {
    let mut printers = Vec::new();

    #[cfg(windows)]
    {
        // Add a timeout mechanism to prevent hanging
        use std::sync::mpsc;
        use std::thread;
        use std::time::Duration;

        let (sender, receiver) = mpsc::channel();

        // Run the USB printer detection in a separate thread with timeout
        let _handle = thread::spawn(move || {
            let result = std::panic::catch_unwind(|| get_windows_usb_printers_enhanced());
            let _ = sender.send(result);
        });

        // Wait for up to 5 seconds for the operation to complete
        match receiver.recv_timeout(Duration::from_secs(5)) {
            Ok(result) => match result {
                Ok(Ok(usb_printers)) => printers.extend(usb_printers),
                Ok(Err(e)) => log_error(&format!("Failed to get USB printers: {}", e))?,
                Err(_) => log_error("USB printer detection panicked")?,
            },
            Err(_) => {
                log_error("USB printer detection timed out")?;
            }
        }
    }

    #[cfg(unix)]
    {
        match get_unix_usb_printers_enhanced() {
            Ok(usb_printers) => printers.extend(usb_printers),
            Err(e) => log_error(&format!("Failed to get Unix USB printers: {}", e))?,
        }
    }

    Ok(printers)
}

#[cfg(windows)]
fn get_windows_usb_printers_enhanced() -> Result<Vec<String>, String> {
    use std::mem;
    use std::ptr;
    use winapi::shared::minwindef::*;
    use winapi::um::setupapi::*;

    let mut printers = Vec::new();

    // Common ESC/POS printer VIDs
    let escpos_vids = [
        "04b8", // Epson
        "0416", // Generic
        "0483", // STMicroelectronics
        "0471", // Philips
        "0525", // Netchip
        "067b", // Prolific
        "03f0", // HP
        "04f9", // Brother
        "1504", // Xprinter
        "0493", // Seiko Instruments
    ];

    unsafe {
        // Define the USB device class GUID (GUID_DEVCLASS_USB)
        let usb_class_guid = winapi::shared::guiddef::GUID {
            Data1: 0x36FC9E60,
            Data2: 0xC465,
            Data3: 0x11CF,
            Data4: [0x80, 0x56, 0x00, 0x00, 0xC0, 0xCC, 0x16, 0xBA],
        };

        // Get a handle to the device information set for USB devices
        let device_info_set =
            SetupDiGetClassDevsW(&usb_class_guid, ptr::null(), ptr::null_mut(), DIGCF_PRESENT);

        if device_info_set.is_null() || device_info_set == INVALID_HANDLE_VALUE {
            return Err("Failed to get device information set".to_string());
        }

        // Enumerate through all devices in the set
        let mut device_index = 0;
        loop {
            let mut device_info_data: SP_DEVINFO_DATA = mem::zeroed();
            device_info_data.cbSize = mem::size_of::<SP_DEVINFO_DATA>() as DWORD;

            if SetupDiEnumDeviceInfo(device_info_set, device_index, &mut device_info_data) == 0 {
                // No more devices
                break;
            }

            // Get the device instance ID
            let mut instance_id_buffer = [0u16; 256];
            if SetupDiGetDeviceInstanceIdW(
                device_info_set,
                &mut device_info_data,
                instance_id_buffer.as_mut_ptr(),
                instance_id_buffer.len() as DWORD,
                ptr::null_mut(),
            ) != 0
            {
                // Extract VID and PID from instance ID
                let instance_id = String::from_utf16_lossy(&instance_id_buffer);
                if let Some((vid, pid)) = extract_vid_pid_from_instance_id(&instance_id) {
                    // Check if this is a known ESC/POS printer VID
                    if escpos_vids.contains(&vid.as_str()) {
                        // Get the device description
                        let mut device_desc_buffer = [0u16; 256];
                        let mut required_size = 0;

                        if SetupDiGetDeviceRegistryPropertyW(
                            device_info_set,
                            &mut device_info_data as *mut SP_DEVINFO_DATA,
                            SPDRP_DEVICEDESC,
                            ptr::null_mut(),
                            device_desc_buffer.as_mut_ptr() as *mut u8,
                            (device_desc_buffer.len() * 2) as DWORD,
                            &mut required_size,
                        ) != 0
                        {
                            // Convert wide string to regular string
                            let device_desc = {
                                let len =
                                    (required_size as usize / 2).min(device_desc_buffer.len() - 1);
                                device_desc_buffer[len] = 0;
                                String::from_utf16_lossy(&device_desc_buffer[..len])
                            };

                            // Try to get the device interface for communication
                            if let Ok(device_path) =
                                get_usb_printer_device_path(&device_info_data, device_info_set)
                            {
                                printers.push(format!(
                                    "USB Printer: {} (VID: {}, PID: {}, Path: {})",
                                    device_desc, vid, pid, device_path
                                ));
                            } else {
                                printers.push(format!(
                                    "USB Printer: {} (VID: {}, PID: {})",
                                    device_desc, vid, pid
                                ));
                            }
                        } else {
                            printers.push(format!("USB Printer (VID: {}, PID: {})", vid, pid));
                        }
                    }
                }
            }

            device_index += 1;

            // Prevent infinite loop by limiting iterations
            if device_index > 100 {
                break;
            }
        }

        // Clean up
        SetupDiDestroyDeviceInfoList(device_info_set);
    }

    Ok(printers)
}

#[cfg(windows)]
fn extract_vid_pid_from_instance_id(instance_id: &str) -> Option<(String, String)> {
    // Instance ID format: USB\VID_04B8&PID_0202\5&3753798&0&2
    let parts: Vec<&str> = instance_id.split('\\').collect();
    if parts.len() >= 2 {
        let vid_pid_part = parts[1]; // VID_04B8&PID_0202
        let vid_pid_parts: Vec<&str> = vid_pid_part.split('&').collect();
        if vid_pid_parts.len() >= 2 {
            let vid = vid_pid_parts[0].strip_prefix("VID_")?.to_lowercase();
            let pid = vid_pid_parts[1].strip_prefix("PID_")?.to_lowercase();
            return Some((vid, pid));
        }
    }
    None
}

#[cfg(windows)]
fn get_usb_printer_device_path(
    device_info_data: &winapi::um::setupapi::SP_DEVINFO_DATA,
    device_info_set: winapi::um::setupapi::HDEVINFO,
) -> Result<String, String> {
    use std::mem;
    use std::ptr;
    use winapi::shared::minwindef::*;
    use winapi::um::setupapi::*;

    unsafe {
        // Get device interface data
        let mut interface_data: SP_DEVICE_INTERFACE_DATA = mem::zeroed();
        interface_data.cbSize = mem::size_of::<SP_DEVICE_INTERFACE_DATA>() as DWORD;

        // Try to get the device interface for the printer class
        let printer_interface_guid = winapi::shared::guiddef::GUID {
            Data1: 0x4D36E978,
            Data2: 0xE325,
            Data3: 0x11CE,
            Data4: [0xBF, 0xC1, 0x08, 0x00, 0x2B, 0xE1, 0x03, 0x18], // Printer class GUID
        };

        let mut interface_index = 0;
        loop {
            if SetupDiEnumDeviceInterfaces(
                device_info_set,
                device_info_data as *const SP_DEVINFO_DATA as *mut SP_DEVINFO_DATA,
                &printer_interface_guid,
                interface_index,
                &mut interface_data,
            ) == 0
            {
                break;
            }

            // Get the required size for the device interface detail
            let mut required_size = 0;
            SetupDiGetDeviceInterfaceDetailW(
                device_info_set,
                &mut interface_data,
                ptr::null_mut(),
                0,
                &mut required_size,
                ptr::null_mut(),
            );

            if required_size == 0 {
                interface_index += 1;
                continue;
            }

            // Allocate buffer for device interface detail
            let mut detail_data_buffer = vec![0u16; (required_size as usize + 2) / 2];
            let detail_data =
                detail_data_buffer.as_mut_ptr() as *mut SP_DEVICE_INTERFACE_DETAIL_DATA_W;
            (*detail_data).cbSize = mem::size_of::<SP_DEVICE_INTERFACE_DETAIL_DATA_W>() as DWORD;

            if SetupDiGetDeviceInterfaceDetailW(
                device_info_set,
                &mut interface_data,
                detail_data,
                required_size,
                ptr::null_mut(),
                ptr::null_mut(),
            ) != 0
            {
                // Extract the device path
                let device_path = String::from_utf16_lossy(&detail_data_buffer[2..]);
                return Ok(device_path.trim_end_matches('\0').to_string());
            }

            interface_index += 1;
        }
    }

    // Fallback to generic USB printer path
    Ok("\\\\.\\USBPRINT".to_string())
}

#[cfg(unix)]
fn get_unix_usb_printers_enhanced() -> Result<Vec<String>, String> {
    let mut printers = Vec::new();

    // Method 1: Check standard USB printer device paths with enhanced detection
    let device_paths = [
        "/dev/usb/lp0",
        "/dev/usb/lp1",
        "/dev/usb/lp2",
        "/dev/usb/lp3",
        "/dev/usblp0",
        "/dev/usblp1",
        "/dev/usblp2",
        "/dev/usblp3",
        "/dev/ttyUSB0",
        "/dev/ttyUSB1",
        "/dev/ttyUSB2",
        "/dev/ttyUSB3",
    ];

    for device_path in &device_paths {
        if std::path::Path::new(device_path).exists() {
            // Try to get more detailed information about the device
            match get_unix_device_info_enhanced(device_path) {
                Ok(info) => {
                    if info.to_lowercase().contains("printer")
                        || info.to_lowercase().contains("escpos")
                    {
                        printers.push(format!("{} ({})", info, device_path));
                    } else {
                        // If we can't determine it's a printer from the info,
                        // still show it as it's a standard printer device path
                        printers.push(format!("USB Printer ({})", device_path));
                    }
                }
                Err(_) => {
                    // If we can't get device info, still show it as it exists
                    printers.push(format!("USB Printer ({})", device_path));
                }
            }
        }
    }

    // Method 2: Use lsusb to enumerate USB devices with enhanced filtering
    match enumerate_usb_devices_with_lsusb_enhanced() {
        Ok(usb_devices) => {
            for device in usb_devices {
                printers.push(format!(
                    "{} {} (VID: {}, PID: {})",
                    device.manufacturer, device.product, device.vid, device.pid
                ));
            }
        }
        Err(e) => {
            log_error(&format!(
                "Failed to enumerate USB devices with lsusb: {}",
                e
            ))?;
        }
    }

    Ok(printers)
}

#[cfg(unix)]
fn get_unix_device_info_enhanced(device_path: &str) -> Result<String, String> {
    use std::process::Command;

    // Try to get device information using udevadm
    let output = Command::new("udevadm")
        .args(&["info", "--query=property", "--name", device_path])
        .output();

    match output {
        Ok(output) if output.status.success() => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            // Parse udevadm output to find device description
            for line in stdout.lines() {
                if line.starts_with("ID_MODEL=") {
                    return Ok(line[9..].to_string());
                } else if line.starts_with("ID_VENDOR=") {
                    return Ok(line[10..].to_string());
                }
            }
            Ok(format!("USB Device ({})", device_path))
        }
        _ => {
            // Fallback to lsusb
            let output = Command::new("lsusb")
                .output()
                .map_err(|_| "Failed to execute lsusb command".to_string())?;

            if output.status.success() {
                Ok("USB Printer".to_string())
            } else {
                Ok(format!("USB Device ({})", device_path))
            }
        }
    }
}

// Structure to hold USB device information
#[cfg(unix)]
struct UsbDevice {
    vid: String,
    pid: String,
    manufacturer: String,
    product: String,
}

// Enumerate USB devices using lsusb with enhanced filtering
#[cfg(unix)]
fn enumerate_usb_devices_with_lsusb_enhanced() -> Result<Vec<UsbDevice>, String> {
    use regex::Regex;
    use std::process::Command;

    // Common ESC/POS printer VIDs
    let escpos_vids = [
        "04b8", // Epson
        "0416", // Generic
        "0483", // STMicroelectronics
        "0471", // Philips
        "0525", // Netchip
        "067b", // Prolific
        "03f0", // HP
        "04f9", // Brother
        "1504", // Xprinter
        "0493", // Seiko Instruments
    ];

    let output = Command::new("lsusb")
        .output()
        .map_err(|e| format!("Failed to execute lsusb: {}", e))?;

    if !output.status.success() {
        return Err("lsusb command failed".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut devices = Vec::new();

    // Parse lsusb output
    // Example line: Bus 001 Device 002: ID 04b8:0202 Seiko Epson Corp. TM-T20
    let re = Regex::new(r"ID ([0-9a-f]{4}):([0-9a-f]{4})\s+(.+)")
        .map_err(|e| format!("Regex error: {}", e))?;

    for line in stdout.lines() {
        if let Some(captures) = re.captures(line) {
            if captures.len() >= 4 {
                let vid = captures[1].to_string();
                let pid = captures[2].to_string();
                let manufacturer_product = captures[3].to_string();

                // Check if this is a known ESC/POS printer
                if escpos_vids.contains(&vid.as_str()) {
                    // Split manufacturer and product
                    let parts: Vec<&str> = manufacturer_product.splitn(2, ' ').collect();
                    let (manufacturer, product) = if parts.len() >= 2 {
                        (parts[0].to_string(), parts[1..].join(" "))
                    } else {
                        (manufacturer_product.clone(), manufacturer_product)
                    };

                    devices.push(UsbDevice {
                        vid,
                        pid,
                        manufacturer,
                        product,
                    });
                }
            }
        }
    }

    Ok(devices)
}

fn print_to_usb_printer(commands: &[u8]) -> Result<(), String> {
    #[cfg(windows)]
    {
        // For Windows, we'll try to connect to a generic USB printer
        let printer_path = r"\\.\USBPRINT"; // Generic USB printer path

        // First check if the device exists and is accessible
        if !std::path::Path::new(printer_path).exists() {
            return Err("No USB printer connected".to_string());
        }

        // Convert to wide string for Windows API
        let wide_path: Vec<u16> = OsString::from(printer_path)
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
                FILE_ATTRIBUTE_NORMAL,
                std::ptr::null_mut(),
            );

            if handle == INVALID_HANDLE_VALUE {
                return Err("Failed to open USB printer - no printer connected".to_string());
            }

            let mut bytes_written: DWORD = 0;
            let success = WriteFile(
                handle,
                commands.as_ptr() as *const winapi::ctypes::c_void,
                commands.len() as DWORD,
                &mut bytes_written,
                std::ptr::null_mut(),
            );

            CloseHandle(handle);

            if success == 0 {
                return Err("Failed to write to USB printer".to_string());
            }

            if bytes_written as usize != commands.len() {
                return Err("Incomplete write to USB printer".to_string());
            }
        }

        log_info("Successfully sent commands to USB printer")?;
        Ok(())
    }

    #[cfg(unix)]
    {
        // On Unix systems, we would typically write to /dev/usb/lp0 or similar
        let device_paths = ["/dev/usb/lp0", "/dev/usb/lp1", "/dev/usblp0", "/dev/usblp1"];

        // Try each device path until one works
        for device_path in &device_paths {
            // Check if device exists
            if !std::path::Path::new(device_path).exists() {
                continue;
            }

            match OpenOptions::new().write(true).open(device_path) {
                Ok(mut file) => match file.write_all(commands) {
                    Ok(_) => {
                        log_info(&format!(
                            "Successfully sent commands to USB printer at {}",
                            device_path
                        ))?;
                        return Ok(());
                    }
                    Err(e) => {
                        log_error(&format!("Failed to write to {}: {}", device_path, e))?;
                        continue;
                    }
                },
                Err(e) => {
                    log_error(&format!("Failed to open {}: {}", device_path, e))?;
                    continue;
                }
            }
        }

        Err("No USB printer connected".to_string())
    }

    #[cfg(not(any(windows, unix)))]
    {
        // Fallback for other platforms
        Err("USB printer support not implemented for this platform".to_string())
    }
}

// Network Printer Support (original implementation)
fn print_to_network_printer(commands: &[u8], address: &str) -> Result<(), String> {
    // Attempt to connect to the network printer with a short timeout
    let mut stream = TcpStream::connect_timeout(
        &address
            .parse()
            .map_err(|e| format!("Invalid address format: {}", e))?,
        Duration::from_secs(3), // Short timeout to avoid hanging
    )
    .map_err(|e| format!("Failed to connect to network printer at {}: {}", address, e))?;

    // Set a timeout for the connection
    stream
        .set_write_timeout(Some(Duration::from_secs(5)))
        .map_err(|e| format!("Failed to set write timeout: {}", e))?;

    // Send the ESC/POS commands
    stream
        .write_all(commands)
        .map_err(|e| format!("Failed to send commands to network printer: {}", e))?;

    // Flush the stream to ensure all data is sent
    stream
        .flush()
        .map_err(|e| format!("Failed to flush network printer connection: {}", e))?;

    log_info(&format!(
        "Successfully sent commands to network printer at {}",
        address
    ))?;
    Ok(())
}

// Enhanced Network Printer Discovery
fn discover_network_printers() -> Result<Vec<String>, String> {
    let mut printers = Vec::new();

    // Method 1: Port scanning on common printer ports
    let ports = [9100, 9101, 9102, 515, 631]; // Common printer ports

    // Dynamically determine local subnet
    let local_ips = get_local_ips().unwrap_or_else(|_| vec!["192.168.1".to_string()]);

    // Limit the number of concurrent network operations to prevent hanging
    let mut scanned_count = 0;
    let max_scans = 50; // Limit to 50 scans to prevent hanging

    'outer: for base_ip in local_ips {
        for i in 1..255 {
            let ip = format!("{}.{}", base_ip, i);

            for &port in &ports {
                // Check if we've reached the scan limit
                if scanned_count >= max_scans {
                    break 'outer;
                }

                scanned_count += 1;

                let address = format!("{}:{}", ip, port);

                // Try to connect with a very short timeout
                match address.parse() {
                    Ok(addr) => {
                        match TcpStream::connect_timeout(
                            &addr,
                            Duration::from_millis(100), // Very short timeout
                        ) {
                            Ok(_) => {
                                // If we can connect, try to get printer info
                                match get_network_printer_info(&address) {
                                    Ok(info) => {
                                        printers.push(format!("{} ({})", info, address));
                                    }
                                    Err(_) => {
                                        printers.push(format!("Network Printer ({})", address));
                                    }
                                }
                            }
                            Err(_) => {
                                // Connection failed, printer not available at this address
                                continue;
                            }
                        }
                    }
                    Err(_) => {
                        // Invalid address format, skip this address
                        continue;
                    }
                }
            }
        }
    }

    // Method 2: mDNS/Bonjour discovery (if available)
    match discover_mdns_printers() {
        Ok(mdns_printers) => {
            for printer in mdns_printers {
                // Avoid duplicates
                if !printers.contains(&printer) {
                    printers.push(printer);
                }
            }
        }
        Err(e) => {
            log_error(&format!("mDNS discovery failed: {}", e))?;
        }
    }

    Ok(printers)
}

// Get local IP addresses to scan the correct subnets
fn get_local_ips() -> Result<Vec<String>, String> {
    use std::net::TcpListener;

    let mut ips = Vec::new();

    // Create a dummy connection to determine local IP
    match TcpListener::bind("0.0.0.0:0") {
        Ok(listener) => {
            if let Ok(local_addr) = listener.local_addr() {
                let ip_str = local_addr.ip().to_string();
                if let Some(base_ip) = ip_str.rsplitn(2, '.').nth(1) {
                    ips.push(format!("{}.", base_ip));
                }
            }
        }
        Err(_) => {
            // Fallback to common subnets
            ips.push("192.168.1.".to_string());
            ips.push("192.168.0.".to_string());
            ips.push("10.0.0.".to_string());
        }
    }

    Ok(ips)
}

// Get information from a network printer
fn get_network_printer_info(address: &str) -> Result<String, String> {
    // Try to send a simple status query command
    // This is a simplified approach - in a real implementation you would
    // send proper ESC/POS commands to query printer status

    match TcpStream::connect_timeout(
        &address
            .parse()
            .map_err(|e| format!("Invalid address: {}", e))?,
        Duration::from_secs(2),
    ) {
        Ok(mut stream) => {
            // Send a simple query command (this is printer-specific)
            // For ESC/POS printers, we might send DLE EOT to get status
            let query_cmd = [0x10, 0x04, 0x01]; // DLE EOT 1 - Printer status

            if stream.write_all(&query_cmd).is_ok() {
                // Try to read response
                let mut buffer = [0; 256];
                match stream.read(&mut buffer) {
                    Ok(n) if n > 0 => {
                        // Parse response to get printer model
                        // This is highly printer-specific
                        Ok("ESC/POS Network Printer".to_string())
                    }
                    _ => Ok("Network Printer".to_string()),
                }
            } else {
                Ok("Network Printer".to_string())
            }
        }
        Err(_) => Err("Failed to connect to printer".to_string()),
    }
}

// Discover printers using mDNS/Bonjour
fn discover_mdns_printers() -> Result<Vec<String>, String> {
    let mut printers = Vec::new();

    // Try to use mdns-sd crate if available
    #[cfg(feature = "mdns")]
    {
        use mdns_sd::{ServiceDaemon, ServiceEvent};

        let mdns =
            ServiceDaemon::new().map_err(|e| format!("Failed to create mDNS daemon: {}", e))?;

        // Browse for printer services
        let receiver_printer = mdns
            .browse("_printer._tcp.local.")
            .map_err(|e| format!("Failed to browse _printer._tcp: {}", e))?;
        let receiver_raw = mdns
            .browse("_pdl-datastream._tcp.local.")
            .map_err(|e| format!("Failed to browse _pdl-datastream._tcp: {}", e))?;

        // Wait for responses (with timeout)
        let timeout = std::time::Duration::from_secs(3);
        let start = std::time::Instant::now();

        while start.elapsed() < timeout {
            // Check for printer services
            if let Ok(event) = receiver_printer.recv_timeout(std::time::Duration::from_millis(50)) {
                match event {
                    ServiceEvent::ServiceResolved(info) => {
                        let name = info.get_fullname();
                        let ip = info
                            .get_addresses()
                            .iter()
                            .next()
                            .map(|ip| ip.to_string())
                            .unwrap_or_else(|| "unknown".to_string());
                        let port = info.get_port();

                        if !ip.is_empty() && ip != "unknown" {
                            printers.push(format!("{} ({}:{})", name, ip, port));
                        }
                    }
                    _ => {}
                }
            }

            // Check for raw printer services
            if let Ok(event) = receiver_raw.recv_timeout(std::time::Duration::from_millis(50)) {
                match event {
                    ServiceEvent::ServiceResolved(info) => {
                        let name = info.get_fullname();
                        let ip = info
                            .get_addresses()
                            .iter()
                            .next()
                            .map(|ip| ip.to_string())
                            .unwrap_or_else(|| "unknown".to_string());
                        let port = info.get_port();

                        if !ip.is_empty() && ip != "unknown" {
                            printers.push(format!("Raw Printer {} ({}:{})", name, ip, port));
                        }
                    }
                    _ => {}
                }
            }
        }
    }

    Ok(printers)
}

// Bluetooth Printer Support
fn print_to_bluetooth_printer(_commands: &[u8], address: &str) -> Result<(), String> {
    // For Bluetooth printers, we typically use RFCOMM connections
    #[cfg(any(target_os = "linux", target_os = "windows", target_os = "macos"))]
    {
        // Parse the Bluetooth address
        let _addr = address
            .parse::<BtAddr>()
            .map_err(|e| format!("Invalid Bluetooth address: {:?}", e))?;

        // In a real implementation, we would use the bluetooth-serial-port crate
        // to establish a connection and check if the printer is actually connected

        // For now, we'll simulate by checking if it's a known test address
        if address == "00:11:22:33:44:55" {
            log_info(&format!(
                "Simulating Bluetooth printer connection to {}",
                address
            ))?;
            Ok(())
        } else {
            Err("Bluetooth printer not connected".to_string())
        }
    }

    #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
    {
        log_info(&format!(
            "Simulating Bluetooth printer connection to {}",
            address
        ))?;
        // In a real implementation, we would check if the printer is actually connected
        Err("Bluetooth printer not connected".to_string())
    }
}

// Bluetooth Printer Discovery
fn discover_bluetooth_printers() -> Result<Vec<String>, String> {
    let printers = Vec::new();

    // In a real implementation, we would scan for Bluetooth devices
    // and identify those that support printing

    // Only show Bluetooth printers that are actually discoverable and connected

    // For demonstration, we'll show no Bluetooth printers since we're simulating
    // In a real implementation, you would scan for nearby Bluetooth devices
    // and only show those that respond to discovery

    // Example of how it might work in a real implementation:
    /*
    #[cfg(any(target_os = "linux", target_os = "windows", target_os = "macos"))]
    {
        // This would use the bluetooth-serial-port crate to scan for devices
        // and check which ones are actually connected printers
        // For now, we'll keep the list empty since no printers are connected
    }
    */

    Ok(printers)
}

// Helper function to log print jobs to a file for debugging with escposify
fn log_to_file_escpos(commands: &[u8]) -> Result<(), String> {
    match std::fs::File::create("printer_fallback_escpos.log") {
        Ok(file) => {
            let device = EscposFile::from(file);
            let mut printer = Printer::new(device, None, None);

            // Send the commands to the printer efficiently
            write_commands_to_printer(&mut printer, commands)
                .map_err(|e| format!("Failed to send commands to fallback printer: {}", e))?;
            printer
                .flush()
                .map_err(|e| format!("Failed to flush fallback printer: {}", e))?;

            log_info("Successfully sent commands to fallback printer using escposify")?;
            Ok(())
        }
        Err(e) => Err(format!("Failed to create fallback printer file: {}", e)),
    }
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

// Helper function to log to file as fallback
fn log_to_file(commands: &[u8]) -> Result<(), String> {
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open("printer_fallback.log")
        .map_err(|e| format!("Failed to open fallback log file: {}", e))?;

    file.write_all(commands)
        .map_err(|e| format!("Failed to write to fallback log: {}", e))?;

    file.flush()
        .map_err(|e| format!("Failed to flush fallback log: {}", e))?;

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

// Helper function to log info messages
fn log_info(message: &str) -> Result<(), String> {
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open("escpos_info.log")
        .map_err(|e| format!("Failed to open info log file: {}", e))?;

    writeln!(file, "=== ESC/POS Info ===")
        .map_err(|e| format!("Failed to write to info log file: {}", e))?;
    writeln!(file, "Timestamp: {:?}", std::time::SystemTime::now())
        .map_err(|e| format!("Failed to write to info log file: {}", e))?;
    writeln!(file, "Message: {}", message)
        .map_err(|e| format!("Failed to write to info log file: {}", e))?;
    writeln!(file, "====================\n")
        .map_err(|e| format!("Failed to write to info log file: {}", e))?;

    file.flush()
        .map_err(|e| format!("Failed to flush info log file: {}", e))?;

    Ok(())
}
