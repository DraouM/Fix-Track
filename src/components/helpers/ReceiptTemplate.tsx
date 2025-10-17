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

interface ReceiptTemplateProps {
  repair: Repair;
  includePayments?: boolean;
  includeParts?: boolean;
}

export function ReceiptTemplate({
  repair,
  includePayments = true,
  includeParts = true,
}: ReceiptTemplateProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPaid = repair.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const balance = repair.estimatedCost - totalPaid;

  return (
    <div
      className="thermal-receipt"
      style={{
        width: "80mm",
        padding: "3mm",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "9px",
        lineHeight: "1.2",
        color: "#000",
        backgroundColor: "#fff",
      }}
    >
      {/* Header - Shop Name */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "6px",
          borderBottom: "1px dashed #000",
          paddingBottom: "6px",
        }}
      >
        <div
          style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "2px" }}
        >
          YOUR REPAIR SHOP
        </div>
        <div style={{ fontSize: "8px" }}>123 Main St, City, State</div>
        <div style={{ fontSize: "8px" }}>Tel: (555) 123-4567</div>
      </div>

      {/* Receipt Type */}
      <div
        style={{
          textAlign: "center",
          fontSize: "10px",
          fontWeight: "bold",
          margin: "4px 0",
        }}
      >
        REPAIR RECEIPT
      </div>

      {/* Order Info */}
      <div style={{ marginBottom: "4px", fontSize: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Order #:</span>
          <span style={{ fontWeight: "bold" }}>{repair.id}</span>
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

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }}></div>

      {/* Customer Info */}
      <div style={{ marginBottom: "4px", fontSize: "8px" }}>
        <div style={{ fontWeight: "bold", marginBottom: "2px" }}>CUSTOMER:</div>
        <div>{repair.customerName}</div>
        <div>{repair.customerPhone}</div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }}></div>

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

      <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }}></div>

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
                <span>${part.cost.toFixed(2)}</span>
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

      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: "7px", marginTop: "4px" }}>
        <div style={{ marginBottom: "2px" }}>Thank you for your business!</div>
        <div>30-day warranty on parts & labor</div>
        <div style={{ marginTop: "4px", fontWeight: "bold" }}>
          Keep this receipt for your records
        </div>
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
          *{repair.id}*
        </div>
      </div>
    </div>
  );
}
