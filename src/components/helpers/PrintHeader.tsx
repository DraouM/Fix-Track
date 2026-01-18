"use client";

import { getShopInfo } from "@/lib/shopInfo";

interface PrintHeaderProps {
  logoUrl?: string;
  fontSize?: string;
}

export function PrintHeader({ logoUrl, fontSize = "11px" }: PrintHeaderProps) {
  const shopInfo = getShopInfo();
  const logoSrc = logoUrl ?? shopInfo.logoUrl ?? "/logo_shop.svg";

  return (
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
        style={{ fontSize: fontSize, fontWeight: "bold", marginBottom: "1px" }}
      >
        {shopInfo.shopName}
      </div>

      {/* Contact Information */}
      <div style={{ fontSize: "7px" }}>{shopInfo.address}</div>
      <div style={{ fontSize: "7px" }}>Tel: {shopInfo.phoneNumber}</div>
    </div>
  );
}
