// hooks/usePrintUtils.ts
"use client";

import { useCallback } from "react";
import { Repair } from "@/types/repair";
import { toast } from "sonner";

interface PrintOptions {
  includePayments?: boolean;
  includeParts?: boolean;
  includeHistory?: boolean;
  format?: "receipt" | "sticker" | "invoice";
}

export const usePrintUtils = () => {
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

  // Generate print content HTML
  const generatePrintContent = useCallback(
    (repair: Repair, options: PrintOptions = {}) => {
      const {
        format = "receipt",
        includePayments = true,
        includeParts = true,
      } = options;

      const totalPaid = repair.totalPaid || 0;
      const remaining = repair.estimatedCost - totalPaid;

      if (format === "sticker") {
        return `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Repair Sticker - ${repair.id}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Arial', sans-serif; 
                font-size: 10pt;
                line-height: 1.2;
                color: #000;
                background: white;
              }
              .sticker {
                width: 4in;
                height: 3in;
                border: 2px solid #000;
                padding: 10px;
                position: relative;
              }
              .header {
                text-align: center;
                font-weight: bold;
                font-size: 12pt;
                margin-bottom: 10px;
                border-bottom: 1px solid #000;
                padding-bottom: 5px;
              }
              .qr-placeholder {
                width: 60px;
                height: 60px;
                border: 1px solid #000;
                float: right;
                margin: 0 0 10px 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 8pt;
                background: #f9f9f9;
              }
              .field {
                margin-bottom: 5px;
                font-size: 9pt;
              }
              .label {
                font-weight: bold;
                display: inline-block;
                width: 60px;
              }
            </style>
          </head>
          <body>
            <div class="sticker">
              <div class="header">REPAIR TAG</div>
              <div class="qr-placeholder">QR<br/>CODE</div>
              <div class="field">
                <span class="label">ID:</span> ${repair.id}
              </div>
              <div class="field">
                <span class="label">Phone:</span> ${repair.customerPhone}
              </div>
              <div class="field">
                <span class="label">Device:</span> ${repair.deviceBrand} ${
          repair.deviceModel
        }
              </div>
              <div class="field">
                <span class="label">Issue:</span> ${repair.issueDescription.substring(
                  0,
                  50
                )}${repair.issueDescription.length > 50 ? "..." : ""}
              </div>
              <div class="field">
                <span class="label">Date:</span> ${formatPrintDate(
                  repair.createdAt
                )}
              </div>
            </div>
          </body>
        </html>
      `;
      }

      // Receipt format
      return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Repair Receipt - ${repair.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', sans-serif; 
              font-size: 12pt;
              line-height: 1.4;
              color: #000;
              background: white;
              padding: 20px;
            }
            .receipt {
              max-width: 600px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .header h1 {
              font-size: 24pt;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .header .company {
              font-size: 14pt;
              margin-bottom: 5px;
            }
            .section {
              margin-bottom: 20px;
            }
            .section h3 {
              font-size: 14pt;
              font-weight: bold;
              margin-bottom: 10px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 5px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              padding: 2px 0;
            }
            .label {
              font-weight: bold;
              width: 40%;
            }
            .value {
              width: 60%;
              text-align: right;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 8px;
              border: 1px solid #000;
              border-radius: 4px;
              font-size: 10pt;
              font-weight: bold;
              background: #f0f0f0;
            }
            .total-section {
              border-top: 2px solid #000;
              padding-top: 15px;
              margin-top: 20px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 14pt;
            }
            .total-row.final {
              font-weight: bold;
              border-top: 1px solid #000;
              padding-top: 8px;
              margin-top: 8px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 10pt;
              font-style: italic;
              border-top: 1px solid #ccc;
              padding-top: 15px;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            .table th,
            .table td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
              font-size: 10pt;
            }
            .table th {
              background: #f0f0f0;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>REPAIR RECEIPT</h1>
              <div class="company">Fixary Repair Shop</div>
              <div>Order #${repair.id}</div>
              <div>Date: ${formatPrintDate(repair.createdAt)}</div>
            </div>
            
            <div class="section">
              <h3>Customer Information</h3>
              <div class="info-row">
                <span class="label">Name:</span>
                <span class="value">${repair.customerName}</span>
              </div>
              <div class="info-row">
                <span class="label">Phone:</span>
                <span class="value">${repair.customerPhone}</span>
              </div>
            </div>

            <div class="section">
              <h3>Device Information</h3>
              <div class="info-row">
                <span class="label">Device:</span>
                <span class="value">${repair.deviceBrand} ${
        repair.deviceModel
      }</span>
              </div>
              <div class="info-row">
                <span class="label">Issue:</span>
                <span class="value">${repair.issueDescription}</span>
              </div>
            </div>

            <div class="section">
              <h3>Repair Status</h3>
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="value">
                  <span class="status-badge">${repair.status}</span>
                </span>
              </div>
              <div class="info-row">
                <span class="label">Payment Status:</span>
                <span class="value">
                  <span class="status-badge">${repair.paymentStatus}</span>
                </span>
              </div>
            </div>

            ${
              includePayments && repair.payments && repair.payments.length > 0
                ? `
              <div class="section">
                <h3>Payment History</h3>
                <table class="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Method</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${repair.payments
                      .map(
                        (payment) => `
                      <tr>
                        <td>${formatPrintDate(payment.date)}</td>
                        <td>${payment.method}</td>
                        <td>$${payment.amount.toFixed(2)}</td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            `
                : ""
            }

            ${
              includeParts && repair.usedParts && repair.usedParts.length > 0
                ? `
              <div class="section">
                <h3>Parts Used</h3>
                <table class="table">
                  <thead>
                    <tr>
                      <th>Part</th>
                      <th>Qty</th>
                      <th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${repair.usedParts
                      .map(
                        (part) => `
                      <tr>
                        <td>${part.partName}</td>
                        <td>${part.quantity}</td>
                        <td>$${part.cost.toFixed(2)}</td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            `
                : ""
            }

            <div class="total-section">
              <div class="total-row">
                <span>Estimated Cost:</span>
                <span>$${repair.estimatedCost.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Amount Paid:</span>
                <span>$${totalPaid.toFixed(2)}</span>
              </div>
              <div class="total-row final">
                <span>Balance Due:</span>
                <span>$${remaining.toFixed(2)}</span>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for choosing Fixary Repair Shop!</p>
              <p>Keep this receipt for your records</p>
            </div>
          </div>
        </body>
      </html>
    `;
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
        }, 200);

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
      const content = generatePrintContent(repair, {
        ...options,
        format: "receipt",
      });

      try {
        const dialogOpened = printDocument(content, "Receipt");
        if (dialogOpened) {
          // Print dialog opened successfully - this is what we can verify
          toast.success(
            "🖨️ Receipt print dialog opened! Please complete printing."
          );
          return true;
        } else {
          // Failed to open print dialog (popup blocked, etc.)
          toast.error(
            "❌ Could not open print dialog. Please check popup settings."
          );
          return false;
        }
      } catch (error) {
        console.error("Receipt printing error:", error);
        toast.error("❌ Print failed. Please check your browser settings.");
        return false;
      }
    },
    [generatePrintContent, printDocument]
  );

  const printSticker = useCallback(
    async (repair: Repair): Promise<boolean> => {
      const content = generatePrintContent(repair, { format: "sticker" });

      try {
        const dialogOpened = printDocument(content, "Repair Sticker");
        if (dialogOpened) {
          // Print dialog opened successfully
          toast.success(
            "🖨️ Sticker print dialog opened! Please complete printing."
          );
          return true;
        } else {
          // Failed to open print dialog
          toast.error(
            "❌ Could not open print dialog. Please check popup settings."
          );
          return false;
        }
      } catch (error) {
        console.error("Sticker printing error:", error);
        toast.error("❌ Print failed. Please check your browser settings.");
        return false;
      }
    },
    [generatePrintContent, printDocument]
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
