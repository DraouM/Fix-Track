// src/lib/printerService.ts
import { invoke } from "@tauri-apps/api/core";
import { PrinterConfig } from "@/types/settings";
import { getPrinterConfig } from "./printerConfig";

export interface ReceiptItemData {
  name: string;
  qty: number;
  price: number;
}

export interface ReceiptData {
  order_id: string;
  customer: string;
  items: ReceiptItemData[];
  total: number;
}

export interface StickerData {
  barcode: string;
  item_name: string;
  price: number;
}

/**
 * Print a receipt directly to the configured receipt printer using ESC/POS
 */
export async function printReceiptDirect(data: ReceiptData, overrideConfig?: PrinterConfig): Promise<void> {
  const config = overrideConfig || getPrinterConfig();
  
  if (!config.useNativePrint) {
    throw new Error("Native printing is disabled in settings");
  }

  try {
    await invoke("print_receipt_direct", { config, data });
  } catch (error) {
    console.error("Direct receipt printing failed:", error);
    throw error;
  }
}

/**
 * Print a sticker directly to the configured sticker printer using TSPL
 */
export async function printStickerDirect(data: StickerData, overrideConfig?: PrinterConfig): Promise<void> {
  const config = overrideConfig || getPrinterConfig();
  
  if (!config.useNativePrint) {
    throw new Error("Native printing is disabled in settings");
  }

  try {
    await invoke("print_sticker_direct", { config, data });
  } catch (error) {
    console.error("Direct sticker printing failed:", error);
    throw error;
  }
}
