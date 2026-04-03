import { BarcodePrintData, generateCode39SVG } from "@/lib/barcode";

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
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
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
        <div style={{ fontSize: "12px", fontWeight: "bold", textAlign: "center", width: "100%", textTransform: "uppercase" }}>
          {title}
        </div>
      )}

      {/* Main Desc */}
      <div style={{ 
        fontSize: "14px", 
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
          <div 
            style={{ 
              width: "100%",
              maxHeight: "36px",
              display: "flex",
              justifyContent: "center"
            }}
            dangerouslySetInnerHTML={{ __html: generateCode39SVG(barcodeValue, 40) }}
          />
        )}
        {barcodeLabel && (
          <div style={{ fontSize: "12px", fontWeight: "900", textAlign: "center" }}>
            {barcodeLabel}
          </div>
        )}
      </div>

      {/* Subtext */}
      {subText && (
        <div style={{ fontSize: "12px", fontWeight: "bold" }}>
          {subText}
        </div>
      )}
    </div>
  );
}
