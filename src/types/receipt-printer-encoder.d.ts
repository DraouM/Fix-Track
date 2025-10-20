// types/receipt-printer-encoder.d.ts
declare module "@point-of-sale/receipt-printer-encoder" {
  export default class ReceiptPrinterEncoder {
    constructor();

    // Initialization
    initialize(): this;

    // Text formatting
    text(content: string): this;
    newline(): this;
    align(alignment: "left" | "center" | "right"): this;
    size(
      size:
        | "normal"
        | "double-width"
        | "double-height"
        | "double-width-double-height"
    ): this;

    // Cut commands
    cut(type: "full" | "partial"): this;

    // Barcodes
    barcode(
      content: string,
      type:
        | "upc-a"
        | "upc-e"
        | "ean13"
        | "ean8"
        | "code39"
        | "code128"
        | "code93"
        | "codabar"
        | "itf"
        | "gs1-databar-omni"
        | "gs1-databar-truncated"
        | "gs1-databar-limited"
        | "gs1-databar-expanded",
      options?: {
        width?: number;
        height?: number;
        hri?: "none" | "above" | "below" | "both";
        font?:
          | "font-a"
          | "font-b"
          | "font-c"
          | "font-d"
          | "font-e"
          | "font-special-a"
          | "font-special-b";
      }
    ): this;

    // Generate commands
    encode(): Uint8Array;
  }
}
