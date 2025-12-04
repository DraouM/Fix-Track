/*
🖨️ Printer Requirements
Sticker Printer (Thermal)

Width: 2 inches (50.8 mm) - Most common
Height: 1 inch (25.4 mm) - Standard
Alternative: 4" x 6" (101.6mm x 152.4mm) - Larger labels
Type: Thermal sticker printer (like Zebra, Brother QL series)
Paper: Die-cut labels, continuous roll
Connection: USB, Bluetooth, or Network

*/

import { Repair } from "@/types/repair";
import { getShopInfo } from "@/lib/shopInfo";

interface StickerTemplateProps {
  repair: Repair;
}

export function StickerTemplate({ repair }: StickerTemplateProps) {
  // Get shop information
  const shopInfo = getShopInfo();

  return (
    <div
      className="phone-sticker"
      style={{
        width: "2in",
        height: "1in",
        padding: "0.3mm",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "12px",
        lineHeight: "1.0",
        color: "#000",
        backgroundColor: "#fff",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header - Shop Name or Logo */}
      <div
        style={{
          textAlign: "center",
          paddingBottom: "0.2mm",
          fontSize: "12px",
          fontWeight: "bold",
        }}
      >
        {shopInfo.logoUrl ? (
          <img
            src={shopInfo.logoUrl}
            alt="Shop Logo"
            style={{
              maxWidth: "30mm",
              maxHeight: "8mm",
              width: "auto",
              height: "auto",
              objectFit: "contain",
            }}
          />
        ) : (
          shopInfo.shopName
        )}
      </div>

      {/* Device Info - Compact but clear */}
      <div
        style={{
          fontSize: "15px",
          textAlign: "center",
          fontWeight: "bold",
          margin: "0.2mm 0",
        }}
      >
        {repair.deviceBrand} {repair.deviceModel}
      </div>

      {/* Issue description and phone number */}
      <div
        style={{
          fontSize: "12px",
          textAlign: "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          margin: "0.2mm 0",
        }}
      >
        {repair.issueDescription.substring(0, 25)}
        {repair.issueDescription.length > 25 ? "..." : ""}
      </div>

      <div
        style={{
          fontSize: "12px",
          textAlign: "center",
          margin: "0.2mm 0",
        }}
      >
        {repair.customerPhone}
      </div>
    </div>
  );
}
