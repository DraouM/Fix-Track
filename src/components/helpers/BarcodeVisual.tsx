import { BarcodePrintData } from "@/lib/barcode";

interface BarcodeVisualProps {
  data: BarcodePrintData;
  className?: string; // Allow external styling if needed
  style?: React.CSSProperties; // Allow custom styles for dimensions
}

export function BarcodeVisual({ data, className, style }: BarcodeVisualProps) {
  const { barcodeValue, title, mainText, subText } = data;

  return (
    <div
      className={className}
      style={{
        width: "2in",
        height: "1in",
        padding: "1mm",
        fontFamily: "'Inter', sans-serif",
        color: "#000",
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        boxSizing: "border-box",
        overflow: "hidden",
        position: "relative", // Ensure it's contained
        ...style, // Merge custom styles (allows overriding width/height)
      }}
    >
      {/* Title */}
      <div style={{ fontSize: "10px", fontWeight: "bold", textAlign: "center", width: "100%" }}>
        {title}
      </div>

      {/* Main Desc */}
      <div style={{ 
        fontSize: "14px", 
        fontWeight: "900", 
        textAlign: "center", 
        width: "100%",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }}>
        {mainText}
      </div>

      {/* Barcode Visual */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1px" }}>
        <div style={{ 
          fontFamily: "'Libre Barcode 39', cursive", 
          fontSize: "28px", 
          lineHeight: "1",
          margin: "0"
        }}>
          *{barcodeValue}*
        </div>
        <div style={{ fontSize: "8px", fontWeight: "bold", letterSpacing: "1px" }}>
          {barcodeValue}
        </div>
      </div>

      {/* Subtext */}
      <div style={{ fontSize: "10px", fontWeight: "bold" }}>
        {subText}
      </div>
      
      {/* Inject Font Style (Scoped) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap');
      `}} />
    </div>
  );
}
