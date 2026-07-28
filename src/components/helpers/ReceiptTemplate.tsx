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
  /**
   * Optional logo URL override. Falls back to shopInfo.logoUrl then /logo_shop.svg.
   */
  logoUrl?: string;
}

export function ReceiptTemplate({
  repair,
  includePayments = true,
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
        fontSize: "12px",
        fontWeight: "bold",
        lineHeight: "1.2",
        color: "#000",
        backgroundColor: "#fff",
      }}
    >
      <PrintHeader logoUrl={logoUrl} />

      <div style={{ marginBottom: "8px", fontSize: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{t("receipt.orderNumber")}:</span>
          <span style={{ fontWeight: "bold" }}>{repair.code || repair.id}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{t("receipt.date")}:</span>
          <span>{formatDate(repair.createdAt)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Status:</span>
          <span style={{ fontWeight: "bold" }}>{repair.status}</span>
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>

      <div style={{ marginBottom: "8px", fontSize: "12px" }}>
        <div style={{ fontWeight: "bold", marginBottom: "2px" }}>Customer</div>
        <div style={{ fontWeight: "bold" }}>
          {repair.customerName || "Unknown"}
        </div>
        <div>{repair.customerPhone || "No phone provided"}</div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>

      <div style={{ marginBottom: "8px", fontSize: "12px" }}>
        <div style={{ fontWeight: "bold", marginBottom: "2px" }}>Device</div>
        <div style={{ fontWeight: "bold" }}>
          {repair.deviceBrand || "Unknown"} {repair.deviceModel || "Device"}
        </div>
        <div style={{ marginTop: "4px" }}>
          <div style={{ textDecoration: "underline", fontWeight: "bold" }}>
            {t("receipt.issue")}:
          </div>
          <div
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: "13px",
              fontWeight: "700",
            }}
          >
            {repair.issueDescription || "No description provided"}
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>

      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>

      <div style={{ marginBottom: "6px", fontSize: "12px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          <span>{t("receipt.repairCost")}:</span>
          <span>
            {CURRENCY_SYMBOLS[settings.currency]}
            {repair.estimatedCost.toFixed(2)}
          </span>
        </div>

        {includePayments && repair.payments && repair.payments.length > 0 && (
          <div style={{ marginTop: "6px", fontSize: "11px" }}>
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
                <span>{t("receipt.totalPaid")}:</span>
                <span>
                  {CURRENCY_SYMBOLS[settings.currency]}
                  {totalPaid.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            border: "2px solid #000",
            padding: "6px",
            marginTop: "10px",
            fontSize: "14px",
            fontWeight: "bold",
            backgroundColor: "#f7f7f7",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{t("receipt.balanceDue")}:</span>
            <span>
              {CURRENCY_SYMBOLS[settings.currency]}
              {balance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <PrintFooter />

      <div style={{ textAlign: "center", marginTop: "8px", fontSize: "10px" }}>
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
