"use client";

import { Payment } from "@/types/repair";
import { useSettings } from "@/context/SettingsContext";
import { CURRENCY_SYMBOLS } from "@/types/settings";
import { useTranslation } from "react-i18next";
import { PrintHeader } from "./PrintHeader";
import { PrintFooter } from "./PrintFooter";

interface PaymentReceiptTemplateProps {
  payment: Payment;
  customerName?: string;
  referenceCode?: string; // Repair code or ID
  logoUrl?: string;
}

export function PaymentReceiptTemplate({
  payment,
  customerName,
  referenceCode,
  logoUrl,
}: PaymentReceiptTemplateProps) {
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

  return (
    <div
      className="thermal-receipt"
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

      <div style={{ textAlign: "center", margin: "6px 0", textDecoration: "underline", fontSize: "14px" }}>
        {t("receipt.paymentReceipt")}
      </div>

      <div style={{ marginBottom: "6px", fontSize: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{t("receipt.receiptID")}:</span>
          <span>{payment.id}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{t("receipt.date")}:</span>
          <span>{formatDate(payment.date)}</span>
        </div>
        {referenceCode && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{t("receipt.reference")}:</span>
            <span>{referenceCode}</span>
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }}></div>

      <div style={{ marginBottom: "4px" }}>
        {customerName && (
          <div style={{ marginBottom: "2px" }}>
            <span>{t("receipt.receivedFrom")}:</span> <span style={{ fontSize: "14px", fontWeight: "900" }}>{customerName}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginTop: "4px" }}>
          <span>{t("receipt.amountPaid")}:</span>
          <span style={{ fontSize: "14px", fontWeight: "900" }}>{CURRENCY_SYMBOLS[settings.currency]}{payment.amount.toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginTop: "2px" }}>
          <span>{t("receipt.paymentMethod")}:</span>
          <span>{payment.method}</span>
        </div>
        {payment.received_by && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
            <span>{t("receipt.receivedBy")}:</span>
            <span>{payment.received_by}</span>
          </div>
        )}
      </div>

      <PrintFooter />
    </div>
  );
}
