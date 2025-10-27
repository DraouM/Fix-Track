// components/helpers/EscPosValidationTest.tsx
import { useEffect } from "react";
import { useEscPosPrinter } from "@/hooks/useEscPosPrinter";
import { testRepairData } from "./test-receipt-data";

export function EscPosValidationTest() {
  const { generateReceiptCommands, generateStickerCommands, sendToPrinter } =
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

      // Test sending to printer (simulated)
      sendToPrinter(receiptCommands).then((result) => {
        console.log("Receipt send result:", result);
      });
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

      // Test sending to printer (simulated)
      sendToPrinter(stickerCommands).then((result) => {
        console.log("Sticker send result:", result);
      });
    } catch (error) {
      console.error("Error generating sticker:", error);
    }
  }, [generateReceiptCommands, generateStickerCommands, sendToPrinter]);

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">ESC/POS Validation Test</h3>
      <p className="text-sm text-gray-700">
        Check the browser console for test results. This component automatically
        tests receipt and sticker command generation on mount.
      </p>
    </div>
  );
}
