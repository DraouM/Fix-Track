// components/helpers/PrinterTestComponent.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Printer,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Receipt,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core"; // Import Tauri invoke directly

import { useSettings } from "@/context/SettingsContext";

interface PrinterTestComponentProps {
  className?: string;
}

export function PrinterTestComponent({ className }: PrinterTestComponentProps) {
  const { availablePrinters, refreshPrinters, settings } = useSettings();
  const [selectedPrinter, setSelectedPrinter] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Fetch available printers
  const handleRefresh = async () => {
    setIsLoading(true);
    await refreshPrinters();
    setIsLoading(false);
    toast.success("Printer list updated");
  };

  // Test printer directly using Tauri API
  const testPrinter = async (target: "receipt" | "sticker" | "custom") => {
    const config = settings.printerConfig;
    const printerName = target === "custom" 
      ? selectedPrinter 
      : target === "receipt" 
        ? config.receiptPrinterName 
        : config.stickerPrinterName;

    if (!printerName) {
      toast.error(`No printer configured for ${target}`);
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      if (target === "sticker") {
        const data = {
          barcode: "REP-TEST",
          itemName: "TEST STICKER",
          customerName: "TEST",
          customerPhone: "0550000000",
          issue: "Test Issue",
          price: 99.99
        };
        await invoke("print_sticker_direct", { config, data });
      } else {
        const data = {
          orderId: "TEST-001",
          customer: "Test Customer",
          items: [{ name: "Test Item", qty: 1, price: 10.00 }],
          total: 10.00
        };
        await invoke("print_receipt_direct", { config, data });
      }

      setTestResult({
        success: true,
        message: `Test ${target} sent to ${printerName}`,
      });
      toast.success("Print command sent!");
    } catch (error) {
      console.error("Error testing printer:", error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    if (availablePrinters.length > 0 && !selectedPrinter) {
      setSelectedPrinter(availablePrinters[0]);
    }
  }, [availablePrinters]);

  // Test simple print
  const handleSimpleTest = () => {
    // testPrinter("simple");
  };

  // Test detailed print
  const handleDetailedTest = () => {
    // testPrinter("detailed");
  };

  useEffect(() => {
    // fetchPrinters();
  }, []);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          Printer Test
        </CardTitle>
        <CardDescription>
          Test your XP-365B or other ESC/POS compatible printer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Printer Selection (Manual/Custom) */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Test Custom Printer Selection</label>
            <div className="flex gap-2">
              <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a printer" />
                </SelectTrigger>
                <SelectContent>
                  {availablePrinters.map((printer, index) => (
                    <SelectItem key={index} value={printer}>
                      {printer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button
            onClick={() => testPrinter("custom")}
            disabled={isTesting || availablePrinters.length === 0}
            variant="outline"
            className="w-full border-dashed"
          >
            {isTesting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Printer className="mr-2 h-4 w-4" />
            )}
            Test Manual Selection
          </Button>
        </div>

        <div className="divider my-4 border-t border-gray-100"></div>

        {/* Quick Config Tests */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={() => testPrinter("receipt")}
            disabled={isTesting || !settings.printerConfig.receiptPrinterName}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Receipt className="mr-2 h-4 w-4" />
            Test Receipt Printer
          </Button>

          <Button
            onClick={() => testPrinter("sticker")}
            disabled={isTesting || !settings.printerConfig.stickerPrinterName}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            <Tag className="mr-2 h-4 w-4" />
            Test Sticker Printer
          </Button>
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={`p-4 rounded-xl flex items-start gap-3 border shadow-sm ${
              testResult.success
                ? "bg-green-50 border-green-100 text-green-800"
                : "bg-red-50 border-red-100 text-red-800"
            }`}
          >
            {testResult.success ? (
              <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-600" />
            )}
            <div>
              <p className="font-bold">
                {testResult.success ? "Success" : "Error"}
              </p>
              <p className="text-xs opacity-90">{testResult.message}</p>
            </div>
          </div>
        )}

        {/* Printer Info */}
        <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
          <p className="font-bold mb-2 flex items-center gap-2">
            <AlertCircle className="h-3 w-3" />
            Troubleshooting
          </p>
          <ul className="list-disc list-inside space-y-1 opacity-80">
            <li>Ensure "Native Printing" is enabled in Settings</li>
            <li>Printers must be installed in Windows to appear here</li>
            <li>For Bluetooth (XP-365B), ensure it's paired and "Online"</li>
            <li>Native printing bypasses the browser print dialog</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
