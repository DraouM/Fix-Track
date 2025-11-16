import { Repair } from "@/types/repair";

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
        fontSize: "4px",
        lineHeight: "1.0",
        color: "#000",
        backgroundColor: "#fff",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header - Order # */}
      <div
        style={{
          textAlign: "center",
          borderBottom: "0.5px dashed #000",
          paddingBottom: "0.2mm",
          fontSize: "5px",
          fontWeight: "bold",
        }}
      >
        {/* YOUR REPAIR SHOP */}
        <div style={{ fontSize: "3px", fontWeight: "normal" }}>
          #{repair.id}
        </div>
      </div>

      {/* Device Info - Compact but clear */}
      <div
        style={{
          fontSize: "5px",
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
          fontSize: "3px",
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
          fontSize: "3px",
          textAlign: "center",
          margin: "0.2mm 0",
        }}
      >
        {repair.customerPhone}
      </div>
    </div>
  );
}
