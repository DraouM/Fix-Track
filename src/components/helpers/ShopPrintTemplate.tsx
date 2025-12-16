"use client";

import { Repair } from "@/types/repair";
import { getShopInfo } from "@/lib/shopInfo";

interface ShopPrintTemplateProps {
  repair: Repair;
  includePayments?: boolean;
  includeParts?: boolean;
  logoUrl?: string;
}

/**
 * Lightweight print template that combines repair details and shop profile info.
 * Use this for HTML-based printing (iframe/popup) or to render a preview.
 */
export function ShopPrintTemplate({
  repair,
  includePayments = true,
  includeParts = true,
  logoUrl,
}: ShopPrintTemplateProps) {
  const shopInfo = getShopInfo();
  const logoSrc = logoUrl ?? shopInfo.logoUrl ?? "/test-logo.svg";

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPaid =
    repair.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const balance = (repair.estimatedCost || 0) - totalPaid;

  return (
    <div
      className="thermal-receipt"
      style={{
        width: "80mm",
        padding: "4mm",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "12px",
        lineHeight: "1.3",
        color: "#000",
        backgroundColor: "#fff",
      }}
    >
      {/* Header - Shop Information */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "10px",
          borderBottom: "1px dashed #000",
          paddingBottom: "10px",
        }}
      >
        {logoSrc && (
          <div style={{ marginBottom: "6px" }}>
            <img
              src={logoSrc}
              alt="Shop Logo"
              style={{
                maxWidth: "60mm",
                maxHeight: "20mm",
                width: "auto",
                height: "auto",
                objectFit: "contain",
              }}
            />
          </div>
        )}
        <div
          style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "2px" }}
        >
          {shopInfo.shopName}
        </div>
        {shopInfo.ownerName && (
          <div style={{ fontSize: "12px", marginBottom: "2px" }}>
            Owner: {shopInfo.ownerName}
          </div>
        )}
        <div style={{ fontSize: "11px" }}>{shopInfo.address}</div>
        <div style={{ fontSize: "11px" }}>Tel: {shopInfo.phoneNumber}</div>
        {shopInfo.email && (
          <div style={{ fontSize: "11px" }}>Email: {shopInfo.email}</div>
        )}
        {shopInfo.website && (
          <div style={{ fontSize: "11px" }}>Web: {shopInfo.website}</div>
        )}
      </div>

      {/* Order Info */}
      <div style={{ marginBottom: "8px", fontSize: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Order #:</span>
          <span style={{ fontWeight: "bold" }}>{repair.code || repair.id}</span>
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

      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>

      {/* Customer Info */}
      <div style={{ marginBottom: "8px", fontSize: "12px" }}>
        <div style={{ fontWeight: "bold", marginBottom: "2px" }}>Customer</div>
        <div>{repair.customerName || "Unknown"}</div>
        <div>{repair.customerPhone || "No phone provided"}</div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>

      {/* Device Info */}
      <div style={{ marginBottom: "8px", fontSize: "12px" }}>
        <div style={{ fontWeight: "bold", marginBottom: "2px" }}>Device</div>
        <div>
          {repair.deviceBrand || "Unknown"} {repair.deviceModel || "Device"}
        </div>
        <div style={{ marginTop: "4px" }}>
          <span style={{ textDecoration: "underline" }}>Issue:</span>
          <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {repair.issueDescription || "No description provided"}
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>

      {/* Parts Used */}
      {includeParts && repair.usedParts && repair.usedParts.length > 0 && (
        <>
          <div style={{ marginBottom: "8px", fontSize: "12px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "2px" }}>
              Parts Used
            </div>
            {repair.usedParts.map((part, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "2px",
                  paddingLeft: "4px",
                }}
              >
                <span>
                  {part.partName}{" "}
                  <span style={{ fontSize: "11px" }}>(x{part.quantity})</span>
                </span>
                <span>${part.cost.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>
        </>
      )}

      {/* Financial Summary */}
      <div style={{ marginBottom: "8px", fontSize: "12px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "bold",
            fontSize: "14px",
            marginBottom: "6px",
          }}
        >
          <span>REPAIR COST:</span>
          <span>${(repair.estimatedCost || 0).toFixed(2)}</span>
        </div>

        {includePayments && repair.payments && repair.payments.length > 0 && (
          <div style={{ marginTop: "6px", fontSize: "11px" }}>
            <div style={{ borderTop: "1px solid #000", paddingTop: "4px" }}>
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
            border: "2px solid #000",
            padding: "6px",
            marginTop: "10px",
            fontSize: "14px",
            fontWeight: "bold",
            backgroundColor: "#f0f0f0",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>BALANCE DUE:</span>
            <span>${balance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "12px 0" }}></div>

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: "10px", marginTop: "6px" }}>
        <div
          style={{ marginBottom: "2px", fontSize: "11px", fontStyle: "italic" }}
        >
          Thank you for your business!
        </div>
        <div style={{ fontWeight: "bold" }}>
          Please keep this receipt for warranty.
        </div>
        {shopInfo.website && (
          <div style={{ marginTop: "4px", fontSize: "10px", color: "#111" }}>
            {shopInfo.website}
          </div>
        )}
      </div>
    </div>
  );
}
