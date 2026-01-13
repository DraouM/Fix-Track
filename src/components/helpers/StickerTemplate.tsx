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
import { InventoryItem } from "@/types/inventory";
import { BarcodeVisual } from "@/components/helpers/BarcodeVisual";
import { getBarcodeData } from "@/lib/barcode";
import { useSettings } from "@/context/SettingsContext";

interface StickerTemplateProps {
  data: Repair | InventoryItem;
  type: "repair" | "inventory";
}

export function StickerTemplate({ data, type }: StickerTemplateProps) {
  const { settings } = useSettings();
  const { width, height } = settings.printDimensions.sticker;
  const barcodeData = getBarcodeData(data);

  return (
    <BarcodeVisual 
      data={barcodeData} 
      className="sticker-container"
      style={{
        width: `${width}mm`,
        height: `${height}mm`,
      }}
    />
  );
}
