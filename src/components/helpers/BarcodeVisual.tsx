import { BarcodePrintData } from "@/lib/barcode";

interface BarcodeVisualProps {
  data: BarcodePrintData;
  className?: string; // Allow external styling if needed
  style?: React.CSSProperties; // Allow custom styles for dimensions
}

export function BarcodeVisual({ data, className, style }: BarcodeVisualProps) {
  const { barcodeValue, title, mainText, subText, showBarcode, barcodeLabel } = data;

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
        justifyContent: "center",
        gap: "1.5mm",
        boxSizing: "border-box",
        overflow: "hidden",
        position: "relative", // Ensure it's contained
        ...style, // Merge custom styles (allows overriding width/height)
      }}
    >
      {/* Title */}
      {title && (
        <div style={{ fontSize: "10px", fontWeight: "bold", textAlign: "center", width: "100%", textTransform: "uppercase" }}>
          {title}
        </div>
      )}

      {/* Main Desc */}
      <div style={{ 
        fontSize: "12px", 
        fontWeight: "900", 
        textAlign: "center", 
        width: "100%",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        lineHeight: "1.2"
      }}>
        {mainText}
      </div>

      {/* Center Content (Barcode or Phone) */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1px", width: "100%" }}>
        {showBarcode !== false && (
          <div style={{ 
            fontFamily: "'Libre Barcode 39', cursive", 
            fontSize: "28px", 
            lineHeight: "1",
            margin: "0"
          }}>
            *{barcodeValue}*
          </div>
        )}
        {barcodeLabel && (
          <div style={{ fontSize: "10px", fontWeight: "900", textAlign: "center" }}>
            {barcodeLabel}
          </div>
        )}
      </div>

      {/* Subtext */}
      {subText && (
        <div style={{ fontSize: "10px", fontWeight: "bold" }}>
          {subText}
        </div>
      )}
      
      {/* Inject Font Style (Scoped) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap');
      `}} />
    </div>
  );
}
