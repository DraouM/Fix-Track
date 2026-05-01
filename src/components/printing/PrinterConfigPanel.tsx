"use client";

import React, { useState } from "react";
import { PrinterConfig, PrinterType } from "@/types/settings";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/context/SettingsContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface PrinterConfigPanelProps {
  config: PrinterConfig;
  onChange: (config: PrinterConfig) => void;
}

const PRINTER_TYPES: { value: PrinterType; label: string; desc: string }[] = [
  { value: "58mm", label: "58mm (Compact)", desc: "Compact thermal printers" },
  { value: "80mm", label: "80mm (Standard)", desc: "Standard thermal printers" },
  { value: "custom", label: "Custom", desc: "Custom label / sticker size" },
];

export function PrinterConfigPanel({ config, onChange }: PrinterConfigPanelProps) {
  const { availablePrinters, refreshPrinters } = useSettings();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const update = (patch: Partial<PrinterConfig>) => {
    onChange({ ...config, ...patch });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshPrinters();
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Printer Type</h3>
        <div className="grid gap-2">
          {PRINTER_TYPES.map((pt) => (
            <button
              key={pt.value}
              onClick={() => update({ printerType: pt.value })}
              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                config.printerType === pt.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/30 hover:bg-muted/50"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  config.printerType === pt.value
                    ? "border-primary"
                    : "border-muted-foreground/40"
                }`}
              >
                {config.printerType === pt.value && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              <div>
                <div className="text-sm font-medium">{pt.label}</div>
                <div className="text-xs text-muted-foreground">{pt.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {config.printerType === "custom" && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Custom Dimensions
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="custom-width" className="text-xs">
                Width (mm)
              </Label>
              <Input
                id="custom-width"
                type="number"
                min={20}
                max={200}
                step={1}
                value={config.customWidth || 80}
                onChange={(e) =>
                  update({ customWidth: parseFloat(e.target.value) || 80 })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="custom-height" className="text-xs">
                Height (mm)
              </Label>
              <Input
                id="custom-height"
                type="number"
                min={10}
                max={300}
                step={1}
                value={config.customHeight || 50}
                onChange={(e) =>
                  update({ customHeight: parseFloat(e.target.value) || 50 })
                }
                className="mt-1"
              />
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border p-4 space-y-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2 mb-3">
          Receipt Printer Connection
        </h4>
        <div className="grid gap-3">
          <div>
            <Label className="text-xs">Connection Type</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 text-sm">
                <input 
                  type="radio" 
                  checked={config.receiptConnectionType === "usb"} 
                  onChange={() => update({ receiptConnectionType: "usb" })}
                  className="text-primary"
                />
                USB / OS Spooler
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input 
                  type="radio" 
                  checked={config.receiptConnectionType === "tcp"} 
                  onChange={() => update({ receiptConnectionType: "tcp" })}
                  className="text-primary"
                />
                Network (TCP)
              </label>
            </div>
          </div>
          
          {config.receiptConnectionType === "usb" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="receipt-printer-name" className="text-xs">
                  Printer Name
                </Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-[10px] gap-1"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <Select
                value={config.receiptPrinterName || ""}
                onValueChange={(value) => update({ receiptPrinterName: value })}
              >
                <SelectTrigger id="receipt-printer-name">
                  <SelectValue placeholder="Select a printer" />
                </SelectTrigger>
                <SelectContent>
                  {availablePrinters.length > 0 ? (
                    availablePrinters.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No printers found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Select from connected devices or system printers
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Label htmlFor="receipt-printer-ip" className="text-xs">IP Address</Label>
                <Input
                  id="receipt-printer-ip"
                  type="text"
                  placeholder="192.168.1.100"
                  value={config.receiptPrinterIp || ""}
                  onChange={(e) => update({ receiptPrinterIp: e.target.value || undefined })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="receipt-printer-port" className="text-xs">Port</Label>
                <Input
                  id="receipt-printer-port"
                  type="number"
                  value={config.receiptPrinterPort || 9100}
                  onChange={(e) => update({ receiptPrinterPort: parseInt(e.target.value) || 9100 })}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border p-4 space-y-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2 mb-3">
          Sticker Printer Connection
        </h4>
        <div className="grid gap-3">
          <div>
            <Label className="text-xs">Connection Type</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 text-sm">
                <input 
                  type="radio" 
                  checked={config.stickerConnectionType === "usb"} 
                  onChange={() => update({ stickerConnectionType: "usb" })}
                  className="text-primary"
                />
                USB / OS Spooler
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input 
                  type="radio" 
                  checked={config.stickerConnectionType === "tcp"} 
                  onChange={() => update({ stickerConnectionType: "tcp" })}
                  className="text-primary"
                />
                Network (TCP)
              </label>
            </div>
          </div>
          
          {config.stickerConnectionType === "usb" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="sticker-printer-name" className="text-xs">
                  Printer Name
                </Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-[10px] gap-1"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <Select
                value={config.stickerPrinterName || ""}
                onValueChange={(value) => update({ stickerPrinterName: value })}
              >
                <SelectTrigger id="sticker-printer-name">
                  <SelectValue placeholder="Select a printer" />
                </SelectTrigger>
                <SelectContent>
                  {availablePrinters.length > 0 ? (
                    availablePrinters.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No printers found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Label htmlFor="sticker-printer-ip" className="text-xs">IP Address</Label>
                <Input
                  id="sticker-printer-ip"
                  type="text"
                  placeholder="192.168.1.101"
                  value={config.stickerPrinterIp || ""}
                  onChange={(e) => update({ stickerPrinterIp: e.target.value || undefined })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sticker-printer-port" className="text-xs">Port</Label>
                <Input
                  id="sticker-printer-port"
                  type="number"
                  value={config.stickerPrinterPort || 9100}
                  onChange={(e) => update({ stickerPrinterPort: parseInt(e.target.value) || 9100 })}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-border">
          <div>
            <Label htmlFor="native-print" className="text-sm font-medium">
              Native Printing globally
            </Label>
            <p className="text-xs text-muted-foreground">
              Use Rust backend instead of browser print dialog
            </p>
          </div>
          <Switch
            id="native-print"
            checked={config.useNativePrint}
            onCheckedChange={(checked) => update({ useNativePrint: checked })}
          />
        </div>
      </div>
    </div>
  );
}
