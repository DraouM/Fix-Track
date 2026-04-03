"use client";

import React, { useState, useCallback, useEffect } from "react";
import { PrinterConfig, DEFAULT_PRINTER_CONFIG } from "@/types/settings";
import { getPrinterConfig, savePrinterConfig, getEffectiveWidth } from "@/lib/printerConfig";
import { renderTemplateForConfig } from "@/lib/thermalTemplates";
import { PrinterConfigPanel } from "./PrinterConfigPanel";
import { CalibrationPanel } from "./CalibrationPanel";
import { ReceiptPreview } from "./ReceiptPreview";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Printer,
  Settings2,
  Ruler,
  Eye,
  FileText,
  CheckCircle2,
} from "lucide-react";

type ActiveTab = "config" | "calibrate" | "preview";

export function PrintTestPage() {
  const [config, setConfig] = useState<PrinterConfig>(DEFAULT_PRINTER_CONFIG);
  const [activeTab, setActiveTab] = useState<ActiveTab>("config");
  const [isPrinting, setIsPrinting] = useState(false);

  // Load config from localStorage on mount
  useEffect(() => {
    setConfig(getPrinterConfig());
  }, []);

  const handleSave = useCallback(() => {
    savePrinterConfig(config);
  }, [config]);

  const handlePrintTestReceipt = useCallback(() => {
    setIsPrinting(true);
    try {
      const html = renderTemplateForConfig(config);

      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.left = "-9999px";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.visibility = "hidden";

      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.write(html);
        iframeDoc.close();

        iframe.onload = () => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            toast.success("Test receipt sent to printer!");
          } catch (err) {
            console.error("Print failed:", err);
            // Fallback to window.open
            const printWindow = window.open("", "_blank", "width=400,height=600");
            if (printWindow) {
              printWindow.document.write(html);
              printWindow.document.close();
              printWindow.onload = () => {
                printWindow.focus();
                printWindow.print();
                setTimeout(() => printWindow.close(), 1000);
              };
            } else {
              toast.error("Popup blocked! Enable popups to print.");
            }
          }

          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2000);
        };
      }
    } catch (err) {
      console.error("Print error:", err);
      toast.error("Failed to print test receipt");
    } finally {
      setTimeout(() => setIsPrinting(false), 1000);
    }
  }, [config]);

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: "config", label: "Configuration", icon: <Settings2 className="w-4 h-4" /> },
    { id: "calibrate", label: "Calibration", icon: <Ruler className="w-4 h-4" /> },
    { id: "preview", label: "Preview", icon: <Eye className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Printer className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Print Test Lab</h1>
            <p className="text-sm text-muted-foreground">
              Configure, calibrate, and test your thermal printer
            </p>
          </div>
        </div>
        <Button
          onClick={handlePrintTestReceipt}
          disabled={isPrinting}
          className="gap-2"
          size="lg"
        >
          <FileText className="w-4 h-4" />
          {isPrinting ? "Printing..." : "Print Test Receipt"}
        </Button>
      </div>

      {/* Status Bar */}
      <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="font-medium">
            Template: {config.printerType === "custom"
              ? `Custom (${config.customWidth || 80}mm × ${config.customHeight || 50}mm)`
              : config.printerType}
          </span>
        </div>
        <div className="text-muted-foreground">|</div>
        <div className="text-muted-foreground">
          Offsets: ↓{config.offsetTop}mm →{config.offsetLeft}mm
        </div>
        {config.printerName && (
          <>
            <div className="text-muted-foreground">|</div>
            <div className="text-muted-foreground">
              Printer: {config.printerName}
            </div>
          </>
        )}
        <div className="text-muted-foreground">|</div>
        <div className={config.useNativePrint ? "text-primary font-medium" : "text-muted-foreground"}>
          {config.useNativePrint ? "Native ✓" : "Browser Print"}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted/50 border border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Active Tab Content */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          {activeTab === "config" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold">Printer Settings</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleSave();
                    toast.success("Configuration saved");
                  }}
                  className="gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Save
                </Button>
              </div>
              <PrinterConfigPanel config={config} onChange={setConfig} />
            </div>
          )}
          {activeTab === "calibrate" && (
            <div>
              <h2 className="text-base font-semibold mb-4">Calibration</h2>
              <CalibrationPanel
                config={config}
                onChange={setConfig}
                onSave={handleSave}
              />
            </div>
          )}
          {activeTab === "preview" && (
            <div className="lg:hidden">
              <ReceiptPreview config={config} />
            </div>
          )}
          {activeTab === "preview" && (
            <div className="hidden lg:block">
              <h2 className="text-base font-semibold mb-4">Template Details</h2>
              <div className="space-y-4 text-sm">
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paper Width:</span>
                    <span className="font-mono font-medium">{getEffectiveWidth(config)}mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Page Size CSS:</span>
                    <span className="font-mono text-xs">
                      @page {"{"} size: {getEffectiveWidth(config)}mm auto {"}"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Margin:</span>
                    <span className="font-mono">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Font:</span>
                    <span className="font-mono text-xs">Courier New (monospace)</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200">
                  <p className="text-xs">
                    <strong>Tip:</strong> In the browser print dialog, make sure &quot;Scale&quot;
                    is set to 100% and margins are set to &quot;None&quot; for
                    accurate output. The templates are designed to handle this
                    automatically with CSS, but some browsers may override it.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Always show preview on desktop */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm hidden lg:block">
          <ReceiptPreview config={config} />
        </div>
      </div>
    </div>
  );
}
