import { useState } from "react";
import { StickerTemplate } from "./StickerTemplate";
import { testRepairData } from "./test-receipt-data";
import { usePrintUtils } from "@/hooks/usePrintUtils";
import { Button } from "@/components/ui/button";
import { AlertCircle, Printer, Download } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function TestStickerPrint() {
  const { printSticker, downloadAsHTML } = usePrintUtils();
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrintTest = async () => {
    setIsPrinting(true);
    try {
      await printSticker(testRepairData);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadTest = async () => {
    setIsDownloading(true);
    try {
      await downloadAsHTML(testRepairData, "sticker");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        Test Sticker Printing
      </h2>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Popup Blocker Notice</AlertTitle>
        <AlertDescription>
          If printing doesn't work, check if popups are blocked and allow them
          for this site. Alternatively, use the Download button to save the
          sticker as an HTML file.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap gap-4">
        <Button
          onClick={handlePrintTest}
          disabled={isPrinting}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          {isPrinting ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Printing...
            </>
          ) : (
            <>
              <Printer className="h-4 w-4" />
              Print Test Sticker
            </>
          )}
        </Button>

        <Button
          onClick={handleDownloadTest}
          disabled={isDownloading}
          variant="outline"
          className="flex items-center gap-2"
        >
          {isDownloading ? (
            <>
              <div className="h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download Sticker
            </>
          )}
        </Button>
      </div>

      <div className="border p-4 rounded-lg bg-gray-50">
        <h3 className="font-bold mb-2 text-gray-700">Preview:</h3>
        <div className="flex justify-center">
          <div
            className="bg-white p-2 shadow-sm"
            style={{ width: "2in", height: "1in" }}
          >
            <StickerTemplate data={testRepairData} type="repair" />
          </div>
        </div>
      </div>
    </div>
  );
}
