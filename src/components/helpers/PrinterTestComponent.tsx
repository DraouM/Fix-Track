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
} from "lucide-react";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core"; // Import Tauri invoke directly

interface PrinterTestComponentProps {
  className?: string;
}

export function PrinterTestComponent({ className }: PrinterTestComponentProps) {
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Fetch available printers directly using Tauri API
  const fetchPrinters = async () => {
    setIsLoading(true);
    try {
      const printerList = await invoke<string[]>("get_available_printers");

      if (Array.isArray(printerList)) {
        setPrinters(printerList);
        if (printerList.length > 0 && !selectedPrinter) {
          setSelectedPrinter(printerList[0]);
        }
        toast.success("Printers loaded successfully");
      } else {
        toast.error("Failed to load printers");
      }
    } catch (error) {
      console.error("Error fetching printers:", error);
      toast.error("Failed to fetch printers");
    } finally {
      setIsLoading(false);
    }
  };

  // Test printer directly using Tauri API
  const testPrinter = async (testType: "simple" | "detailed" = "simple") => {
    if (!selectedPrinter && printers.length > 0) {
      toast.error("Please select a printer");
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Generate ESC/POS test commands based on test type
      let commands: number[] = [];

      if (testType === "simple") {
        // Simple test - print a basic message
        commands = [
          0x1b,
          0x40, // Initialize printer
          0x1b,
          0x61,
          0x01, // Center align
          0x1b,
          0x21,
          0x11, // Double height
          ...Array.from("PRINTER TEST").map((c) => c.charCodeAt(0)),
          0x0a, // Line feed
          0x1b,
          0x21,
          0x00, // Normal size
          ...Array.from("Fixary App Test").map((c) => c.charCodeAt(0)),
          0x0a,
          0x0a, // Double line feed
          0x1d,
          0x56,
          0x00, // Cut paper
        ];
      } else if (testType === "detailed") {
        // Detailed test - print comprehensive test page
        commands = [
          0x1b,
          0x40, // Initialize printer
          0x1b,
          0x61,
          0x01, // Center align
          0x1b,
          0x21,
          0x31, // Double width/height
          ...Array.from("PRINTER TEST").map((c) => c.charCodeAt(0)),
          0x0a, // Line feed
          0x1b,
          0x21,
          0x01, // Emphasized
          ...Array.from("================").map((c) => c.charCodeAt(0)),
          0x0a, // Line feed
          0x1b,
          0x61,
          0x00, // Left align
          0x1b,
          0x21,
          0x00, // Normal size
          ...Array.from("Date: " + new Date().toLocaleString()).map((c) =>
            c.charCodeAt(0)
          ),
          0x0a, // Line feed
          0x0a, // Line feed
          ...Array.from("This is a test print from Fixary app.").map((c) =>
            c.charCodeAt(0)
          ),
          0x0a, // Line feed
          0x0a, // Line feed
          ...Array.from(
            "If you can read this, the printer is working correctly."
          ).map((c) => c.charCodeAt(0)),
          0x0a,
          0x0a,
          0x0a, // Triple line feed
          0x1d,
          0x56,
          0x00, // Cut paper
        ];
      }

      // Send commands to printer directly using Tauri API
      const result = await invoke<string>("print_escpos_commands", {
        commands: commands,
        printer_address: selectedPrinter || null,
      });

      setTestResult({
        success: true,
        message: "Test print command sent successfully!",
      });
      toast.success("Test print command sent successfully!");
    } catch (error) {
      console.error("Error testing printer:", error);
      setTestResult({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to send print command",
      });
      toast.error(
        `Print test failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsTesting(false);
    }
  };

  // Test simple print
  const handleSimpleTest = () => {
    testPrinter("simple");
  };

  // Test detailed print
  const handleDetailedTest = () => {
    testPrinter("detailed");
  };

  useEffect(() => {
    fetchPrinters();
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
        {/* Printer Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Printer</label>
          <div className="flex gap-2">
            <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a printer" />
              </SelectTrigger>
              <SelectContent>
                {printers.map((printer, index) => (
                  <SelectItem key={index} value={printer}>
                    {printer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchPrinters}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
          {printers.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">
              No printers found. Connect your printer and refresh.
            </p>
          )}
        </div>

        {/* Test Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleSimpleTest}
            disabled={isTesting || printers.length === 0}
            className="w-full"
          >
            {isTesting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Printer className="mr-2 h-4 w-4" />
            )}
            Simple Test Print
          </Button>

          <Button
            variant="secondary"
            onClick={handleDetailedTest}
            disabled={isTesting || printers.length === 0}
            className="w-full"
          >
            {isTesting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Printer className="mr-2 h-4 w-4" />
            )}
            Detailed Test Print
          </Button>
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={`p-3 rounded-md flex items-start gap-2 ${
              testResult.success
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {testResult.success ? (
              <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p className="font-medium">
                {testResult.success ? "Success" : "Error"}
              </p>
              <p className="text-sm">{testResult.message}</p>
            </div>
          </div>
        )}

        {/* Printer Info */}
        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-1">Printer Information:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>XP-365B is supported (VID: 1504)</li>
            <li>Connect via USB, network (port 9100), or Bluetooth</li>
            <li>Ensure printer is powered on and connected</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
