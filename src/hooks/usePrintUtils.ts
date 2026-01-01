// hooks/usePrintUtils.ts
"use client";

import { useCallback, useState } from "react";
import { Repair } from "@/types/repair";
import { toast } from "sonner";
import { ReceiptTemplate } from "@/components/helpers/ReceiptTemplate";
import { StickerTemplate } from "@/components/helpers/StickerTemplate";
import { getShopInfo } from "@/lib/shopInfo";

interface PrintOptions {
  includePayments?: boolean;
  includeParts?: boolean;
  includeHistory?: boolean;
  format?: "receipt" | "sticker" | "invoice";
}

export const usePrintUtils = () => {
  // Format date for printing
  const formatPrintDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Get shop information
  const shopInfo = getShopInfo();

  // Generate print content HTML using optimized components
  const generatePrintContent = useCallback(
    (repair: Repair, options: PrintOptions = {}) => {
      const {
        format = "receipt",
        includePayments = true,
        includeParts = true,
      } = options;

      // Logo fallback for print HTML (prefers shop settings, then test asset)
      const logoSrc = shopInfo.logoUrl || "/logo_shop.svg";

      if (format === "sticker") {
        // We'll use innerHTML approach for sticker since it's simpler
        const stickerHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>ملصق إصلاح - ${repair.code || repair.id}</title>
            <style>
              * { 
                margin: 0; 
                padding: 0; 
                box-sizing: border-box; 
              }
              @media print {
                @page {
                  size: 2in 1in landscape;
                  margin: 0;
                }
                html, body {
                  width: 100%;
                  height: 100%;
                  margin: 0;
                  padding: 0;
                  overflow: hidden;
                }
                body { 
                  font-family: 'Courier New', Courier, monospace;
                  font-size: 12px;
                  line-height: 1.0;
                  color: #000;
                  background: white;
                  padding: 0.3mm;
                  page-break-after: avoid;
                  page-break-inside: avoid;
                  direction: rtl;
                }
                .phone-sticker {
                  width: 100%;
                  height: 100%;
                  padding: 0.3mm;
                  box-sizing: border-box;
                  display: flex;
                  flex-direction: column;
                  page-break-after: avoid;
                  page-break-inside: avoid;
                  overflow: hidden;
                }
              }
            </style>
          </head>
          <body>
            <div class="phone-sticker">
              <!-- Device Info - First -->
              <div style="font-size: 11px; text-align: center; margin: 0.2mm 0;">
                ${repair.deviceBrand} ${repair.deviceModel}
              </div>

              <!-- Issue description - Primary Focus -->
              <div style="font-size: 13px; text-align: center; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 0.2mm 0;">
                ${repair.issueDescription.substring(0, 25)}${
          repair.issueDescription.length > 25 ? "..." : ""
        }
              </div>
              
              <div style="font-size: 12px; text-align: center; margin: 0.2mm 0;">
                 ${repair.customerPhone}
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
            <title>إيصال إصلاح - ${repair.code || repair.id}</title>
            <style>
              ${document.querySelector("#print-styles")?.textContent || ""}
              * { 
                box-sizing: border-box; 
                margin: 0; 
                padding: 0; 
              }
              @media print {
                @page {
                  size: 68mm auto;
                  margin: 0;
                }
                html, body {
                  margin: 0;
                  padding: 0;
                  width: 68mm;
                  height: auto;
                  background-color: #fff;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  direction: rtl;
                }
                .thermal-receipt {
                  width: 68mm;
                  overflow: hidden;
                }
              }
            </style>
          </head>
          <body>
            <div id="receipt-print-template" class="print-active" data-print-type="receipt">
              <div class="thermal-receipt" style="width: 68mm; padding: 2mm 3mm; font-family: 'Courier New', Courier, monospace; font-size: 12px; line-height: 1.3; color: #000; background-color: #fff; page-break-inside: avoid;">
                <!-- Header - Shop Name -->
                <div style="text-align: center; margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 8px;">
                  ${
                    shopInfo.logoUrl
                      ? `<div style="margin-bottom: 6px;"><img src="${shopInfo.logoUrl}" alt="Shop Logo" style="max-width: 100%; max-height: 25mm; width: auto; height: auto; object-fit: contain;" /></div>`
                      : `<div style="margin-bottom: 6px;"><img src="/logo_shop.svg" alt="Shop Logo" style="max-width: 100%; max-height: 25mm; width: auto; height: auto; object-fit: contain;" /></div>`
                  }
                  <div style="font-size: 16px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase;">${
                    shopInfo.shopName
                  }</div>
                  <div style="font-size: 11px;">${shopInfo.address}</div>
                  <div style="font-size: 11px;">${shopInfo.phoneNumber}</div>
                </div>

                <!-- Receipt Type -->
                <!-- <div style="text-align: center; font-size: 14px; font-weight: bold; margin: 8px 0; border: 1px solid #000; padding: 4px;">REPAIR RECEIPT</div> -->

                <!-- Order Info -->
                <div style="margin-bottom: 8px; font-size: 12px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <span>رقم الطلب:</span>
                    <span style="font-weight: bold; font-size: 11px;">${
                      repair.code || repair.id
                    }</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <span>التاريخ:</span>
                     <span>${new Date(repair.createdAt).toLocaleDateString(
                       "en-ER",
                       {
                         year: "numeric",
                         month: "2-digit",
                         day: "2-digit",
                         hour: "2-digit",
                         minute: "2-digit",
                       }
                     )}</span>
                  </div>
                </div>

                <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>

                <!-- Customer Info -->
                <div style="margin-bottom: 8px; font-size: 12px;">
                  <!-- <div style="font-weight: bold; margin-bottom: 4px; font-size: 13px;">CUSTOMER</div> -->
                  <div>
                    <div style="font-weight: bold;">${repair.customerName}</div>
                    <div>${repair.customerPhone}</div>
                  </div>
                </div>

                <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>

                <!-- Device Info -->
                <div style="margin-bottom: 8px; font-size: 12px;">
                   <!-- <div style="font-weight: bold; margin-bottom: 4px; font-size: 13px;">DEVICE DETAIL</div> -->
                   <div>
                      <div style="font-weight: bold;">${repair.deviceBrand} ${
        repair.deviceModel
      }</div>
                      <div style="margin-top: 4px;">
                        <span style="text-decoration: underline;">المشكلة:</span>
                        <div style="white-space: pre-wrap; word-break: break-word; margin-top: 2px;">${
                          repair.issueDescription
                        }</div>
                      </div>
                   </div>
                </div>

                <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>

                <!-- Parts Used -->
                ${
                  includeParts &&
                  repair.usedParts &&
                  repair.usedParts.length > 0
                    ? `
                  <div style="margin-bottom: 8px; font-size: 12px;">
                    <!-- <div style="font-weight: bold; margin-bottom: 4px; font-size: 13px;">PARTS INSTALLED</div> -->
                    ${repair.usedParts
                      .map(
                        (part, index) => `
                      <div style="display: flex; justify-content: space-between; margin-bottom: 2px; padding-right: 4px;">
                        <span>${
                          part.partName
                        } <span style="font-size: 11px;">(x${
                          part.quantity
                        })</span></span>
                        <span>$${part.cost.toFixed(2)}</span>
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                  <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
                `
                    : ""
                }

                <!-- Financial Summary -->
                <div style="margin-bottom: 8px; font-size: 12px;">
                  <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-bottom: 6px;">
                    <span>تكلفة الإصلاح:</span>
                    <span>$${repair.estimatedCost.toFixed(2)}</span>
                  </div>

                  ${
                    includePayments &&
                    repair.payments &&
                    repair.payments.length > 0
                      ? `
                    <div style="margin-top: 8px; font-size: 11px;">
                      <!--
                      <div style="font-weight: bold; margin-bottom: 2px;">PAYMENT HISTORY:</div>
                      ${repair.payments
                        .map(
                          (payment) => `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 2px; padding-right: 4px;">
                          <span>${formatPrintDate(payment.date)}</span>
                          <span>$${payment.amount.toFixed(2)}</span>
                        </div>
                      `
                        )
                        .join("")}
                      -->
                      <div style="border-top: 1px solid #000; margin-top: 4px; padding-top: 4px;">
                        <div style="display: flex; justify-content: space-between; font-weight: bold;">
                          <span>إجمالي المدفوع:</span>
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

                  <div style="border: 1px solid #000; padding: 6px; margin-top: 10px; font-size: 14px; font-weight: bold; background-color: #f0f0f0;">
                    <div style="display: flex; justify-content: space-between;">
                      <span>المبلغ المتبقي:</span>
                      <span>$${(
                        repair.estimatedCost -
                        (repair.payments?.reduce(
                          (sum, p) => sum + p.amount,
                          0
                        ) || 0)
                      ).toFixed(2)}</span>
                    </div>
                  </div>

                </div>

                <div style="border-top: 1px dashed #000; margin: 12px 0;"></div>

                <!-- Footer -->
                <div style="text-align: center; font-size: 10px; margin-top: 8px;">
                  <div style="margin-bottom: 4px; font-size: 11px; font-style: italic;">شكراً لتعاملكم معنا!</div>
                  <div style="font-weight: bold;">يرجى الاحتفاظ بهذا الإيصال للضمان.</div>
                  <div style="margin-top: 4px; font-size: 10px; font-weight: bold; line-height: 1.2;">
                    <div>ملاحظة: لا يتحمل المحل مسؤولية محتويات الهاتف.</div>

                  </div>

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
        // Fixed: Use correct dimensions for iframe (72mm width, auto height)
        iframe.style.width = "72mm";
        iframe.style.height = "auto";
        iframe.style.border = "none";
        iframe.style.visibility = "hidden";
        iframe.style.overflow = "hidden";

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
        }, 500);

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
        // Create popup with sticker-appropriate dimensions
        // Fixed: Use correct popup dimensions per memory guidelines
        printWindow = window.open("", "_blank", "width=400,height=600");
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
    [generatePrintContent, printDocument]
  );

  const printSticker = useCallback(
    async (repair: Repair, options?: PrintOptions): Promise<boolean> => {
      try {
        // Use existing HTML-based printing
        const content = generatePrintContent(repair, { format: "sticker" });
        return printDocument(content, "Sticker");
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
        link.download = `${format}-${repair.code || repair.id}.html`;
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
          "2. Try refreshing the page\n" +
          "3. Use 'Download' as backup",
        { duration: 8000 }
      );
    },
  };
};
