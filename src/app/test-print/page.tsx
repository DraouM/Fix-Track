"use client";

import { TestReceiptPrint } from "@/components/helpers/TestReceiptPrint";
import { TestStickerPrint } from "@/components/helpers/TestStickerPrint";
import { TestEscPosPrint } from "@/components/helpers/TestEscPosPrint";
import { EscPosTestComponent } from "@/components/helpers/EscPosTestComponent";
import { EscPosValidationTest } from "@/components/helpers/EscPosValidationTest"; // Add this import

export default function TestPrintPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">
            🖨️ Print Test Instructions
          </h2>
          <ul className="list-disc list-inside text-blue-700 space-y-1">
            <li>
              If you see a popup blocker message, please allow popups for this
              site
            </li>
            <li>
              Make sure your thermal printer is connected and set as default
              printer
            </li>
            <li>For best results, use Chrome or Edge browser</li>
            <li>If printing fails, try the "Download" option as backup</li>
            <li>Sticker prints are optimized for 2" x 1" label printers</li>
          </ul>
        </div>

        {/* Add validation test at the top */}
        <div className="mb-8">
          <EscPosValidationTest />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border rounded-lg p-4">
            <TestReceiptPrint />
          </div>
          <div className="border rounded-lg p-4">
            <TestStickerPrint />
          </div>
        </div>

        {/* Add ESC/POS testing section */}
        <div className="mt-8 border rounded-lg p-4">
          <TestEscPosPrint />
        </div>

        {/* Add ESC/POS test component for development */}
        <div className="mt-8 border rounded-lg p-4">
          <EscPosTestComponent />
        </div>
      </div>
    </div>
  );
}
