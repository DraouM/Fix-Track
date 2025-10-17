import { useState } from "react";
import { ReceiptTemplate } from "./ReceiptTemplate";
import { testRepairData } from "./test-receipt-data";
import { usePrintUtils } from "@/hooks/usePrintUtils";
import { Button } from "@/components/ui/button";
import { AlertCircle, Printer, Download } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function TestReceiptPrint() {
  const { printReceipt, downloadAsHTML } = usePrintUtils();
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrintTest = async () => {
    setIsPrinting(true);
    try {
      await printReceipt(testRepairData, {
        includePayments: true,
        includeParts: true,
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadTest = async () => {
    setIsDownloading(true);
    try {
      await downloadAsHTML(testRepairData, "receipt");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        Test Receipt Printing
      </h2>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Popup Blocker Notice</AlertTitle>
        <AlertDescription>
          If printing doesn't work, check if popups are blocked and allow them
          for this site. Alternatively, use the Download button to save the
          receipt as an HTML file.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap gap-4">
        <Button
          onClick={handlePrintTest}
          disabled={isPrinting}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          {isPrinting ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Printing...
            </>
          ) : (
            <>
              <Printer className="h-4 w-4" />
              Print Test Receipt
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
              Download Receipt
            </>
          )}
        </Button>
      </div>

      <div className="border p-4 rounded-lg bg-gray-50">
        <h3 className="font-bold mb-2 text-gray-700">Preview:</h3>
        <div className="max-w-[80mm] mx-auto bg-white p-2 shadow-sm">
          <ReceiptTemplate
            repair={testRepairData}
            includePayments={true}
            includeParts={true}
          />
        </div>
      </div>
    </div>
  );
}
