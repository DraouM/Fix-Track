// components/helpers/PrinterSelector.tsx
import { useState, useEffect } from "react";
import { useEscPosPrinter } from "@/hooks/useEscPosPrinter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Printer, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PrinterSelectorProps {
  onPrinterSelect: (printer: string) => void;
  selectedPrinter?: string;
}

export function PrinterSelector({
  onPrinterSelect,
  selectedPrinter,
}: PrinterSelectorProps) {
  const { getAvailablePrinters } = useEscPosPrinter();
  const [printers, setPrinters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrinters = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getAvailablePrinters();
      if (result.success) {
        setPrinters(result.printers);
        // Select the first printer by default if none is selected
        if (!selectedPrinter && result.printers.length > 0) {
          onPrinterSelect(result.printers[0]);
        }
      } else {
        setError(result.message || "Failed to fetch printers");
        // Provide fallback options
        const fallbackPrinters = [
          "USB Thermal Printer",
          "Network Printer",
          "Bluetooth Printer",
          "Default System Printer",
        ];
        setPrinters(fallbackPrinters);
        if (!selectedPrinter) {
          onPrinterSelect(fallbackPrinters[0]);
        }
      }
    } catch (err) {
      setError("Failed to fetch printers");
      console.error("Error fetching printers:", err);
      // Provide fallback options even in case of error
      const fallbackPrinters = [
        "USB Thermal Printer",
        "Network Printer",
        "Bluetooth Printer",
        "Default System Printer",
      ];
      setPrinters(fallbackPrinters);
      if (!selectedPrinter) {
        onPrinterSelect(fallbackPrinters[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrinters();
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Select
            value={selectedPrinter}
            onValueChange={onPrinterSelect}
            disabled={isLoading || printers.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a printer">
                {selectedPrinter || "Select a printer"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {printers.map((printer, index) => (
                <SelectItem key={index} value={printer}>
                  <div className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    {printer}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={fetchPrinters}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        <p>
          Select your thermal printer. If you don't see your printer listed:
        </p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Make sure your printer is connected and powered on</li>
          <li>Check that the printer drivers are installed</li>
          <li>Try refreshing the printer list</li>
        </ul>
      </div>
    </div>
  );
}
