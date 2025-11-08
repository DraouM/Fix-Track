// hooks/useEscPosPrinter.ts
"use client";

// Use default import
import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";

import { Repair } from "@/types/repair";

// Add Tauri import for invoking commands
import { invoke } from "@tauri-apps/api/core";

interface EscPosPrintOptions {
  includePayments?: boolean;
  includeParts?: boolean;
  includeHistory?: boolean;
  autoCut?: boolean;
}

// Add interface for printer status
interface PrinterStatus {
  online: boolean;
  paperStatus: "ok" | "low" | "empty";
  errorStatus: "ok" | "cover_open" | "paper_jam" | "head_overheat" | "other";
  message: string;
}

export const useEscPosPrinter = () => {
  // Format date for printing
  const formatPrintDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Send ESC/POS commands to printer via Tauri backend
  const sendToPrinter = async (
    commands: Uint8Array,
    printerAddress?: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      // Validate input
      if (!commands || commands.length === 0) {
        return { success: false, message: "No print commands provided" };
      }

      // Limit command size to prevent buffer overflows
      if (commands.length > 1024 * 1024) {
        // 1MB limit
        return { success: false, message: "Print commands too large" };
      }

      // Convert Uint8Array to regular array for Tauri serialization
      const commandsArray = Array.from(commands);

      // Send commands to Tauri backend with timeout
      const result = await Promise.race([
        invoke<string>("print_escpos_commands", {
          commands: commandsArray,
          printer_address: printerAddress || null,
        }),
        new Promise<string>((_, reject) =>
          setTimeout(
            () => reject(new Error("Printer communication timed out")),
            10000
          )
        ),
      ]);

      console.log("Print result:", result);
      return { success: true, message: result as string };
    } catch (error) {
      // Handle different error types (Tauri errors, standard Errors, strings, etc.)
      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error && typeof error === "object" && "message" in error) {
        errorMessage = String(error.message);
      }
      console.error("Failed to send print commands:", errorMessage);

      // Provide user-friendly error messages
      if (errorMessage.includes("timeout")) {
        return {
          success: false,
          message:
            "Printer communication timed out. Please check your printer connection.",
        };
      } else if (errorMessage.includes("large")) {
        return { success: false, message: "Print data too large for printer" };
      } else {
        return {
          success: false,
          message:
            "Failed to communicate with printer. Please check connection and try again.",
        };
      }
    }
  };

  // Get available printers from Tauri backend
  const getAvailablePrinters = async (): Promise<{
    success: boolean;
    printers: string[];
    message?: string;
  }> => {
    try {
      // Add timeout to prevent hanging
      const printers = await Promise.race([
        invoke<string[]>("get_available_printers"),
        new Promise<string[]>((_, reject) =>
          setTimeout(
            () => reject(new Error("Printer discovery timed out")),
            15000
          )
        ),
      ]);

      // Validate printers array
      if (!Array.isArray(printers)) {
        return {
          success: false,
          printers: [],
          message: "Invalid printer data received",
        };
      }

      return { success: true, printers };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to get available printers:", errorMessage);

      // Provide user-friendly error messages
      if (errorMessage.includes("timeout")) {
        return {
          success: false,
          printers: [],
          message: "Printer discovery timed out. Please try again.",
        };
      } else {
        return {
          success: false,
          printers: [],
          message:
            "Failed to discover printers. Please check connections and try again.",
        };
      }
    }
  };

  // Get printer status from Tauri backend
  const getPrinterStatus = async (
    printerName: string
  ): Promise<{
    success: boolean;
    status: PrinterStatus;
    message?: string;
  }> => {
    try {
      // Validate input
      if (!printerName) {
        return {
          success: false,
          status: {
            online: false,
            paperStatus: "ok",
            errorStatus: "other",
            message: "No printer name provided",
          },
          message: "No printer name provided",
        };
      }

      // Limit printer name length
      if (printerName.length > 256) {
        return {
          success: false,
          status: {
            online: false,
            paperStatus: "ok",
            errorStatus: "other",
            message: "Printer name too long",
          },
          message: "Printer name too long",
        };
      }

      const statusString = await invoke<string>("get_printer_status", {
        printerName,
      });

      // Parse the status string into a PrinterStatus object
      // In a real implementation, this would be a proper JSON response
      const status: PrinterStatus = {
        online: true,
        paperStatus: "ok",
        errorStatus: "ok",
        message: statusString as string,
      };

      return { success: true, status };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to get printer status:", errorMessage);

      // Return offline status on error
      const status: PrinterStatus = {
        online: false,
        paperStatus: "ok",
        errorStatus: "other",
        message: errorMessage,
      };

      return { success: false, status, message: errorMessage };
    }
  };

  // Generate ESC/POS commands for a receipt
  const generateReceiptCommands = (
    repair: Repair,
    options: EscPosPrintOptions = {}
  ): Uint8Array => {
    try {
      const {
        includePayments = true,
        includeParts = true,
        autoCut = true,
      } = options;

      // Validate repair data
      if (!repair) {
        throw new Error("Invalid repair data provided");
      }

      // Use the default export correctly
      const encoder = new ReceiptPrinterEncoder();

      // Start building the receipt
      encoder
        .initialize()
        .align("center")
        .size("double-width-double-height")
        .text("YOUR REPAIR SHOP")
        .newline()
        .text("123 Main St, City, State")
        .newline()
        .text("Tel: (555) 123-4567")
        .newline()
        .newline()
        .align("center")
        .size("double-width-double-height")
        .text("REPAIR RECEIPT")
        .newline()
        .newline()
        .align("left")
        .text(`Order #: ${repair.id || "N/A"}`)
        .newline()
        .text(
          `Date: ${
            repair.createdAt ? formatPrintDate(repair.createdAt) : "N/A"
          }`
        )
        .newline()
        .text(`Status: ${repair.status || "Unknown"}`)
        .newline()
        .newline()
        .text("--------------------------------")
        .newline()
        .text(`CUSTOMER:`)
        .newline()
        .text(repair.customerName || "Unknown Customer")
        .newline()
        .text(repair.customerPhone || "No phone provided")
        .newline()
        .newline()
        .text("--------------------------------")
        .newline()
        .text(`DEVICE:`)
        .newline()
        .text(
          `${repair.deviceBrand || "Unknown"} ${repair.deviceModel || "Device"}`
        )
        .newline()
        .text("Issue:")
        .newline()
        .text(repair.issueDescription || "No description provided")
        .newline()
        .newline()
        .text("--------------------------------");

      // Add parts if requested and available
      if (
        includeParts &&
        repair.usedParts &&
        Array.isArray(repair.usedParts) &&
        repair.usedParts.length > 0
      ) {
        encoder.newline().newline().text("PARTS USED:").newline();
        repair.usedParts.forEach((part) => {
          encoder
            .text(
              `${part.partName || "Unknown part"} x${
                part.quantity || 0
              }      $${(part.cost || 0).toFixed(2)}`
            )
            .newline();
        });
        encoder.text("--------------------------------");
      }

      // Financial summary
      encoder
        .newline()
        .newline()
        .align("left")
        .text(
          `REPAIR COST:              $${(repair.estimatedCost || 0).toFixed(2)}`
        );

      // Add payments if requested and available
      if (
        includePayments &&
        repair.payments &&
        Array.isArray(repair.payments) &&
        repair.payments.length > 0
      ) {
        encoder.newline().newline().text("PAYMENTS:").newline();
        repair.payments.forEach((payment) => {
          encoder
            .text(
              `${payment.date ? formatPrintDate(payment.date) : "N/A"}      $${(
                payment.amount || 0
              ).toFixed(2)}`
            )
            .newline();
        });

        const totalPaid = (repair.payments || []).reduce(
          (sum, p) => sum + (p.amount || 0),
          0
        );
        const balance = (repair.estimatedCost || 0) - totalPaid;

        encoder
          .text("--------------------------------")
          .newline()
          .text(`TOTAL PAID:               $${totalPaid.toFixed(2)}`)
          .newline()
          .text("================================")
          .newline()
          .size("double-width-double-height")
          .text(`BALANCE DUE:              $${balance.toFixed(2)}`)
          .newline();
      } else {
        const balance = repair.estimatedCost || 0;
        encoder
          .newline()
          .text("================================")
          .newline()
          .size("double-width-double-height")
          .text(`BALANCE DUE:              $${balance.toFixed(2)}`)
          .newline();
      }

      encoder
        .align("center")
        .text("--------------------------------")
        .newline()
        .text("Thank you for your business!")
        .newline()
        .text("30-day warranty on parts & labor")
        .newline()
        .text("Keep this receipt for your records")
        .newline()
        .newline();

      // Add barcode if repair ID exists
      if (repair.id) {
        encoder.barcode(repair.id, "code128", { width: 2, height: 40 });
      }

      // Add auto-cut if requested
      if (autoCut) {
        encoder.cut("full");
      }

      // Generate and return the commands
      return encoder.encode();
    } catch (error) {
      console.error("Error generating receipt commands:", error);
      throw new Error(
        `Failed to generate receipt: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Generate ESC/POS commands for a sticker
  const generateStickerCommands = (
    repair: Repair,
    options: EscPosPrintOptions = {}
  ): Uint8Array => {
    try {
      const { autoCut = true } = options;

      // Validate repair data
      if (!repair) {
        throw new Error("Invalid repair data provided");
      }

      // Use the default export correctly
      const encoder = new ReceiptPrinterEncoder();

      // Build the sticker content
      encoder
        .initialize()
        .align("center")
        .text("YOUR REPAIR SHOP")
        .newline()
        .text(`#${repair.id || "N/A"}`)
        .newline()
        .size("double-width-double-height")
        .text(
          `${repair.deviceBrand || "Unknown"} ${repair.deviceModel || "Device"}`
        )
        .newline()
        .text(
          (repair.issueDescription || "No issue").length > 25
            ? `${(repair.issueDescription || "No issue").substring(0, 25)}...`
            : repair.issueDescription || "No issue"
        )
        .newline()
        .text(`${repair.customerPhone || "No phone"}`)
        .newline()
        .text(
          `${
            repair.createdAt
              ? formatPrintDate(repair.createdAt).split(",")[0]
              : "N/A"
          }`
        );

      // Add auto-cut if requested
      if (autoCut) {
        encoder.cut("full");
      }

      // Generate and return the commands
      return encoder.encode();
    } catch (error) {
      console.error("Error generating sticker commands:", error);
      throw new Error(
        `Failed to generate sticker: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return {
    generateReceiptCommands,
    generateStickerCommands,
    sendToPrinter,
    getAvailablePrinters,
    getPrinterStatus,
  };
};
