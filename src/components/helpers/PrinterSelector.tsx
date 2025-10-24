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
import {
  Printer,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface PrinterSelectorProps {
  onPrinterSelect: (printer: string) => void;
  selectedPrinter?: string;
}

export function PrinterSelector({
  onPrinterSelect,
  selectedPrinter,
}: PrinterSelectorProps) {
  const { getAvailablePrinters, getPrinterStatus } = useEscPosPrinter();
  const [printers, setPrinters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printerStatus, setPrinterStatus] = useState<
    Record<
      string,
      {
        online: boolean;
        paperStatus: string;
        errorStatus: string;
        message: string;
      }
    >
  >({});

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

        // Check status for each printer
        checkPrinterStatus(result.printers);
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

  const checkPrinterStatus = async (printerList: string[]) => {
    const statusMap: Record<
      string,
      {
        online: boolean;
        paperStatus: string;
        errorStatus: string;
        message: string;
      }
    > = {};

    // Check status for each printer
    for (const printer of printerList) {
      try {
        const statusResult = await getPrinterStatus(printer);
        statusMap[printer] = {
          online: statusResult.status.online,
          paperStatus: statusResult.status.paperStatus,
          errorStatus: statusResult.status.errorStatus,
          message: statusResult.status.message,
        };
      } catch (err) {
        statusMap[printer] = {
          online: false,
          paperStatus: "ok",
          errorStatus: "other",
          message: "Status check failed",
        };
      }
    }

    setPrinterStatus(statusMap);
  };

  const getPrinterStatusIcon = (printer: string) => {
    const status = printerStatus[printer];
    if (!status) return <Printer className="h-4 w-4" />;

    if (!status.online) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }

    if (status.errorStatus !== "ok") {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }

    if (status.paperStatus === "empty") {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }

    if (status.paperStatus === "low") {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }

    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getPrinterStatusTooltip = (printer: string) => {
    const status = printerStatus[printer];
    if (!status) return "Checking status...";

    if (!status.online) {
      return "Printer offline";
    }

    if (status.errorStatus !== "ok") {
      return `Printer error: ${status.message}`;
    }

    if (status.paperStatus === "empty") {
      return "Out of paper";
    }

    if (status.paperStatus === "low") {
      return "Low paper";
    }

    return "Printer ready";
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
                    {getPrinterStatusIcon(printer)}
                    <span title={getPrinterStatusTooltip(printer)}>
                      {printer}
                    </span>
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
