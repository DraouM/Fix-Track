/*
🖨️ Printer Requirements
 Sticker Printer (Label)

Size: 2" x 1" labels (50mm x 25mm)
Alternative sizes available: 2.25" x 1.25" or 1.5" x 1"
Type: Label printer (like Dymo, Brother, Zebra)
Paper: Adhesive labels on roll
Important: Must fit on phone back!
 */

import { Repair } from "@/types/repair";

interface StickerTemplateProps {
  repair: Repair;
}

export function StickerTemplate({ repair }: StickerTemplateProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    });
  };

  return (
    <div
      className="phone-sticker"
      style={{
        width: "2in",
        height: "1in",
        padding: "0.5mm",
        fontFamily: "Arial, sans-serif",
        fontSize: "4px",
        lineHeight: "1.0",
        color: "#000",
        backgroundColor: "#fff",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          gap: "0.2mm",
        }}
      >
        {/* Header - Shop name and Order # */}
        <div
          style={{
            textAlign: "center",
            borderBottom: "0.5px solid #000",
            paddingBottom: "0.3mm",
            fontSize: "5px",
            fontWeight: "bold",
          }}
        >
          <div>YOUR REPAIR SHOP</div>
          <div style={{ fontSize: "4px" }}>#{repair.id}</div>
        </div>

        {/* Device Info - Compact */}
        <div
          style={{
            fontSize: "5px",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          {repair.deviceBrand} {repair.deviceModel}
        </div>

        {/* Issue description - truncated */}
        <div
          style={{
            fontSize: "4px",
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {repair.issueDescription.substring(0, 25)}
          {repair.issueDescription.length > 25 ? "..." : ""}
        </div>

        {/* Bottom row: Phone and Date */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "4px",
            marginTop: "auto",
            paddingTop: "0.3mm",
            borderTop: "0.5px solid #000",
          }}
        >
          <span>{repair.customerPhone}</span>
          <span>{formatDate(repair.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
