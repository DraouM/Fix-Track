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
import { getShopInfo } from "@/lib/shopInfo";
import { useSettings } from "@/context/SettingsContext";

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
  const receiptWidth = settings.printDimensions.receipt.width;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get shop information
  const shopInfo = getShopInfo();
  // Prefer explicit prop, then shop settings, then test logo fallback for previewing
  const logoSrc = logoUrl ?? shopInfo.logoUrl ?? "/logo_shop.svg";

  const totalPaid = repair.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const balance = repair.estimatedCost - totalPaid;

  return (
    <div
      className="thermal-receipt"
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
      {/* Header - Shop Information */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "4px",
          borderBottom: "1px dashed #000",
          paddingBottom: "4px",
        }}
      >
        {/* Logo */}
        {logoSrc && (
          <div style={{ marginBottom: "2px", textAlign: "center" }}>
            <img
              src={logoSrc}
              alt="Shop Logo"
              style={{
                maxWidth: "60mm",
                maxHeight: "50mm",
                width: "auto",
                height: "auto",
                objectFit: "contain",
              }}
            />
          </div>
        )}

        {/* Shop Name */}
        <div
          style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "1px" }}
        >
          {shopInfo.shopName}
        </div>

        {/* Contact Information */}
        <div style={{ fontSize: "7px" }}>{shopInfo.address}</div>
        <div style={{ fontSize: "7px" }}>Tel: {shopInfo.phoneNumber}</div>
        {/* Email and website hidden to save space */}
      </div>

      {/* Receipt Type - Hidden to save space */}

      {/* Order Info */}
      <div style={{ marginBottom: "3px", fontSize: "7px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Order #:</span>
          <span style={{ fontWeight: "bold", fontSize: "8px" }}>
            {repair.code || repair.id}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Date:</span>
          <span>{formatDate(repair.createdAt)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Status:</span>
          <span style={{ fontWeight: "bold" }}>{repair.status}</span>
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }}></div>

      {/* Customer Info */}
      <div style={{ marginBottom: "4px", fontSize: "8px" }}>
        <div style={{ fontWeight: "bold", marginBottom: "2px" }}>CUSTOMER:</div>
        <div>{repair.customerName}</div>
        <div>{repair.customerPhone}</div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }}></div>

      {/* Device Info */}
      <div style={{ marginBottom: "4px", fontSize: "8px" }}>
        <div style={{ fontWeight: "bold", marginBottom: "2px" }}>DEVICE:</div>
        <div>
          {repair.deviceBrand} {repair.deviceModel}
        </div>
        <div style={{ marginTop: "2px" }}>
          <div style={{ fontWeight: "bold" }}>Issue:</div>
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
              PARTS USED:
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
                <span>${(part.cost || 0).toFixed(2)}</span>
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
          <span>REPAIR COST:</span>
          <span>${repair.estimatedCost.toFixed(2)}</span>
        </div>

        {includePayments && repair.payments && repair.payments.length > 0 && (
          <div style={{ marginTop: "4px", fontSize: "8px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "2px" }}>
              PAYMENTS:
            </div>
            {/* 
            {repair.payments.map((payment) => (
              <div
                key={payment.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "1px",
                }}
              >
                <span>{formatDate(payment.date)}</span>
                <span>${payment.amount.toFixed(2)}</span>
              </div>
            ))}
            */}
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
                <span>TOTAL PAID:</span>
                <span>${totalPaid.toFixed(2)}</span>
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
            <span>BALANCE DUE:</span>
            <span>${balance.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ marginTop: "3px", fontSize: "8px", textAlign: "center" }}>
          <div style={{ fontWeight: "bold" }}>
            Payment Status: {repair.paymentStatus}
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }}></div>

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: "6px", marginTop: "2px" }}>
        <div style={{ marginBottom: "1px" }}>Thank you for your business!</div>
        <div style={{ fontWeight: "bold" }}>Keep this receipt for warranty</div>
      </div>

      {/* Barcode placeholder - you can add actual barcode library */}
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
