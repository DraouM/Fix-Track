/*
🖨️ Printer Requirements
Receipt Printer (Thermal)

Width: 80mm (3.15 inches) - Most common
Alternative: 58mm (2.3 inches) - Uncomment in CSS if needed
Type: Thermal receipt printer (like Epson TM-T20, Star TSP143)
Paper: Continuous roll (thermal paper)
Connection: USB, Bluetooth, or Network

*/

import { Repair } from "@/types/repair";
import { useSettings } from "@/context/SettingsContext";
import { CURRENCY_SYMBOLS } from "@/types/settings";
import { useTranslation } from "react-i18next";
import { PrintHeader } from "./PrintHeader";
import { PrintFooter } from "./PrintFooter";

interface ReceiptTemplateProps {
  repair: Repair;
  includePayments?: boolean;
  includeParts?: boolean;
  /**
   * Optional logo URL override. Falls back to shopInfo.logoUrl if omitted.
   */
  logoUrl?: string;
}

export function ReceiptTemplate({
  repair,
  includePayments = true,
  includeParts = true,
  logoUrl,
}: ReceiptTemplateProps) {
  const { settings } = useSettings();
  const { t, i18n } = useTranslation();
  const receiptWidth = settings.printDimensions.receipt.width;

  const formatDate = (dateString: string) => {
    const locale =
      i18n.language === "ar"
        ? "ar-SA"
        : i18n.language === "fr"
        ? "fr-FR"
        : "en-US";
    return new Date(dateString).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPaid = repair.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const balance = repair.estimatedCost - totalPaid;

  const isRTL = i18n.language === "ar";

  return (
    <div
      className="thermal-receipt"
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        width: `${receiptWidth}mm`,
        padding: "2mm",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "8px",
        lineHeight: "1.15",
        color: "#000",
        backgroundColor: "#fff",
      }}
    >
      <PrintHeader logoUrl={logoUrl} />

      {/* Receipt Type - Hidden to save space */}

      {/* Order Info */}
      <div style={{ marginBottom: "3px", fontSize: "7px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{t("receipt.orderNumber")}:</span>
          <span style={{ fontWeight: "bold", fontSize: "8px" }}>
            {repair.code || repair.id}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{t("receipt.date")}:</span>
          <span>{formatDate(repair.createdAt)}</span>
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }}></div>

      {/* Customer Info */}
      <div style={{ marginBottom: "4px", fontSize: "8px" }}>
        <div style={{ fontWeight: "bold", marginBottom: "2px" }}>
          {t("receipt.customer")}:
        </div>
        <div>{repair.customerName}</div>
        <div>{repair.customerPhone}</div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }}></div>

      {/* Device Info */}
      <div style={{ marginBottom: "4px", fontSize: "8px" }}>
        <div style={{ fontWeight: "bold", marginBottom: "2px" }}>
          {t("receipt.device")}:
        </div>
        <div>
          {repair.deviceBrand} {repair.deviceModel}
        </div>
        <div style={{ marginTop: "2px" }}>
          <div style={{ fontWeight: "bold" }}>
             {t("receipt.issue")}:
          </div>
          <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {repair.issueDescription}
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }}></div>

      {/* Parts Used */}
      {includeParts && repair.usedParts && repair.usedParts.length > 0 && (
        <>
          <div style={{ marginBottom: "4px", fontSize: "8px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "2px" }}>
              {t("receipt.partsUsed")}:
            </div>
            {repair.usedParts.map((part, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "1px",
                }}
              >
                <span>
                  {part.partName} x{part.quantity}
                </span>
                <span>{CURRENCY_SYMBOLS[settings.currency]}{(part.cost || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }}></div>
        </>
      )}

      {/* Financial Summary */}
      <div style={{ marginBottom: "4px", fontSize: "9px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "bold",
            fontSize: "11px",
          }}
        >
          <span>
            {t("receipt.repairCost")}:
          </span>
          <span>{CURRENCY_SYMBOLS[settings.currency]}{repair.estimatedCost.toFixed(2)}</span>
        </div>

        {includePayments && repair.payments && repair.payments.length > 0 && (
          <div style={{ marginTop: "4px", fontSize: "8px" }}>
            <div
              style={{
                borderTop: "1px solid #000",
                marginTop: "3px",
                paddingTop: "3px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: "bold",
                }}
              >
                <span>
                  {t("receipt.totalPaid")}:
                </span>
                <span>{CURRENCY_SYMBOLS[settings.currency]}{totalPaid.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            borderTop: "1px solid #000",
            marginTop: "4px",
            paddingTop: "4px",
            fontSize: "10px",
            fontWeight: "bold",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>
              {t("receipt.balanceDue")}:
            </span>
            <span>{CURRENCY_SYMBOLS[settings.currency]}{balance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <PrintFooter />

      {/* Barcode placeholder */}
      <div style={{ textAlign: "center", marginTop: "6px", fontSize: "7px" }}>
        <div
          style={{
            border: "1px solid #000",
            padding: "4px",
            fontFamily: "'Courier New', Courier, monospace",
            letterSpacing: "1px",
          }}
        >
          *{repair.code || repair.id}*
        </div>
      </div>
    </div>
  );
}
