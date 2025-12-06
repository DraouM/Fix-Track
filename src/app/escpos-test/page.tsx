// app/escpos-test/page.tsx
"use client";

import { useEffect } from "react";
import { useEscPosPrinter } from "@/hooks/useEscPosPrinter";
import { testRepairData } from "@/components/helpers/test-receipt-data";
// import { FontChangeTest } from "@/components/helpers/FontChangeTest";

export default function EscPosTestPage() {
  const { generateReceiptCommands, generateStickerCommands } =
    useEscPosPrinter();

  useEffect(() => {
    // Test receipt generation
    try {
      console.log("Testing receipt generation...");
      const receiptCommands = generateReceiptCommands(testRepairData, {
        autoCut: true,
      });
      console.log(
        "Receipt commands generated successfully:",
        receiptCommands.length,
        "bytes"
      );
    } catch (error) {
      console.error("Error generating receipt:", error);
    }

    // Test sticker generation
    try {
      console.log("Testing sticker generation...");
      const stickerCommands = generateStickerCommands(testRepairData, {
        autoCut: true,
      });
      console.log(
        "Sticker commands generated successfully:",
        stickerCommands.length,
        "bytes"
      );
    } catch (error) {
      console.error("Error generating sticker:", error);
    }
  }, [generateReceiptCommands, generateStickerCommands]);

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">ESC/POS Test Page</h1>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Testing ESC/POS Functionality
          </h2>
          <p className="mb-4">
            This page automatically tests the ESC/POS command generation
            functionality. Check the browser console for results.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Receipt commands generation</li>
            <li>Sticker commands generation</li>
            <li>Auto-cut functionality</li>
            <li>Barcode generation</li>
          </ul>
        </div>

        {/* Add the font change test */}
        <div className="mb-6">{/* <FontChangeTest /> */}</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Receipt Features</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Auto-cut support
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Barcode generation
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Font sizing
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Text alignment
              </li>
            </ul>
          </div>

          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Sticker Features</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Compact formatting
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Auto-cut support
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Device information
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Customer details
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Implementation Notes</h3>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>Uses @point-of-sale/receipt-printer-encoder library</li>
            <li>Generates ESC/POS commands for thermal printers</li>
            <li>Supports auto-cut functionality with .cut("full")</li>
            <li>Compatible with Tauri desktop application</li>
            <li>Handles font sizing by using newlines appropriately</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
