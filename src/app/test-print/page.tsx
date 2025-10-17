"use client";

import { TestReceiptPrint } from "@/components/helpers/TestReceiptPrint";

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
            <li>
              If printing fails, try the "Download Receipt" option as backup
            </li>
          </ul>
        </div>
        <TestReceiptPrint />
      </div>
    </div>
  );
}
