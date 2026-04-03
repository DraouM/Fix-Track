"use client";

import React from "react";
import { PrinterConfig } from "@/types/settings";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { getEffectiveWidth } from "@/lib/printerConfig";
import { renderCalibrationPage } from "@/lib/thermalTemplates";
import { Ruler, Save, Printer } from "lucide-react";

interface CalibrationPanelProps {
  config: PrinterConfig;
  onChange: (config: PrinterConfig) => void;
  onSave: () => void;
}

export function CalibrationPanel({ config, onChange, onSave }: CalibrationPanelProps) {
  const update = (patch: Partial<PrinterConfig>) => {
    onChange({ ...config, ...patch });
  };

  const handlePrintCalibration = () => {
    try {
      const width = getEffectiveWidth(config);
      const html = renderCalibrationPage(width, {
        offsetTop: config.offsetTop,
        offsetLeft: config.offsetLeft,
      });

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
            toast.success("Calibration page sent to printer");
          } catch (err) {
            console.error("Calibration print failed:", err);
            toast.error("Failed to print calibration page");
          }

          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2000);
        };
      }
    } catch (err) {
      console.error("Calibration error:", err);
      toast.error("Failed to generate calibration page");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1">
        <Ruler className="w-4 h-4" />
        <span>Alignment Calibration</span>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-5">
        {/* Top Offset */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="text-xs">Top Offset</Label>
            <span className="text-xs font-mono text-muted-foreground">
              {config.offsetTop.toFixed(1)}mm
            </span>
          </div>
          <Slider
            value={[config.offsetTop]}
            min={-5}
            max={10}
            step={0.5}
            onValueChange={([val]) => update({ offsetTop: val })}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>-5mm</span>
            <span>0</span>
            <span>+10mm</span>
          </div>
        </div>

        {/* Left Offset */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="text-xs">Left Offset</Label>
            <span className="text-xs font-mono text-muted-foreground">
              {config.offsetLeft.toFixed(1)}mm
            </span>
          </div>
          <Slider
            value={[config.offsetLeft]}
            min={-5}
            max={10}
            step={0.5}
            onValueChange={([val]) => update({ offsetLeft: val })}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>-5mm</span>
            <span>0</span>
            <span>+10mm</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrintCalibration}
          className="flex-1 gap-2"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Calibration Page
        </Button>
        <Button
          size="sm"
          onClick={() => {
            onSave();
            toast.success("Calibration saved");
          }}
          className="flex-1 gap-2"
        >
          <Save className="w-3.5 h-3.5" />
          Save Settings
        </Button>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Print the calibration page and measure the rulers with a physical ruler.
        If they don&apos;t match, adjust the offsets above. A positive value
        shifts content down/right; negative shifts up/left.
      </p>
    </div>
  );
}
