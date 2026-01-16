"use client";

import { useCallback, useState } from "react";
import { Repair } from "@/types/repair";
import { InventoryItem } from "@/types/inventory";
import { toast } from "sonner";
import { getShopInfo } from "@/lib/shopInfo";
import { renderStickerHTML } from "@/lib/barcode";

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
  const shopInfo = getShopInfo();
  const [printHistory, setPrintHistory] = useState<PrintHistoryEntry[]>([]);

  const generatePrintContent = useCallback(
    (data: Repair | InventoryItem, options: PrintOptions = {}) => {
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
        : `$${item?.sellingPrice.toFixed(2)}`;

      if (format === "sticker") {
        return renderStickerHTML(data);
      }

      // Basic Receipt HTML (Placeholder for now to avoid total breakage)
      return `
        <html><body><h1>Receipt for ${isRepair ? repair?.customerName : item?.itemName
        }</h1>
        <script>window.onload = () => { window.print(); window.close(); };</script>
        </body></html>
      `;
    },
    []
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
    async (data: Repair | InventoryItem) => {
      try {
        const content = generatePrintContent(data, { format: "sticker" });
        return printDocument(content, data, "sticker");
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to generate sticker: ${errorMsg}`);
        addToPrintHistory(data, "sticker", false, errorMsg);
        return false;
      }
    },
    [generatePrintContent, printDocument, addToPrintHistory]
  );

  const printReceipt = useCallback(
    async (repair: Repair, options: PrintOptions = {}) => {
      try {
        const content = generatePrintContent(repair, { ...options, format: "receipt" });
        return printDocument(content, repair, "receipt");
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to generate receipt: ${errorMsg}`);
        addToPrintHistory(repair, "receipt", false, errorMsg);
        return false;
      }
    },
    [generatePrintContent, printDocument, addToPrintHistory]
  );

  const printStickersBulk = useCallback(
    async (items: (Repair | InventoryItem)[]) => {
      if (items.length === 0) {
        toast.warning("No items selected for printing");
        return false;
      }

      const results = await Promise.allSettled(
        items.map((item) => {
          const content = generatePrintContent(item, { format: "sticker" });
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
    [generatePrintContent, printDocument]
  );

  const printAllStickers = useCallback(
    async (allItems: (Repair | InventoryItem)[]) => {
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
                const content = generatePrintContent(item, {
                  format: "sticker",
                });
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
    [generatePrintContent, printDocument]
  );

  const downloadAsHTML = useCallback(
    (
      data: Repair | InventoryItem,
      format: "receipt" | "sticker" = "receipt"
    ) => {
      try {
        const content = generatePrintContent(data, { format });
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
    [generatePrintContent]
  );

  return {
    printReceipt,
    printSticker,
    printStickersBulk,
    printAllStickers,
    downloadAsHTML,
    generatePrintContent,
    printHistory,
    addToPrintHistory,
  };
};
