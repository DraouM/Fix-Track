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
}

export function getBarcodeData(data: Repair | InventoryItem): BarcodePrintData {
  const isRepair = "deviceBrand" in data;
  const repair = isRepair ? (data as Repair) : null;
  const item = !isRepair ? (data as InventoryItem) : null;

  return {
    barcodeValue: isRepair
      ? repair?.code || repair?.id || ""
      : item?.barcode || item?.id || "",
    title: isRepair
      ? `${repair?.deviceBrand} ${repair?.deviceModel}`
      : item?.phoneBrand || "",
    mainText: isRepair ? repair?.issueDescription || "" : item?.itemName || "",
    subText: isRepair ? repair?.customerPhone || "" : "", // Removed price from sticker to comply with request
  };
}

// 3. Generate HTML for sticker printing
export function renderStickerHTML(data: Repair | InventoryItem): string {
  const { barcodeValue, title, mainText, subText } = getBarcodeData(data);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Sticker - ${barcodeValue}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Libre+Barcode+39&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            margin: 0;
            padding: 0;
            width: 2in;
            height: 1in;
            overflow: hidden;
          }
          @media print {
            @page { size: 2in 1in !important; margin: 0 !important; padding: 0 !important; }
            body { margin: 0 !important; padding: 0 !important; width: 2in !important; height: 1in !important; overflow: hidden !important; }
          }
          .sticker {
            width: 2in;
            height: 1in;
            padding: 0.5mm;
            font-family: 'Inter', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.2mm;
            text-align: center;
            color: #000;
            box-sizing: border-box;
            overflow: hidden;
          }
          .sticker.has-subtext {
            justify-content: space-between;
          }
          .title { font-size: 7px; font-weight: 700; text-transform: uppercase; }
          .main { font-size: 9px; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }
          .barcode-container { display: flex; flex-direction: column; align-items: center; gap: 0; }
          .barcode { font-family: 'Libre Barcode 39', cursive; font-size: 22px; line-height: 1; }
          .subtext { font-size: 8px; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="sticker ${subText ? "has-subtext" : ""}">
          <div class="title">${title}</div>
          <div class="main">${mainText}</div>
          <div class="barcode-container">
            <div class="barcode">*${barcodeValue}*</div>
          </div>
          ${subText ? `<div class="subtext">${subText}</div>` : ""}
        </div>
      </body>
    </html>
  `;
}
