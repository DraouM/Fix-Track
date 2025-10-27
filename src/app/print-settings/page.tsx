// app/print-settings/page.tsx
"use client";

import { useState } from "react";
import { PrinterSelector } from "@/components/helpers/PrinterSelector";
import { TestEscPosPrint } from "@/components/helpers/TestEscPosPrint";
import { EscPosTestComponent } from "@/components/helpers/EscPosTestComponent";
import { PrinterStatusIndicator } from "@/components/helpers/PrinterStatusIndicator";
import { PrinterSelectionDialog } from "@/components/helpers/PrinterSelectionDialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save, PrinterIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { usePrintUtils } from "@/hooks/usePrintUtils";

export default function PrintSettingsPage() {
  const [selectedPrinter, setSelectedPrinter] = useState<string>("");
  const [autoCutEnabled, setAutoCutEnabled] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const {
    isPrinterSelectionOpen,
    setIsPrinterSelectionOpen,
    handlePrinterSelection,
  } = usePrintUtils();

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // In a real app, you would save these settings to localStorage or a database
      localStorage.setItem(
        "printSettings",
        JSON.stringify({
          selectedPrinter,
          autoCutEnabled,
        })
      );

      // Show success message
      toast.success("Print settings saved successfully!");
    } catch (error) {
      console.error("Error saving print settings:", error);
      toast.error("Failed to save print settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Print Settings</h1>
          <p className="text-muted-foreground">
            Configure your thermal printer settings and test printing
            functionality
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Printer Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Printer Configuration</CardTitle>
              <CardDescription>
                Select and configure your thermal printer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Available Printers</Label>
                <PrinterSelector
                  onPrinterSelect={setSelectedPrinter}
                  selectedPrinter={selectedPrinter}
                />
              </div>

              {/* Printer Status Indicator */}
              {selectedPrinter && (
                <div className="pt-4">
                  <Label>Printer Status</Label>
                  <PrinterStatusIndicator printerName={selectedPrinter} />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto-cut</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically cut paper after printing
                  </p>
                </div>
                <Switch
                  checked={autoCutEnabled}
                  onCheckedChange={setAutoCutEnabled}
                />
              </div>

              <Button
                onClick={handleSaveSettings}
                disabled={isSaving || !selectedPrinter}
                className="w-full"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </CardContent>
          </Card>

          {/* Print Testing */}
          <Card>
            <CardHeader>
              <CardTitle>Print Testing</CardTitle>
              <CardDescription>Test your printer configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <TestEscPosPrint />
            </CardContent>
          </Card>
        </div>

        {/* Advanced Testing */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Advanced Testing</CardTitle>
            <CardDescription>
              Detailed ESC/POS functionality testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EscPosTestComponent />
          </CardContent>
        </Card>

        {/* Print Tips */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>
              <PrinterIcon className="inline mr-2 h-5 w-5" />
              Print Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Make sure your thermal printer is properly connected and powered
                on
              </li>
              <li>Check that the printer supports ESC/POS commands</li>
              <li>Ensure your printer drivers are up to date</li>
              <li>For best results, use high-quality thermal paper</li>
              <li>
                If printing fails, check the printer's error status and paper
                alignment
              </li>
              <li>
                Make sure your printer is selected as the default printer in
                your operating system settings
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>
              <AlertCircle className="inline mr-2 h-5 w-5" />
              Troubleshooting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Common Issues and Solutions</h3>
                <ul className="list-disc pl-5 space-y-2 mt-2 text-sm">
                  <li>
                    <strong>Printer not found:</strong> Check USB connection and
                    ensure drivers are installed
                  </li>
                  <li>
                    <strong>Garbled text:</strong> Verify your printer supports
                    ESC/POS commands
                  </li>
                  <li>
                    <strong>Paper not cutting:</strong> Check if auto-cut is
                    enabled and supported by your printer
                  </li>
                  <li>
                    <strong>Nothing prints:</strong> Check if the printer is set
                    as default and not paused
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium">Need Help?</h3>
                <p className="text-sm mt-1">
                  If you're still having issues, try the regular print option or
                  download the document as HTML and print manually.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Printer Selection Dialog */}
      <PrinterSelectionDialog
        open={isPrinterSelectionOpen}
        onOpenChange={setIsPrinterSelectionOpen}
        onPrinterSelect={handlePrinterSelection}
        title="Select Printer"
        description="Choose a printer for testing"
      />
    </div>
  );
}
