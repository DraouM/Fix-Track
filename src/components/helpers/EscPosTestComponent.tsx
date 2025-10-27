// components/helpers/EscPosTestComponent.tsx
import { useEffect, useState } from "react";
import { useEscPosPrinter } from "@/hooks/useEscPosPrinter";
import { testRepairData } from "./test-receipt-data";

export function EscPosTestComponent() {
  const {
    generateReceiptCommands,
    generateStickerCommands,
    sendToPrinter,
    getAvailablePrinters,
  } = useEscPosPrinter();
  const [printers, setPrinters] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchPrinters = async () => {
      const result = await getAvailablePrinters();
      if (result.success) {
        setPrinters(result.printers);
      } else {
        console.error("Failed to get printers:", result.message);
      }
    };

    fetchPrinters();
  }, [getAvailablePrinters]);

  const testReceiptGeneration = async () => {
    try {
      setIsGenerating(true);
      const commands = generateReceiptCommands(testRepairData, {
        autoCut: true,
      });
      console.log("Generated receipt commands:", commands);
      console.log("Commands length:", commands.length);

      // Test sending to printer
      const result = await sendToPrinter(commands);
      if (result.success) {
        alert(
          `Successfully generated and sent receipt commands (${commands.length} bytes)`
        );
      } else {
        alert(
          `Generated receipt commands (${commands.length} bytes) but failed to send: ${result.message}`
        );
      }
    } catch (error) {
      console.error("Error generating receipt:", error);
      alert("Error generating receipt: " + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const testStickerGeneration = async () => {
    try {
      setIsGenerating(true);
      const commands = generateStickerCommands(testRepairData, {
        autoCut: true,
      });
      console.log("Generated sticker commands:", commands);
      console.log("Commands length:", commands.length);

      // Test sending to printer
      const result = await sendToPrinter(commands);
      if (result.success) {
        alert(
          `Successfully generated and sent sticker commands (${commands.length} bytes)`
        );
      } else {
        alert(
          `Generated sticker commands (${commands.length} bytes) but failed to send: ${result.message}`
        );
      }
    } catch (error) {
      console.error("Error generating sticker:", error);
      alert("Error generating sticker: " + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">ESC/POS Printer Test</h3>

      <div className="mb-4">
        <h4 className="font-medium mb-2">Available Printers:</h4>
        {printers.length > 0 ? (
          <ul className="list-disc pl-5">
            {printers.map((printer, index) => (
              <li key={index}>{printer}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No printers found or loading...</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={testReceiptGeneration}
          disabled={isGenerating}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isGenerating ? "Generating..." : "Test Receipt"}
        </button>

        <button
          onClick={testStickerGeneration}
          disabled={isGenerating}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isGenerating ? "Generating..." : "Test Sticker"}
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>Check the browser console for detailed output.</p>
      </div>
    </div>
  );
}
