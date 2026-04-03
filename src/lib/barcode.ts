import { Repair } from "@/types/repair";
import { InventoryItem } from "@/types/inventory";

// 1. Generate a random 8-char alphanumeric barcode
export function generateBarcode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// 2. Helper to extract standard print data from Repair or InventoryItem
export interface BarcodePrintData {
  barcodeValue: string;
  title: string;
  mainText: string;
  subText: string;
  showBarcode?: boolean;
  barcodeLabel?: string;
}

export function getBarcodeData(data: Repair | InventoryItem): BarcodePrintData {
  const isRepair = "deviceBrand" in data;
  const repair = isRepair ? (data as Repair) : null;
  const item = !isRepair ? (data as InventoryItem) : null;

  return {
    barcodeValue: isRepair
      ? repair?.code || repair?.id || ""
      : item?.barcode || item?.id || "",
    // Repair: Show Code at top. Inventory: None.
    title: isRepair
      ? `${repair?.code || "REPAIR"}`
      : "",
    // Repair: Show Issue. Inventory: Item Name.
    mainText: isRepair
      ? repair?.issueDescription || ""
      : item?.itemName || "",
    // Repair: Replace Barcode with Phone. Inventory: Keep barcode.
    subText: isRepair
      ? "" // Moved to center
      : "",
    showBarcode: !isRepair,
    barcodeLabel: isRepair ? `${repair?.customerName || ""} - ${repair?.customerPhone || ""}` : undefined,
  };
}

// 3. Generate SVG for Code 39 Barcode
// Code 39 pattern: 5 bars and 4 spaces = 9 elements. 3 elements are wide (W), 6 are narrow (N).
const CODE39_MAP: Record<string, string> = {
  "0": "NNNwWnWNN", "1": "WNNwNnNNW", "2": "NNWwNnNNW", "3": "WNWwNnNNN",
  "4": "NNNwWnNNW", "5": "WNNwWnNNN", "6": "NNWwWnNNN", "7": "NNNwNnWNW",
  "8": "WNNwNnWNN", "9": "NNWwNnWNN", "A": "WNNnNwNNW", "B": "NNWnNwNNW",
  "C": "WNWnNwNNN", "D": "NNNnWwNNW", "E": "WNNnWwNNN", "F": "NNWnWwNNN",
  "G": "NNNnNwWNW", "H": "WNNnNwWNN", "I": "NNWnNwWNN", "J": "NNNnWwWNN",
  "K": "WNNnNNnwW", "L": "NNWnNNnwW", "M": "WNWnNNnwN", "N": "NNNnWNnwW",
  "O": "WNNnWNnwN", "P": "NNWnWNnwN", "Q": "NNNnNNwwW", "R": "WNNnNNwwN",
  "S": "NNWnNNwwN", "T": "NNNnWNwwN", "U": "WwNNNnNNW", "V": "NwWNNnNNW",
  "W": "WwWNNnNNN", "X": "NwNNWnNNW", "Y": "WwNNWnNNN", "Z": "NwWNWnNNN",
  "-": "NwNNNnWNW", ".": "WwNNNnWNN", " ": "NwWNNnWNN", "*": "NwNNWnWNN",
  "$": "NwNwNwNNN", "/": "NwNwNNNwN", "+": "NwNNNwNwN", "%": "NNNwNwNwN",
};

export function generateCode39SVG(data: string, height: number = 40): string {
  const code = `*${data.toUpperCase()}*`;
  const narrowWidth = 2;
  const wideWidth = 5;
  const interGap = 2;

  let currentX = 0;
  let paths = "";

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const pattern = CODE39_MAP[char];
    if (!pattern) continue;

    for (let j = 0; j < pattern.length; j++) {
      const type = pattern[j];
      const isBar = j % 2 === 0;
      const width = (type === "W" || type === "w") ? wideWidth : narrowWidth;

      if (isBar) {
        paths += `<rect x="${currentX}" y="0" width="${width}" height="${height}" fill="black" />`;
      }
      currentX += width;
    }
    currentX += interGap; // Inter-character gap
  }

  return `<svg width="${currentX}" height="${height}" viewBox="0 0 ${currentX} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">${paths}</svg>`;
}

// 4. Generate HTML for sticker printing
export function renderStickerHTML(data: Repair | InventoryItem): string {
  const { barcodeValue, title, mainText, subText, showBarcode, barcodeLabel } = getBarcodeData(data);
  const barcodeSVG = showBarcode !== false ? generateCode39SVG(barcodeValue, 80) : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Sticker - ${barcodeValue}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            margin: 0;
            padding: 0;
            width: 2in;
            height: 1in;
            overflow: hidden;
            background: white;
          }
          @media print {
            @page { size: 2in 1in !important; margin: 0 !important; padding: 0 !important; }
            body { margin: 0 !important; padding: 0 !important; width: 2in !important; height: 1in !important; overflow: hidden !important; }
          }
          .sticker {
            width: 2in;
            height: 1in;
            padding: 1.5mm 0.5mm;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1.2mm;
            text-align: center;
            color: #000;
            box-sizing: border-box;
            overflow: hidden;
          }
          .title { font-size: 10px; font-weight: 700; text-transform: uppercase; }
          .main { font-size: 14px; font-weight: 900; width: 100%; white-space: normal; line-clamp: 2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
          .barcode-container { display: flex; flex-direction: column; align-items: center; gap: 1mm; width: 100%; }
          .barcode-svg { width: 100%; max-height: 10mm; display: flex; justify-content: center; }
          .barcode-raw { font-size: 11px; font-weight: 900; }
          .subtext { font-size: 10px; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="sticker">
          ${title ? `<div class="title">${title}</div>` : ""}
          <div class="main">${mainText}</div>
          <div class="barcode-container">
            ${showBarcode !== false ? `
              <div class="barcode-svg">${barcodeSVG}</div>
            ` : ""}
            ${barcodeLabel ? `<div class="barcode-raw">${barcodeLabel}</div>` : ""}
          </div>
          ${subText ? `<div class="subtext">${subText}</div>` : ""}
        </div>
      </body>
    </html>
  `;
}
