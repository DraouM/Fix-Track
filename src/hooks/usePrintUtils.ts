"use client";

import { useCallback, useState } from "react";
import { Payment, Repair } from "@/types/repair";
import { InventoryItem } from "@/types/inventory";
import { toast } from "sonner";
import { getShopInfo } from "@/lib/shopInfo";
import { renderStickerHTML } from "@/lib/barcode";
import {
  renderRepairReceiptHTML,
  renderPaymentReceiptHTML,
  renderTransactionReceiptHTML,
} from "@/lib/printTemplates";
import { Transaction, TransactionItem, TransactionPayment } from "@/types/transaction";
import { invoke } from "@tauri-apps/api/core";
import { clientSchema } from "@/types/client"; // Import for type usage if needed, or just rely on 'any' for now as in template

import { useSettings } from "@/context/SettingsContext";
import { CURRENCY_SYMBOLS } from "@/types/settings";
import { useRouter } from "next/navigation";

interface PrintOptions {
  includePayments?: boolean;
  includeParts?: boolean;
  includeHistory?: boolean;
  format?: "receipt" | "sticker" | "invoice";
}

interface PrintHistoryEntry {
  id: string;
  item: Repair | InventoryItem;
  type: "sticker" | "receipt";
  timestamp: Date;
  success: boolean;
  message?: string;
}

