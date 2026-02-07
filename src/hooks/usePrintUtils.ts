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
import { clientSchema } from "@/types/client"; // Import for type usage if needed, or just rely on 'any' for now as in template

import { useSettings } from "@/context/SettingsContext";
import { CURRENCY_SYMBOLS } from "@/types/settings";

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
    (
      htmlContent: string,
      item: Repair | InventoryItem,
      type: "sticker" | "receipt"
    ) => {
      try {
        // Try iframe-based printing first to avoid popup blockers
        const iframe = document.createElement("iframe");
        iframe.style.position = "absolute";
        iframe.style.left = "-9999px";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "none";
        iframe.style.visibility = "hidden";

        document.body.appendChild(iframe);

        const iframeDoc =
          iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.write(htmlContent);
          iframeDoc.close();

          // Wait for content to load before printing
          iframe.onload = () => {
            try {
              if (iframe.contentWindow) {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();

                // Success notification after a brief delay
                setTimeout(() => {
                  toast.success(
                    `${type === "sticker" ? "Sticker" : "Receipt"
                    } sent to printer!`
                  );
                  addToPrintHistory(item, type, true);
                }, 500);
              }
            } catch (printErr) {
              console.error("Iframe print failed:", printErr);
              // If iframe printing fails, try window.open as fallback
              try {
                // Add the print script for window.open method
                const htmlWithPrintScript = htmlContent.replace(
                  "</body>",
                  `
    <script>
      window.onload = () => {
        setTimeout(() => {
          window.print();
          setTimeout(() => window.close(), 100);
        }, 500);
      };
    </script>
  </body>`
                );

                const printWindow = window.open(
                  "",
                  "_blank",
                  "width=400,height=500"
                );
                if (!printWindow) {
                  const errorMsg = "Popup blocked! Enable popups to print.";
                  toast.error(errorMsg);
                  addToPrintHistory(item, type, false, errorMsg);
                  document.body.removeChild(iframe);
                  return false;
                }

                printWindow.document.write(htmlWithPrintScript);
                printWindow.document.close();

                printWindow.onload = () => {
                  setTimeout(() => {
                    toast.success(
                      `${type === "sticker" ? "Sticker" : "Receipt"
                      } sent to printer!`
                    );
                    addToPrintHistory(item, type, true);
                  }, 1000);
                };
              } catch (fallbackErr) {
                console.error("Fallback print also failed:", fallbackErr);
                const errorMsg = "Both print methods failed.";
                toast.error(errorMsg);
                addToPrintHistory(item, type, false, errorMsg);
              }
            }

            // Clean up the iframe after a delay
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 2000);
          };

          return true;
        } else {
          // Fallback to window.open if iframe fails
          // Add the print script for window.open method
          const htmlWithPrintScript = htmlContent.replace(
            "</body>",
            `
    <script>
      window.onload = () => {
        setTimeout(() => {
          window.print();
          setTimeout(() => window.close(), 100);
        }, 500);
      };
    </script>
  </body>`
          );

          const printWindow = window.open("", "_blank", "width=400,height=500");
          if (!printWindow) {
            const errorMsg = "Popup blocked! Enable popups to print.";
            toast.error(errorMsg);
            addToPrintHistory(item, type, false, errorMsg);
            return false;
          }

          printWindow.document.write(htmlWithPrintScript);
          printWindow.document.close();

          printWindow.onload = () => {
            setTimeout(() => {
              toast.success(
                `${type === "sticker" ? "Sticker" : "Receipt"} sent to printer!`
              );
              addToPrintHistory(item, type, true);
            }, 1000);
          };

          return true;
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to print: ${errorMsg}`);
        addToPrintHistory(item, type, false, errorMsg);
        return false;
      }
    },
    [addToPrintHistory]
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

  return {
    printReceipt,
    printPaymentReceipt,
    printTransactionReceipt,
    printSticker,
    printStickersBulk,
    printAllStickers,
    downloadAsHTML,
    generatePrintContent,
    printHistory,
    addToPrintHistory,
  };
};
