"use client";

import React from "react";
import { PrinterConfig, PrinterType } from "@/types/settings";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

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
  const update = (patch: Partial<PrinterConfig>) => {
    onChange({ ...config, ...patch });
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

      <div className="rounded-lg border border-border p-4 space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Printer Connection
        </h4>
        <div>
          <Label htmlFor="printer-name" className="text-xs">
            Printer Name (optional)
          </Label>
          <Input
            id="printer-name"
            type="text"
            placeholder="e.g., XP-58"
            value={config.printerName || ""}
            onChange={(e) => update({ printerName: e.target.value || undefined })}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            OS printer name for native printing via Rust backend
          </p>
        </div>
        <div className="flex items-center justify-between pt-1">
          <div>
            <Label htmlFor="native-print" className="text-sm font-medium">
              Native Printing
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
