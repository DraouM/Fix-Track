// lib/thermalTemplates.ts
// Thermal printer templates with strict physical CSS units
// Supports 58mm, 80mm, and custom label sizes

import { PrinterConfig } from "@/types/settings";
import { getEffectiveWidth, getEffectiveHeight } from "./printerConfig";

interface TemplateOptions {
  title?: string;
  direction?: "ltr" | "rtl";
  offsetTop?: number;  // mm
  offsetLeft?: number; // mm
}

/**
 * Core CSS shared by all thermal templates.
 * Uses strict physical units – no relative sizing, no flex/grid layout for print.
 */
function basePrintCSS(widthMm: number, heightMm: number | null, opts: TemplateOptions): string {
  const heightRule = heightMm ? `${heightMm}mm` : "auto";
  const padTop = opts.offsetTop ?? 0;
  const padLeft = opts.offsetLeft ?? 0;

  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page {
      size: ${widthMm}mm ${heightRule};
      margin: 0;
    }
    html, body {
      width: ${widthMm}mm;
      margin: 0;
      padding: ${padTop}mm 0 0 ${padLeft}mm;
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      font-weight: bold;
      line-height: 1.3;
      color: #000;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      @page {
        size: ${widthMm}mm ${heightRule};
        margin: 0;
      }
      html, body {
        width: ${widthMm}mm;
      }
    }
    .receipt-container {
      width: 100%;
      padding: 2mm;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 3mm 0; }
    .solid-divider { border-top: 1px solid #000; margin: 3mm 0; }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1mm;
    }
    .header { text-align: center; margin-bottom: 3mm; border-bottom: 1px dashed #000; padding-bottom: 3mm; }
    .header .shop-name { font-size: 14px; font-weight: 900; margin-bottom: 1mm; }
    .header .shop-info { font-size: 8px; }
    .footer { text-align: center; font-size: 7px; margin-top: 3mm; border-top: 1px dashed #000; padding-top: 2mm; }
  `;
}

/**
 * Generate a 58mm receipt template with sample data.
 */
export function render58mmReceipt(opts: TemplateOptions = {}): string {
  return renderReceipt(58, null, opts);
}

/**
 * Generate an 80mm receipt template with sample data.
 */
export function render80mmReceipt(opts: TemplateOptions = {}): string {
  return renderReceipt(80, null, opts);
}

/**
 * Generate a custom label template with sample data.
 */
export function renderCustomLabel(widthMm: number, heightMm: number, opts: TemplateOptions = {}): string {
  const css = basePrintCSS(widthMm, heightMm, opts);
  const dir = opts.direction || "ltr";

  return `<!DOCTYPE html>
<html lang="en" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <style>
    ${css}
    .label-container {
      width: 100%;
      height: ${heightMm ? `${heightMm - 2}mm` : "auto"};
      padding: 2mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .label-title { font-size: 14px; font-weight: 900; margin-bottom: 2mm; text-align: center; }
    .label-barcode { font-family: 'Courier New', monospace; font-size: 18px; letter-spacing: 2px; margin: 2mm 0; padding: 2mm 4mm; border: 1px solid #000; }
    .label-info { font-size: 10px; text-align: center; margin-top: 1mm; }
  </style>
</head>
<body>
  <div class="label-container">
    <div class="label-title">Custom Label</div>
    <div class="label-barcode">*SAMPLE-001*</div>
    <div class="label-info">Product: Test Item</div>
    <div class="label-info">Price: $19.99</div>
    <div class="label-info">${widthMm}mm × ${heightMm}mm</div>
  </div>
</body>
</html>`;
}

/**
 * Internal: generate a receipt at the specified width.
 */
function renderReceipt(widthMm: number, heightMm: number | null, opts: TemplateOptions): string {
  const css = basePrintCSS(widthMm, heightMm, opts);
  const dir = opts.direction || "ltr";
  const isRTL = dir === "rtl";
  const rowDir = isRTL ? 'style="flex-direction: row-reverse;"' : '';
  const now = new Date().toLocaleString();

  return `<!DOCTYPE html>
<html lang="en" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <style>${css}</style>
</head>
<body>
  <div class="receipt-container">
    <!-- Header -->
    <div class="header">
      <div class="shop-name">Test Shop Name</div>
      <div class="shop-info">123 Test Street, City</div>
      <div class="shop-info">Tel: +1 (555) 000-0000</div>
    </div>

    <!-- Order Info -->
    <div style="margin-bottom: 2mm; font-size: 9px;">
      <div class="row" ${rowDir}>
        <span>Order #:</span>
        <span style="font-weight: 900; font-size: 13px;">TST-0001</span>
      </div>
      <div class="row" ${rowDir}>
        <span>Date:</span>
        <span>${now}</span>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Customer -->
    <div style="margin-bottom: 2mm;">
      <div style="font-size: 13px; font-weight: 900;">John Test Customer</div>
      <div style="font-size: 13px; font-weight: 900;">+1 (555) 999-8888</div>
    </div>

    <div class="divider"></div>

    <!-- Device / Items -->
    <div style="margin-bottom: 2mm;">
      <div style="font-size: 12px; font-weight: bold;">Samsung Galaxy S24</div>
      <div style="margin-top: 1mm;">
        <div style="font-weight: bold; text-decoration: underline;">Issue:</div>
        <div style="white-space: pre-wrap; font-size: 12px; font-weight: 900;">Screen replacement + battery check</div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Parts -->
    <div style="margin-bottom: 2mm; font-size: 9px;">
      <div style="font-weight: bold; margin-bottom: 1mm;">Parts Used:</div>
      <div class="row" ${rowDir}>
        <span>LCD Screen x1</span>
        <span>$89.99</span>
      </div>
      <div class="row" ${rowDir}>
        <span>Battery x1</span>
        <span>$29.99</span>
      </div>
    </div>

    <!-- Totals -->
    <div class="solid-divider"></div>
    <div style="margin-bottom: 2mm;">
      <div class="row" ${rowDir} style="font-size: 11px; font-weight: bold;">
        <span>Repair Cost:</span>
        <span>$149.98</span>
      </div>
      <div class="row" ${rowDir} style="font-size: 9px;">
        <span>Paid:</span>
        <span>$100.00</span>
      </div>
      <div class="solid-divider"></div>
      <div class="row" ${rowDir} style="font-size: 13px; font-weight: 900;">
        <span>Balance Due:</span>
        <span>$49.98</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>Thank you for your business!</div>
      <div style="font-size: 6px; color: #666; margin-top: 1mm;">Test Receipt - ${widthMm}mm width</div>
    </div>

    <!-- Barcode -->
    <div class="center" style="margin-top: 3mm;">
      <div style="border: 1px solid #000; padding: 2mm; font-family: 'Courier New', monospace; letter-spacing: 1px; font-size: 10px;">
        *TST-0001*
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate a calibration test page with ruler markings.
 */
export function renderCalibrationPage(widthMm: number, opts: TemplateOptions = {}): string {
  const css = basePrintCSS(widthMm, null, opts);
  const dir = opts.direction || "ltr";

  // Generate ruler marks every 5mm
  const rulerMarks: string[] = [];
  for (let i = 0; i <= widthMm; i += 5) {
    const isMajor = i % 10 === 0;
    rulerMarks.push(`
      <div style="position: absolute; left: ${i}mm; top: 0; width: 0; height: ${isMajor ? '8mm' : '4mm'}; border-left: ${isMajor ? '0.5mm' : '0.3mm'} solid #000;">
        ${isMajor ? `<span style="position: absolute; top: 8mm; left: -3mm; font-size: 6px; width: 8mm; text-align: center;">${i}</span>` : ''}
      </div>
    `);
  }

  // Vertical marks every 5mm (up to 100mm)
  const vMarks: string[] = [];
  for (let i = 0; i <= 100; i += 5) {
    const isMajor = i % 10 === 0;
    vMarks.push(`
      <div style="position: absolute; top: ${i}mm; left: 0; height: 0; width: ${isMajor ? '8mm' : '4mm'}; border-top: ${isMajor ? '0.5mm' : '0.3mm'} solid #000;">
        ${isMajor ? `<span style="position: absolute; left: 9mm; top: -4px; font-size: 6px;">${i}</span>` : ''}
      </div>
    `);
  }

  return `<!DOCTYPE html>
<html lang="en" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <style>
    ${css}
    .cal-container { padding: 2mm; }
    .cal-title { text-align: center; font-size: 14px; font-weight: 900; margin-bottom: 3mm; }
    .cal-info { text-align: center; font-size: 8px; margin-bottom: 4mm; color: #333; }
    .ruler-h { position: relative; height: 15mm; margin-bottom: 3mm; border-bottom: 0.5mm solid #000; }
    .ruler-v { position: relative; width: 20mm; height: 100mm; margin-bottom: 3mm; border-right: 0.5mm solid #000; }
    .cal-box { border: 0.3mm solid #000; margin: 3mm; padding: 2mm; }
    .cal-box-title { font-size: 8px; font-weight: bold; margin-bottom: 1mm; }
    .corner-mark { position: absolute; width: 5mm; height: 5mm; }
    .corner-mark.tl { top: 0; left: 0; border-top: 0.5mm solid #000; border-left: 0.5mm solid #000; }
    .corner-mark.tr { top: 0; right: 0; border-top: 0.5mm solid #000; border-right: 0.5mm solid #000; }
    .corner-mark.bl { bottom: 0; left: 0; border-bottom: 0.5mm solid #000; border-left: 0.5mm solid #000; }
    .corner-mark.br { bottom: 0; right: 0; border-bottom: 0.5mm solid #000; border-right: 0.5mm solid #000; }
  </style>
</head>
<body>
  <div class="cal-container">
    <div class="cal-title">CALIBRATION TEST</div>
    <div class="cal-info">Paper width: ${widthMm}mm | Measure the rulers to verify 1:1 scale</div>

    <!-- Horizontal Ruler -->
    <div class="cal-info" style="text-align: left;">Horizontal ruler (mm):</div>
    <div class="ruler-h">
      ${rulerMarks.join('')}
    </div>

    <!-- Vertical Ruler -->
    <div class="cal-info" style="text-align: left;">Vertical ruler (mm):</div>
    <div class="ruler-v">
      ${vMarks.join('')}
    </div>

    <!-- Test Boxes -->
    <div style="margin-top: 5mm;">
      <div class="cal-box">
        <div class="cal-box-title">10mm × 10mm box (measure me):</div>
        <div style="width: 10mm; height: 10mm; border: 0.3mm solid #000; background: #eee;"></div>
      </div>

      <div class="cal-box">
        <div class="cal-box-title">Full-width line test:</div>
        <div style="width: ${widthMm - 8}mm; height: 0; border-top: 0.5mm solid #000; margin: 2mm 0;"></div>
        <div style="font-size: 7px;">This line should be ${widthMm - 8}mm wide (${widthMm}mm minus 8mm padding)</div>
      </div>

      <div class="cal-box">
        <div class="cal-box-title">Text alignment test:</div>
        <div style="font-size: 10px; font-family: 'Courier New', monospace;">
          <div>|----+----|----+----|</div>
          <div>0    5    10   15   20</div>
          <div>ABCDEFGHIJKLMNOPQRST</div>
          <div>12345678901234567890</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div>If all measurements match, your printer is calibrated correctly.</div>
      <div style="font-size: 6px; color: #666; margin-top: 1mm;">Adjust offsets if content is shifted.</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Auto-select and render a template based on PrinterConfig.
 */
export function renderTemplateForConfig(config: PrinterConfig): string {
  const opts: TemplateOptions = {
    offsetTop: config.offsetTop,
    offsetLeft: config.offsetLeft,
  };

  const width = getEffectiveWidth(config);
  const height = getEffectiveHeight(config);

  if (config.printerType === "custom" && height) {
    return renderCustomLabel(width, height, opts);
  }

  return renderReceipt(width, null, opts);
}
