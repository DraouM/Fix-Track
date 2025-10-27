// components/helpers/TestEscPosPrint.tsx
import { useState } from "react";
import { testRepairData } from "./test-receipt-data";
import { usePrintUtils } from "@/hooks/usePrintUtils";
import { Button } from "@/components/ui/button";
import { AlertCircle, Printer, Download, Info, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { PrinterSelectionDialog } from "@/components/helpers/PrinterSelectionDialog";

export function TestEscPosPrint() {
  const {
    printReceipt,
    printSticker,
    isPrinterSelectionOpen,
    setIsPrinterSelectionOpen,
    handlePrinterSelection,
  } = usePrintUtils();
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);
  const [isPrintingSticker, setIsPrintingSticker] = useState(false);

  const handlePrintReceipt = async () => {
    setIsPrintingReceipt(true);
    try {
      const success = await printReceipt(testRepairData, {
        includePayments: true,
        includeParts: true,
        useEscPos: true, // Use ESC/POS
      });

      if (success) {
        toast.success("✅ ESC/POS receipt printed successfully!");
      } else {
        toast.error("❌ Failed to print ESC/POS receipt");
        toast.info(
          "📄 You can still print using the regular print option or download as HTML"
        );
      }
    } catch (error) {
      console.error("Error printing receipt:", error);
      toast.error(
        "❌ Error printing ESC/POS receipt: " + (error as Error).message
      );
      toast.info(
        "📄 You can still print using the regular print option or download as HTML"
      );
    } finally {
      setIsPrintingReceipt(false);
    }
  };

  const handlePrintSticker = async () => {
    setIsPrintingSticker(true);
    try {
      const success = await printSticker(testRepairData, {
        useEscPos: true, // Use ESC/POS
      });

      if (success) {
        toast.success("✅ ESC/POS sticker printed successfully!");
      } else {
        toast.error("❌ Failed to print ESC/POS sticker");
        toast.info(
          "📄 You can still print using the regular print option or download as HTML"
        );
      }
    } catch (error) {
      console.error("Error printing sticker:", error);
      toast.error(
        "❌ Error printing ESC/POS sticker: " + (error as Error).message
      );
      toast.info(
        "📄 You can still print using the regular print option or download as HTML"
      );
    } finally {
      setIsPrintingSticker(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        Test ESC/POS Printing
      </h2>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>ESC/POS Printing</AlertTitle>
        <AlertDescription>
          This will generate ESC/POS commands and send them directly to your
          thermal printer. Make sure your printer supports ESC/POS commands and
          is properly connected.
        </AlertDescription>
      </Alert>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-800">Printer Setup Tips</h3>
            <ul className="list-disc list-inside text-sm text-blue-700 mt-1 space-y-1">
              <li>
                Connect your thermal printer via USB, Bluetooth, or network
              </li>
              <li>Install the appropriate drivers for your printer model</li>
              <li>Select the correct printer from the printer settings</li>
              <li>Ensure the printer is loaded with thermal paper</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button
          onClick={handlePrintReceipt}
          disabled={isPrintingReceipt}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
        >
          {isPrintingReceipt ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Printing...
            </>
          ) : (
            <>
              <Printer className="h-4 w-4" />
              Print ESC/POS Receipt
            </>
          )}
        </Button>

        <Button
          onClick={handlePrintSticker}
          disabled={isPrintingSticker}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
        >
          {isPrintingSticker ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Printing...
            </>
          ) : (
            <>
              <Printer className="h-4 w-4" />
              Print ESC/POS Sticker
            </>
          )}
        </Button>
      </div>

      {/* Printer Selection Dialog */}
      <PrinterSelectionDialog
        open={isPrinterSelectionOpen}
        onOpenChange={setIsPrinterSelectionOpen}
        onPrinterSelect={handlePrinterSelection}
        title="Select Printer"
        description="Choose a printer for your test document"
      />
    </div>
  );
}
