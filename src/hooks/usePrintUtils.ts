// hooks/usePrintUtils.ts
"use client";

import { useCallback, useState } from "react";
import { Repair } from "@/types/repair";
import { toast } from "sonner";
import { ReceiptTemplate } from "@/components/helpers/ReceiptTemplate";
import { StickerTemplate } from "@/components/helpers/StickerTemplate";
import { useEscPosPrinter } from "./useEscPosPrinter";

interface PrintOptions {
  includePayments?: boolean;
  includeParts?: boolean;
  includeHistory?: boolean;
  format?: "receipt" | "sticker" | "invoice";
  useEscPos?: boolean;
  printerName?: string;
  printerAddress?: string; // Printer address (IP:PORT, USB:path, or Bluetooth address)
}

export const usePrintUtils = () => {
  const { generateReceiptCommands, generateStickerCommands, sendToPrinter } =
    useEscPosPrinter();

  // State for printer selection dialog
  const [isPrinterSelectionOpen, setIsPrinterSelectionOpen] = useState(false);
  const [pendingPrintJob, setPendingPrintJob] = useState<{
    repair: Repair;
    options?: PrintOptions;
    type: "receipt" | "sticker";
  } | null>(null);

  // Format date for printing
  const formatPrintDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Generate print content HTML using optimized components
  const generatePrintContent = useCallback(
    (repair: Repair, options: PrintOptions = {}) => {
      const {
        format = "receipt",
        includePayments = true,
        includeParts = true,
      } = options;

      if (format === "sticker") {
        // We'll use innerHTML approach for sticker since it's simpler
        const stickerHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Repair Sticker - ${repair.id}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              @media print {
                @page {
                  size: 2in 1in;
                  margin: 0;
                }
                body { 
                  font-family: Arial, Helvetica, sans-serif;
                  font-size: 4px;
                  line-height: 1.0;
                  color: #000;
                  background: white;
                  width: 2in;
                  height: 1in;
                  padding: 0.5mm;
                }
                .phone-sticker {
                  width: 2in !important;
                  height: 1in !important;
                  padding: 0.5mm !important;
                  box-sizing: border-box !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="phone-sticker">
              <div style="display: flex; flex-direction: column; height: 100%; gap: 0.2mm;">
                <!-- Header - Shop name and Order # -->
                <div style="text-align: center; border-bottom: 0.5px solid #000; padding-bottom: 0.3mm; font-size: 5px; font-weight: bold;">
                  <div>YOUR REPAIR SHOP</div>
                  <div style="font-size: 4px;">#${repair.id}</div>
                </div>

                <!-- Device Info - Compact -->
                <div style="font-size: 5px; text-align: center; font-weight: bold;">
                  ${repair.deviceBrand} ${repair.deviceModel}
                </div>

                <!-- Issue description - truncated -->
                <div style="font-size: 4px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${repair.issueDescription.substring(0, 25)}${
          repair.issueDescription.length > 25 ? "..." : ""
        }
                </div>

                <!-- Bottom row: Phone and Date -->
                <div style="display: flex; justify-content: space-between; font-size: 4px; margin-top: auto; padding-top: 0.3mm; border-top: 0.5px solid #000;">
                  <span>${repair.customerPhone}</span>
                  <span>${
                    formatPrintDate(repair.createdAt).split(",")[0]
                  }</span>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;
        return stickerHTML;
      }

      // For receipt, generate HTML that will use our optimized ReceiptTemplate
      const receiptHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Repair Receipt - ${repair.id}</title>
            <style>
              ${document.querySelector("#print-styles")?.textContent || ""}
              @media print {
                @page {
                  size: 80mm auto;
                  margin: 0;
                }
              }
            </style>
          </head>
          <body>
            <div id="receipt-print-template" class="print-active" data-print-type="receipt">
              <div class="thermal-receipt" style="width: 80mm; padding: 3mm; font-family: 'Courier New', Courier, monospace; font-size: 9px; line-height: 1.2; color: #000; background-color: #fff;">
                <!-- Header - Shop Name -->
                <div style="text-align: center; margin-bottom: 6px; border-bottom: 1px dashed #000; padding-bottom: 6px;">
                  <div style="font-size: 12px; font-weight: bold; margin-bottom: 2px;">YOUR REPAIR SHOP</div>
                  <div style="font-size: 8px;">123 Main St, City, State</div>
                  <div style="font-size: 8px;">Tel: (555) 123-4567</div>
                </div>

                <!-- Receipt Type -->
                <div style="text-align: center; font-size: 10px; font-weight: bold; margin: 4px 0;">REPAIR RECEIPT</div>

                <!-- Order Info -->
                <div style="margin-bottom: 4px; font-size: 8px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span>Order #:</span>
                    <span style="font-weight: bold;">${repair.id}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>Date:</span>
                    <span>${formatPrintDate(repair.createdAt)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>Status:</span>
                    <span style="font-weight: bold;">${repair.status}</span>
                  </div>
                </div>

                <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

                <!-- Customer Info -->
                <div style="margin-bottom: 4px; font-size: 8px;">
                  <div style="font-weight: bold; margin-bottom: 2px;">CUSTOMER:</div>
                  <div>${repair.customerName}</div>
                  <div>${repair.customerPhone}</div>
                </div>

                <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

                <!-- Device Info -->
                <div style="margin-bottom: 4px; font-size: 8px;">
                  <div style="font-weight: bold; margin-bottom: 2px;">DEVICE:</div>
                  <div>${repair.deviceBrand} ${repair.deviceModel}</div>
                  <div style="margin-top: 2px;">
                    <div style="font-weight: bold;">Issue:</div>
                    <div style="white-space: pre-wrap; word-break: break-word;">${
                      repair.issueDescription
                    }</div>
                  </div>
                </div>

                <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

                <!-- Parts Used -->
                ${
                  includeParts &&
                  repair.usedParts &&
                  repair.usedParts.length > 0
                    ? `
                  <div style="margin-bottom: 4px; font-size: 8px;">
                    <div style="font-weight: bold; margin-bottom: 2px;">PARTS USED:</div>
                    ${repair.usedParts
                      .map(
                        (part, index) => `
                      <div style="display: flex; justify-content: space-between; margin-bottom: 1px;">
                        <span>${part.partName} x${part.quantity}</span>
                        <span>$${part.cost.toFixed(2)}</span>
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                  <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>
                `
                    : ""
                }

                <!-- Financial Summary -->
                <div style="margin-bottom: 4px; font-size: 9px;">
                  <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 11px;">
                    <span>REPAIR COST:</span>
                    <span>$${repair.estimatedCost.toFixed(2)}</span>
                  </div>

                  ${
                    includePayments &&
                    repair.payments &&
                    repair.payments.length > 0
                      ? `
                    <div style="margin-top: 4px; font-size: 8px;">
                      <div style="font-weight: bold; margin-bottom: 2px;">PAYMENTS:</div>
                      ${repair.payments
                        .map(
                          (payment) => `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 1px;">
                          <span>${formatPrintDate(payment.date)}</span>
                          <span>$${payment.amount.toFixed(2)}</span>
                        </div>
                      `
                        )
                        .join("")}
                      <div style="border-top: 1px solid #000; margin-top: 3px; padding-top: 3px;">
                        <div style="display: flex; justify-content: space-between; font-weight: bold;">
                          <span>TOTAL PAID:</span>
                          <span>$${(
                            repair.payments?.reduce(
                              (sum, p) => sum + p.amount,
                              0
                            ) || 0
                          ).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  `
                      : ""
                  }

                  <div style="border-top: 1px solid #000; margin-top: 4px; padding-top: 4px; font-size: 10px; font-weight: bold;">
                    <div style="display: flex; justify-content: space-between;">
                      <span>BALANCE DUE:</span>
                      <span>$${(
                        repair.estimatedCost -
                        (repair.payments?.reduce(
                          (sum, p) => sum + p.amount,
                          0
                        ) || 0)
                      ).toFixed(2)}</span>
                    </div>
                  </div>

                  <div style="margin-top: 3px; font-size: 8px; text-align: center;">
                    <div style="font-weight: bold;">Payment Status: ${
                      repair.paymentStatus
                    }</div>
                  </div>
                </div>

                <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>

                <!-- Footer -->
                <div style="text-align: center; font-size: 7px; margin-top: 4px;">
                  <div style="margin-bottom: 2px;">Thank you for your business!</div>
                  <div>30-day warranty on parts & labor</div>
                  <div style="margin-top: 4px; font-weight: bold;">Keep this receipt for your records</div>
                </div>

                <!-- Barcode placeholder -->
                <div style="text-align: center; margin-top: 6px; font-size: 7px;">
                  <div style="border: 1px solid #000; padding: 4px; font-family: 'Courier New', Courier, monospace; letter-spacing: 1px;">*${
                    repair.id
                  }*</div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      return receiptHTML;
    },
    [formatPrintDate]
  );

  // Print using iframe method (avoids popup blockers) with window.open fallback
  const printDocument = useCallback(
    (htmlContent: string, title: string = "Print Document") => {
      // Try iframe method first (doesn't trigger popup blockers)
      try {
        const iframe = document.createElement("iframe");
        iframe.style.position = "absolute";
        iframe.style.top = "-10000px";
        iframe.style.left = "-10000px";
        iframe.style.width = "1px";
        iframe.style.height = "1px";
        iframe.style.border = "none";
        iframe.style.visibility = "hidden";

        document.body.appendChild(iframe);

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) {
          // Iframe method failed, try popup fallback
          document.body.removeChild(iframe);
          return fallbackPopupPrint(htmlContent, title);
        }

        doc.open();
        doc.write(htmlContent);
        doc.close();

        // Wait for content to load, then print
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();

            // Clean up iframe after printing
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 2000);
          } catch (error) {
            console.error("Iframe print error:", error);
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            // Try popup fallback on iframe print failure
            fallbackPopupPrint(htmlContent, title);
          }
        }, 300);

        return true;
      } catch (error) {
        console.error("Iframe creation error:", error);
        // Fallback to popup method
        return fallbackPopupPrint(htmlContent, title);
      }
    },
    []
  );

  // Fallback popup method (kept for browsers that don't support iframe printing)
  const fallbackPopupPrint = useCallback(
    (htmlContent: string, title: string) => {
      let printWindow: Window | null = null;

      try {
        printWindow = window.open("", "_blank");
        if (!printWindow) {
          toast.error("❌ Popup blocked! Please allow popups and try again.");
          return false;
        }

        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Enhanced cleanup with timeout fallback
        let cleanupTimer: NodeJS.Timeout;
        let hasBeenCleaned = false;

        const cleanup = () => {
          if (!hasBeenCleaned && printWindow && !printWindow.closed) {
            hasBeenCleaned = true;
            clearTimeout(cleanupTimer);
            try {
              printWindow.close();
            } catch (error) {
              console.warn("Print window cleanup warning:", error);
            }
          }
        };

        // Wait for content to load, then print
        printWindow.onload = () => {
          try {
            printWindow!.focus();

            setTimeout(() => {
              if (printWindow && !printWindow.closed) {
                printWindow.print();
                cleanupTimer = setTimeout(cleanup, 5000);
              }
            }, 800);

            printWindow!.onbeforeunload = cleanup;
          } catch (error) {
            console.error("Print execution error:", error);
            cleanup();
          }
        };

        // Fallback cleanup
        setTimeout(() => {
          if (!hasBeenCleaned) {
            console.warn("Print window cleanup fallback triggered");
            cleanup();
          }
        }, 15000);

        return true;
      } catch (error) {
        console.error("Popup print error:", error);
        toast.error("❌ Failed to open print dialog");

        if (printWindow && !printWindow.closed) {
          try {
            printWindow.close();
          } catch (cleanupError) {
            console.warn("Error cleanup warning:", cleanupError);
          }
        }

        return false;
      }
    },
    []
  );

  // Enhanced print functions - focusing on print dialog success
  const printReceipt = useCallback(
    async (repair: Repair, options?: PrintOptions): Promise<boolean> => {
      try {
        // Check if we should use ESC/POS
        if (options?.useEscPos) {
          // If no printer is specified, open the printer selection dialog
          if (!options.printerName) {
            setPendingPrintJob({ repair, options, type: "receipt" });
            setIsPrinterSelectionOpen(true);
            return true; // We'll handle the actual printing after selection
          }

          // Generate ESC/POS commands
          const commands = generateReceiptCommands(repair, {
            includePayments: options.includePayments,
            includeParts: options.includeParts,
            autoCut: true,
          });

          // Send commands to printer with selected printer address
          const printerAddress = options.printerName || options.printerAddress;
          const result = await sendToPrinter(commands, printerAddress);
          if (result.success) {
            toast.success("✅ ESC/POS receipt printed successfully!");
          } else {
            toast.error(
              `❌ Failed to print ESC/POS receipt: ${result.message}`
            );
          }
          return result.success;
        }

        // Use existing HTML-based printing
        const content = generatePrintContent(repair, {
          ...options,
          format: "receipt",
        });

        return printDocument(content, "Receipt");
      } catch (error) {
        console.error("Receipt printing error:", error);
        toast.error("❌ Print failed. Please check your browser settings.");
        return false;
      }
    },
    [
      generatePrintContent,
      printDocument,
      generateReceiptCommands,
      sendToPrinter,
    ]
  );

  const printSticker = useCallback(
    async (repair: Repair, options?: PrintOptions): Promise<boolean> => {
      try {
        // Check if we should use ESC/POS
        if (options?.useEscPos) {
          // If no printer is specified, open the printer selection dialog
          if (!options.printerName) {
            setPendingPrintJob({ repair, options, type: "sticker" });
            setIsPrinterSelectionOpen(true);
            return true; // We'll handle the actual printing after selection
          }

          // Generate ESC/POS commands
          const commands = generateStickerCommands(repair, {
            autoCut: true,
          });

          // Send commands to printer with selected printer address
          const printerAddress = options.printerName || options.printerAddress;
          const result = await sendToPrinter(commands, printerAddress);
          if (result.success) {
            toast.success("✅ ESC/POS sticker printed successfully!");
          } else {
            toast.error(
              `❌ Failed to print ESC/POS sticker: ${result.message}`
            );
          }
          return result.success;
        }

        // Use existing HTML-based printing
        const content = generatePrintContent(repair, { format: "sticker" });
        return printDocument(content, "Sticker");
      } catch (error) {
        console.error("Sticker printing error:", error);
        toast.error("❌ Print failed. Please check your browser settings.");
        return false;
      }
    },
    [
      generatePrintContent,
      printDocument,
      generateStickerCommands,
      sendToPrinter,
    ]
  );

  // Handle printer selection from the dialog
  const handlePrinterSelection = useCallback(
    async (printerName: string) => {
      if (!pendingPrintJob) return;

      const { repair, options, type } = pendingPrintJob;

      // Update options with selected printer
      const updatedOptions = { ...options, printerName };

      // Execute the pending print job
      if (type === "receipt") {
        await printReceipt(repair, updatedOptions);
      } else {
        await printSticker(repair, updatedOptions);
      }

      // Clear pending job
      setPendingPrintJob(null);
    },
    [pendingPrintJob, printReceipt, printSticker]
  );

  // Keep download as a separate utility function (for manual fallback only)
  const downloadAsHTML = useCallback(
    (repair: Repair, format: "receipt" | "sticker" = "receipt") => {
      let blobUrl: string | null = null;

      try {
        const content = generatePrintContent(repair, { format });
        const blob = new Blob([content], { type: "text/html" });
        blobUrl = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `${format}-${repair.id}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`📄 ${format} downloaded as HTML file!`);
        return true;
      } catch (error) {
        console.error("Download error:", error);
        toast.error("Failed to download file");
        return false;
      } finally {
        // Always cleanup blob URL to prevent memory leaks
        if (blobUrl) {
          setTimeout(() => {
            URL.revokeObjectURL(blobUrl!);
          }, 100); // Small delay to ensure download starts
        }
      }
    },
    [generatePrintContent]
  );

  return {
    printReceipt,
    printSticker,
    downloadAsHTML,
    generatePrintContent,
    // Printer selection dialog state and handlers
    isPrinterSelectionOpen,
    setIsPrinterSelectionOpen,
    handlePrinterSelection,
    pendingPrintJob,
    // Helper function for troubleshooting
    showPrintTroubleshoot: () => {
      toast.info(
        "🛠️ Print Troubleshooting:\n" +
          "1. Ensure popups are allowed\n" +
          "2. Check if printer is connected\n" +
          "3. Try refreshing the page\n" +
          "4. Use 'Download' as backup",
        { duration: 8000 }
      );
    },
  };
};
