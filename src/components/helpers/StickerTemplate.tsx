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
        justifyContent: "center",
        // Added: Explicitly prevent page breaks
        pageBreakAfter: "avoid",
        pageBreakInside: "avoid",
      }}
    >
      {/* Device Info - First */}
      <div
        style={{
          fontSize: "13px",
          textAlign: "center",
          margin: "0.5mm 0",
        }}
      >
        {repair.deviceBrand} {repair.deviceModel}
      </div>

      {/* Issue description - Primary Focus */}
      <div
        style={{
          fontSize: "18px",
          textAlign: "center",
          fontWeight: "bold",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          margin: "0.5mm 0",
        }}
      >
        {repair.issueDescription.length > 20
          ? `${repair.issueDescription.substring(0, 20)}...`
          : repair.issueDescription}
      </div>

      {/* Phone Number */}
      <div
        style={{
          fontSize: "12px",
          textAlign: "center",
          margin: "0.5mm 0",
        }}
      >
        {repair.customerPhone}
      </div>
    </div>
  );
}
