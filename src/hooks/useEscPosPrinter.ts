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
    commands: Uint8Array
  ): Promise<{ success: boolean; message: string }> => {
    try {
      // Convert Uint8Array to regular array for Tauri serialization
      const commandsArray = Array.from(commands);

      // Send commands to Tauri backend
      const result = await invoke<string>("print_escpos_commands", {
        commands: commandsArray,
      });

      console.log("Print result:", result);
      return { success: true, message: result };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to send print commands:", errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Get available printers from Tauri backend
  const getAvailablePrinters = async (): Promise<{
    success: boolean;
    printers: string[];
    message?: string;
  }> => {
    try {
      const printers = await invoke<string[]>("get_available_printers");
      return { success: true, printers };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to get available printers:", errorMessage);
      return { success: false, printers: [], message: errorMessage };
    }
  };

  // Generate ESC/POS commands for a receipt
  const generateReceiptCommands = (
    repair: Repair,
    options: EscPosPrintOptions = {}
  ): Uint8Array => {
    const {
      includePayments = true,
      includeParts = true,
      autoCut = true,
    } = options;

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
      .text(`Order #: ${repair.id}`)
      .newline()
      .text(`Date: ${formatPrintDate(repair.createdAt)}`)
      .newline()
      .text(`Status: ${repair.status}`)
      .newline()
      .newline()
      .text("--------------------------------")
      .newline()
      .text(`CUSTOMER:`)
      .newline()
      .text(repair.customerName)
      .newline()
      .text(repair.customerPhone)
      .newline()
      .newline()
      .text("--------------------------------")
      .newline()
      .text(`DEVICE:`)
      .newline()
      .text(`${repair.deviceBrand} ${repair.deviceModel}`)
      .newline()
      .text("Issue:")
      .newline()
      .text(repair.issueDescription)
      .newline()
      .newline()
      .text("--------------------------------");

    // Add parts if requested
    if (includeParts && repair.usedParts && repair.usedParts.length > 0) {
      encoder.newline().newline().text("PARTS USED:").newline();
      repair.usedParts.forEach((part) => {
        encoder
          .text(
            `${part.partName} x${part.quantity}      $${part.cost.toFixed(2)}`
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
      .text(`REPAIR COST:              $${repair.estimatedCost.toFixed(2)}`);

    // Add payments if requested
    if (includePayments && repair.payments && repair.payments.length > 0) {
      encoder.newline().newline().text("PAYMENTS:").newline();
      repair.payments.forEach((payment) => {
        encoder
          .text(
            `${formatPrintDate(payment.date)}      $${payment.amount.toFixed(
              2
            )}`
          )
          .newline();
      });

      const totalPaid = repair.payments.reduce((sum, p) => sum + p.amount, 0);
      const balance = repair.estimatedCost - totalPaid;

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
      const balance = repair.estimatedCost;
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

    // Add barcode
    encoder.barcode(repair.id, "code128", { width: 2, height: 40 });

    // Add auto-cut if requested
    if (autoCut) {
      encoder.cut("full");
    }

    // Generate and return the commands
    return encoder.encode();
  };

  // Generate ESC/POS commands for a sticker
  const generateStickerCommands = (
    repair: Repair,
    options: EscPosPrintOptions = {}
  ): Uint8Array => {
    const { autoCut = true } = options;

    // Use the default export correctly
    const encoder = new ReceiptPrinterEncoder();

    // Build the sticker content
    encoder
      .initialize()
      .align("center")
      .text("YOUR REPAIR SHOP")
      .newline()
      .text(`#${repair.id}`)
      .newline()
      .size("double-width-double-height")
      .text(`${repair.deviceBrand} ${repair.deviceModel}`)
      .newline()
      .text(
        repair.issueDescription.length > 25
          ? `${repair.issueDescription.substring(0, 25)}...`
          : repair.issueDescription
      )
      .newline()
      .text(`${repair.customerPhone}`)
      .newline()
      .text(`${formatPrintDate(repair.createdAt).split(",")[0]}`);

    // Add auto-cut if requested
    if (autoCut) {
      encoder.cut("full");
    }

    // Generate and return the commands
    return encoder.encode();
  };

  return {
    generateReceiptCommands,
    generateStickerCommands,
    sendToPrinter,
    getAvailablePrinters,
  };
};
