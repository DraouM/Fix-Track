// components/helpers/PrinterSelectionDialog.tsx
import { useState, useEffect } from "react";
import { useEscPosPrinter } from "@/hooks/useEscPosPrinter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertCircle, Printer, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PrinterSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrinterSelect: (printer: string) => void;
  title?: string;
  description?: string;
}

export function PrinterSelectionDialog({
  open,
  onOpenChange,
  onPrinterSelect,
  title = "Select Printer",
  description = "Choose a printer for your document",
}: PrinterSelectionDialogProps) {
  const { getAvailablePrinters } = useEscPosPrinter();
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrinters = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getAvailablePrinters();
      if (result.success) {
        setPrinters(result.printers);
        // Auto-select the first printer if only one is available
        if (result.printers.length === 1) {
          setSelectedPrinter(result.printers[0]);
        }
      } else {
        setError(result.message || "Failed to fetch printers");
        setPrinters([]);
      }
    } catch (err) {
      setError("Failed to fetch printers");
      console.error("Error fetching printers:", err);
      setPrinters([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedPrinter) {
      // Extract printer address from the selected printer string
      // Format: "USB Printer: Name (VID: xxxx, PID: xxxx, Path: path)" or "Network Printer (IP:PORT)"
      let printerAddress = selectedPrinter;
      
      // Try to extract address from printer string
      if (selectedPrinter.includes("(") && selectedPrinter.includes(")")) {
        const addrStart = selectedPrinter.indexOf("(");
        const addrEnd = selectedPrinter.indexOf(")");
        const addressPart = selectedPrinter.substring(addrStart + 1, addrEnd);
        
        // Check if it's a network printer (contains IP:PORT)
        if (addressPart.includes(":") && addressPart.split(":").length === 2) {
          const parts = addressPart.split(":");
          if (parts[0].match(/^\d+\.\d+\.\d+\.\d+$/) || parts[0].includes(".")) {
            printerAddress = addressPart; // Use IP:PORT format
          }
        } else if (addressPart.startsWith("USB:") || addressPart.startsWith("\\\\.\\")) {
          printerAddress = addressPart;
        }
      }
      
      onPrinterSelect(printerAddress);
      onOpenChange(false);
    } else {
      toast.error("Please select a printer");
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  useEffect(() => {
    if (open) {
      fetchPrinters();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Detecting printers...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : printers.length === 0 ? (
            <div className="text-center py-4">
              <Printer className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No printers found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No printers are currently connected or detected.
              </p>
              <div className="mt-4 text-left text-xs text-gray-500">
                <p className="font-medium">Troubleshooting tips:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Check that your printer is connected and powered on</li>
                  <li>Ensure printer drivers are installed</li>
                  <li>Verify USB, network, or Bluetooth connections</li>
                  <li>Try refreshing the printer list</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Available Printers
                </label>
                <Select
                  value={selectedPrinter}
                  onValueChange={setSelectedPrinter}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select a printer" />
                  </SelectTrigger>
                  <SelectContent>
                    {printers.map((printer, index) => (
                      <SelectItem key={index} value={printer}>
                        <div className="flex items-center gap-2">
                          <Printer className="h-4 w-4" />
                          <span>{printer}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-4">
            <Button
              variant="outline"
              onClick={fetchPrinters}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={
                  !selectedPrinter || isLoading || printers.length === 0
                }
              >
                Print
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
