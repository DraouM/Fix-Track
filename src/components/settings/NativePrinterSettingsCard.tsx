"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/context/SettingsContext";
import { Printer, RefreshCw, Receipt, Tag } from "lucide-react";
import { useTranslation } from "react-i18next";

export function NativePrinterSettingsCard() {
  const { settings, updateSettings, availablePrinters, refreshPrinters } = useSettings();
  const { t } = useTranslation();

  const handleToggleNative = (checked: boolean) => {
    updateSettings({
      printerConfig: {
        ...settings.printerConfig,
        useNativePrint: checked,
      },
    });
  };

  const handlePrinterChange = (type: "receipt" | "sticker", name: string) => {
    updateSettings({
      printerConfig: {
        ...settings.printerConfig,
        [type === "receipt" ? "receiptPrinterName" : "stickerPrinterName"]: name,
      },
    });
  };

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              Native Thermal Printing
            </CardTitle>
            <CardDescription>
              Configure direct OS printing for Xprinter and other thermal devices.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="native-print" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Enable
            </Label>
            <Switch
              id="native-print"
              checked={settings.printerConfig.useNativePrint}
              onCheckedChange={handleToggleNative}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Receipt Printer */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Receipt className="h-4 w-4 text-blue-500" />
              Receipt Printer (USB/Thermal)
            </Label>
            <Select
              value={settings.printerConfig.receiptPrinterName || ""}
              onValueChange={(val) => handlePrinterChange("receipt", val)}
              disabled={!settings.printerConfig.useNativePrint}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select default printer..." />
              </SelectTrigger>
              <SelectContent>
                {availablePrinters.map((printer) => (
                  <SelectItem key={printer} value={printer}>
                    {printer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
              Used for repair receipts, invoices, and payment proof.
            </p>
          </div>

          {/* Sticker Printer */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Tag className="h-4 w-4 text-orange-500" />
              Sticker Printer (XP-365B/Label)
            </Label>
            <Select
              value={settings.printerConfig.stickerPrinterName || ""}
              onValueChange={(val) => handlePrinterChange("sticker", val)}
              disabled={!settings.printerConfig.useNativePrint}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select default printer..." />
              </SelectTrigger>
              <SelectContent>
                {availablePrinters.map((printer) => (
                  <SelectItem key={printer} value={printer}>
                    {printer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
              Used for device identification labels and barcodes.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshPrinters}
            className="text-xs text-muted-foreground hover:text-primary"
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Refresh Printer List
          </Button>
          {!settings.printerConfig.useNativePrint && (
            <p className="text-xs text-amber-600 font-medium">
              * Using browser-based printing (requires confirmation)
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