export const usePrintUtils = () => {
  const { settings } = useSettings();
  const shopInfo = getShopInfo();
  const router = useRouter();
  const [printHistory, setPrintHistory] = useState<PrintHistoryEntry[]>([]);

  const generatePrintContent = useCallback(
    (
      data: Repair | InventoryItem,
      options: PrintOptions = {},
      language?: string,
      currency?: "USD" | "EUR" | "MAD" | "GBP" | "DZD"
    ) => {
      const lang = language || settings.language;
      const curr = currency || settings.currency;
      const { format = "receipt" } = options;
      const isRepair = "deviceBrand" in data;
      const repair = isRepair ? (data as Repair) : null;
      const item = !isRepair ? (data as InventoryItem) : null;

      const barcodeValue = isRepair
        ? repair?.code || repair?.id
        : item?.barcode || item?.id;
      const title = isRepair
        ? `${repair?.deviceBrand} ${repair?.deviceModel}`
        : item?.phoneBrand;
      const mainText = isRepair ? repair?.issueDescription : item?.itemName;
      const subText = isRepair
        ? repair?.customerPhone
        : `${CURRENCY_SYMBOLS[curr]}${item?.sellingPrice.toFixed(2)}`;

      if (format === "sticker") {
        return renderStickerHTML(data);
      }

      if (format === "receipt" && isRepair) {
        return renderRepairReceiptHTML(
          repair as Repair,
          options,
          lang,
          curr,
          "/logo_shop.svg"
        );
      }

      // Fallback Receipt HTML
      return `
        <html><body><h1>Receipt for ${isRepair ? repair?.customerName : item?.itemName
        }</h1>
        <script>window.onload = () => { window.print(); window.close(); };</script>
        </body></html>
      `;
    },
    [settings]
  );

  const addToPrintHistory = useCallback(
    (
      item: Repair | InventoryItem,
      type: "sticker" | "receipt",
      success: boolean,
      message?: string
    ) => {
      const historyEntry: PrintHistoryEntry = {
        id: `${type}-${item.id}-${Date.now()}`,
        item,
        type,
        timestamp: new Date(),
        success,
        message,
      };
      setPrintHistory((prev) => [historyEntry, ...prev.slice(0, 49)]); // Keep last 50 entries
    },
    []
  );

  const printDocument = useCallback(
    async (
      htmlContent: string,
      item: Repair | InventoryItem,
      type: "sticker" | "receipt"
    ) => {
      // 1. Basic configuration check
      const config = settings.printerConfig;
      const printerName = type === "receipt" ? config.receiptPrinterName : config.stickerPrinterName;

      if (!printerName && config.useNativePrint) {
        toast.error(`No ${type} printer selected!`, {
          description: "Please select a printer in the settings to use native printing.",
          action: {
            label: "Go to Settings",
            onClick: () => router.push("/settings"),
          },
        });
        return false;
      }

      try {
        // Mode check: Browser vs Native
        if (!config.useNativePrint) {
          // Browser Print Fallback
          const iframe = document.createElement("iframe");
          iframe.style.position = "absolute";
          iframe.style.left = "-9999px";
          iframe.style.visibility = "hidden";
          document.body.appendChild(iframe);
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc) {
            doc.write(htmlContent);
            doc.close();
            iframe.onload = () => {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
              setTimeout(() => document.body.removeChild(iframe), 1000);
            };
          }
          return true;
        }

        // Native Direct Thermal Implementation
        if (type === "sticker") {
          const stickerData = {
            barcode: ("barcode" in item ? item.barcode : (item as Repair).code) || item.id,
            item_name: ("itemName" in item ? item.itemName : `${(item as Repair).deviceBrand} ${(item as Repair).deviceModel}`) || "Unknown",
            price: "sellingPrice" in item ? item.sellingPrice : 0,
          };

          await invoke("print_sticker_direct", { config, data: stickerData });
          toast.success(`Sticker sent to ${config.stickerPrinterName}`);
        } else {
          // Receipt
          const isRepair = "deviceBrand" in item;
          const repair = isRepair ? (item as Repair) : null;
          
          const receiptData = {
            orderId: isRepair ? repair?.code || repair?.id : item.id,
            customer: isRepair ? repair?.customerName : "Walk-in Customer",
            device: isRepair ? `${repair?.deviceBrand} ${repair?.deviceModel}` : undefined,
            issue: isRepair ? repair?.issueDescription : undefined,
            items: isRepair 
              ? (repair?.usedParts?.map(p => ({ name: p.partName, qty: p.quantity, price: p.cost })) || [])
              : [{ name: (item as InventoryItem).itemName, qty: 1, price: (item as InventoryItem).sellingPrice }],
            total: isRepair ? repair?.estimatedCost || 0 : (item as InventoryItem).sellingPrice,
            shopInfo: {
              shopName: shopInfo.shopName,
              phoneNumber: shopInfo.phoneNumber,
              address: shopInfo.address,
              receiptFooter: shopInfo.receiptFooter,
            },
            date: new Date().toLocaleString(),
          };

          await invoke("print_receipt_direct", { config, data: receiptData });
          toast.success(`Receipt sent to ${config.receiptPrinterName}`);
        }

        addToPrintHistory(item, type, true);
        return true;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        toast.error(`Native Print Error: ${errorMsg}`);
        addToPrintHistory(item, type, false, errorMsg);
        return false;
      }
    },
    [settings.printerConfig, addToPrintHistory, router]
  );

  const printSticker = useCallback(
    async (
      data: Repair | InventoryItem,
      language?: string,
      currency?: "USD" | "EUR" | "MAD" | "GBP" | "DZD"
    ) => {
      try {
        const content = generatePrintContent(
          data,
          { format: "sticker" },
          language || settings.language,
          currency || settings.currency
        );
        return printDocument(content, data, "sticker");
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to generate sticker: ${errorMsg}`);
        addToPrintHistory(data, "sticker", false, errorMsg);
        return false;
      }
    },
    [generatePrintContent, printDocument, addToPrintHistory, settings]
  );

  const printReceipt = useCallback(
    async (
      repair: Repair,
      options: PrintOptions = {},
      language?: string,
      currency?: "USD" | "EUR" | "MAD" | "GBP" | "DZD"
    ) => {
      try {
        const content = generatePrintContent(
          repair,
          {
            ...options,
            format: "receipt",
          },
          language || settings.language,
          currency || settings.currency
        );
        return printDocument(content, repair, "receipt");
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to generate receipt: ${errorMsg}`);
        addToPrintHistory(repair, "receipt", false, errorMsg);
        return false;
      }
    },
    [generatePrintContent, printDocument, addToPrintHistory, settings]
  );

  const printPaymentReceipt = useCallback(
    async (
      payment: Payment,
      customerName?: string,
      referenceCode?: string,
      language?: string,
      currency?: "USD" | "EUR" | "MAD" | "GBP" | "DZD",
      previousBalance?: number
    ) => {
      try {
        const content = renderPaymentReceiptHTML(
          payment,
          customerName,
          referenceCode,
          language || settings.language,
          currency || settings.currency,
          "/logo_shop.svg",
          previousBalance
        );
        return printDocument(content, { id: payment.id } as any, "receipt");
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to generate payment receipt: ${errorMsg}`);
        return false;
      }
    },
    [printDocument, settings]
  );

  const printTransactionReceipt = useCallback(
    async (
      transaction: Transaction,
      items: TransactionItem[],
      payments: TransactionPayment[],
      client: any,
      previousBalance: number,
      language?: string,
      currency?: "USD" | "EUR" | "MAD" | "GBP" | "DZD"
    ) => {
      try {
        const content = renderTransactionReceiptHTML(
          transaction,
          items,
          payments,
          client,
          previousBalance,
          language || settings.language,
          currency || settings.currency,
          "/logo_shop.svg"
        );
        // Casting transaction to any to satisfy the minimal interface required by printDocument/addToPrintHistory
        // effectively treating it as an item with an id.
        return printDocument(content, transaction as any, "receipt");
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to generate transaction receipt: ${errorMsg}`);
        return false;
      }
    },
    [printDocument, settings]
  );

  const printStickersBulk = useCallback(
    async (
      items: (Repair | InventoryItem)[],
      language?: string,
      currency?: "USD" | "EUR" | "MAD" | "GBP" | "DZD"
    ) => {
      if (items.length === 0) {
        toast.warning("No items selected for printing");
        return false;
      }

      const results = await Promise.allSettled(
        items.map((item) => {
          const content = generatePrintContent(
            item,
            { format: "sticker" },
            language || settings.language,
            currency || settings.currency
          );
          return printDocument(content, item, "sticker");
        })
      );

      const succeeded = results.filter(
        (r) => r.status === "fulfilled" && r.value
      ).length;
      const failed = results.length - succeeded;

      if (failed > 0) {
        toast.error(
          `Successfully printed ${succeeded} stickers, ${failed} failed`
        );
      } else {
        toast.success(`Successfully printed ${succeeded} stickers!`);
      }

      return succeeded > 0;
    },
    [generatePrintContent, printDocument, settings]
  );

  const printAllStickers = useCallback(
    async (
      allItems: (Repair | InventoryItem)[],
      language?: string,
      currency?: "USD" | "EUR" | "MAD" | "GBP" | "DZD"
    ) => {
      if (allItems.length === 0) {
        toast.warning("No items available to print");
        return false;
      }

      toast.promise(
        new Promise<boolean>((resolve) => {
          // Process in batches to avoid overwhelming the browser
          const batchSize = 5;
          let processed = 0;
          let succeeded = 0;

          const processBatch = () => {
            const batch = allItems.slice(processed, processed + batchSize);
            if (batch.length === 0) {
              toast.success(`Finished printing all ${succeeded} stickers!`);
              resolve(succeeded > 0);
              return;
            }

            Promise.allSettled(
              batch.map((item) => {
                const content = generatePrintContent(
                  item,
                  {
                    format: "sticker",
                  },
                  language || settings.language,
                  currency || settings.currency
                );
                return printDocument(content, item, "sticker");
              })
            ).then((results) => {
              results.forEach((result, index) => {
                if (result.status === "fulfilled" && result.value) {
                  succeeded++;
                }
              });
              processed += batchSize;

              // Small delay between batches
              setTimeout(processBatch, 100);
            });
          };

          processBatch();
        }),
        {
          loading: `Printing all ${allItems.length} stickers...`,
          success: () => `All stickers printed successfully!`,
          error: "Failed to print some stickers",
        }
      );

      return true;
    },
    [generatePrintContent, printDocument, settings]
  );

  const downloadAsHTML = useCallback(
    (
      data: Repair | InventoryItem,
      format: "receipt" | "sticker" = "receipt",
      language?: string,
      currency?: "USD" | "EUR" | "MAD" | "GBP" | "DZD"
    ) => {
      try {
        const content = generatePrintContent(
          data,
          { format },
          language || settings.language,
          currency || settings.currency
        );
        const blob = new Blob([content], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${format}-${(data as any).code || data.id}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(`📄 ${format} downloaded!`);
        return true;
      } catch (error) {
        console.error("Download error:", error);
        toast.error("Failed to download file");
        return false;
      }
    },
    [generatePrintContent, settings]
  );

  /**
   * Sequential Repair Print: Receipt then Sticker
   */
  const printRepairSequence = useCallback(
    async (repair: Repair) => {
      toast.info("Starting print sequence...");
      
      // 1. Print Receipt
      const receiptSuccess = await printReceipt(repair, {
        includePayments: true,
        includeParts: true,
      });

      if (!receiptSuccess) {
        toast.error("Receipt print failed. Aborting sequence.");
        return false;
      }

      // Small delay between prints to allow spooler to breathe
      await new Promise(r => setTimeout(r, 1000));

      // 2. Print Sticker
      const stickerSuccess = await printSticker(repair);
      
      if (stickerSuccess) {
        toast.success("Full repair sequence completed!");
      }

      return stickerSuccess;
    },
    [printReceipt, printSticker]
  );

  /**
   * Opens a preview of the receipt in a new window
   * This is useful for "Save as PDF" or standard office printers
   */
  const previewReceipt = useCallback(
    (repair: Repair, options: PrintOptions = {}) => {
      const content = generatePrintContent(
        repair,
        { ...options, format: "receipt" },
        settings.language,
        settings.currency
      );

      const previewWindow = window.open("", "_blank", "width=800,height=600");
      if (previewWindow) {
        previewWindow.document.write(content);
        previewWindow.document.close();
        // The template should already contain the window.print() logic in its fallback, 
        // but we can trigger it here to be sure.
        previewWindow.focus();
      } else {
        toast.error("Pop-up blocked! Please allow pop-ups to see the preview.");
      }
    },
    [generatePrintContent, settings]
  );

  return {
    printReceipt,
    previewReceipt, // Added preview
    printPaymentReceipt,
    printTransactionReceipt,
    printSticker,
    printStickersBulk,
    printAllStickers,
    downloadAsHTML,
    generatePrintContent,
    printHistory,
    addToPrintHistory,
    printRepairSequence,
  };
};
