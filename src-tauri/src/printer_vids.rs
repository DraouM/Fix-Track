// src-tauri/src/printer_vids.rs
// VID lists for printer identification

/// Common ESC/POS printer VIDs
pub const ESCPOS_VIDS: &[&str] = &[
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

/// Common non-ESC/POS printer VIDs (for identification only)
pub const NON_ESCPOS_VIDS: &[&str] = &[
    "03f0", // HP (some models)
    "04f9", // Brother (some models)
    "04a9", // Canon
    "043d", // Lexmark
    "0409", // NEC
    "0425", // Toshiba
    "04dd", // Sharp
    "051f", // OKI
    "0764", // Cyber Power System
    "0765", // Xerox
    "07cd", // JVC
    "0924", // Xerox
    "0b2c", // Canon
    "0b62", // Oki Data
    "0b8c", // Canon
    "0c2e", // Metrologic Instruments
    "0c45", // Microdia
];
