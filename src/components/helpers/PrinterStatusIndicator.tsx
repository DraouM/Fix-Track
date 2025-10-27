// components/helpers/PrinterStatusIndicator.tsx
import { useState, useEffect } from "react";
import { useEscPosPrinter } from "@/hooks/useEscPosPrinter";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface PrinterStatusIndicatorProps {
  printerName: string;
}

export function PrinterStatusIndicator({
  printerName,
}: PrinterStatusIndicatorProps) {
  const { getPrinterStatus } = useEscPosPrinter();
  const [status, setStatus] = useState<{
    online: boolean;
    paperStatus: string;
    errorStatus: string;
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!printerName) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getPrinterStatus(printerName);
      if (result.success) {
        setStatus(result.status);
      } else {
        setError(result.message || "Failed to get printer status");
      }
    } catch (err) {
      setError("Failed to check printer status");
      console.error("Error checking printer status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Poll for status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [printerName]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Checking printer status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
        <AlertCircle className="h-4 w-4" />
        <span>{error}</span>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  if (!status.online) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
        <XCircle className="h-4 w-4" />
        <span>Printer Offline</span>
      </div>
    );
  }

  if (status.errorStatus !== "ok") {
    return (
      <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
        <AlertTriangle className="h-4 w-4" />
        <span>Printer Error: {status.message}</span>
      </div>
    );
  }

  if (status.paperStatus === "empty") {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
        <AlertTriangle className="h-4 w-4" />
        <span>Out of Paper</span>
      </div>
    );
  }

  if (status.paperStatus === "low") {
    return (
      <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
        <AlertTriangle className="h-4 w-4" />
        <span>Low Paper</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
      <CheckCircle className="h-4 w-4" />
      <span>Printer Ready</span>
    </div>
  );
}
