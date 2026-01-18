"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/context/SettingsContext";
import { RECEIPT_WIDTH_PRESETS, STICKER_PRESETS } from "@/types/settings";
import { Printer, FileText } from "lucide-react";
import { toast } from "sonner";
import { validatePrintDimensions } from "@/lib/settings";
import { useTranslation } from "react-i18next";

export function PrintDimensionsCard() {
  const { settings, updateSettings } = useSettings();
  const { t } = useTranslation();

  const [receiptWidth, setReceiptWidth] = useState(
    settings.printDimensions.receipt.width
  );
  const [stickerWidth, setStickerWidth] = useState(
    settings.printDimensions.sticker.width
  );
  const [stickerHeight, setStickerHeight] = useState(
    settings.printDimensions.sticker.height
  );

  const handleReceiptWidthChange = (width: number) => {
    if (validatePrintDimensions(width)) {
      setReceiptWidth(width);
      updateSettings({
        printDimensions: {
          ...settings.printDimensions,
          receipt: { width, unit: "mm" },
        },
      });
      toast.success(`Receipt width updated to ${width}mm`);
    } else {
      toast.error("Invalid width. Must be between 1-300mm");
    }
  };

  const handleStickerDimensionsChange = (width: number, height: number) => {
    if (validatePrintDimensions(width, height)) {
      setStickerWidth(width);
      setStickerHeight(height);
      updateSettings({
        printDimensions: {
          ...settings.printDimensions,
          sticker: { width, height, unit: "mm" },
        },
      });
      toast.success(`Sticker dimensions updated to ${width}mm × ${height}mm`);
    } else {
      toast.error("Invalid dimensions. Must be between 1-300mm");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.print.title")}</CardTitle>
        <CardDescription>
          {t("settings.print.description") ||
            "Configure thermal printer dimensions for receipts and stickers"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Receipt Width */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-500" />
            {t("settings.print.receipt")} {t("settings.print.width")} (mm)
          </Label>
          <div className="flex gap-2">
            {RECEIPT_WIDTH_PRESETS.map((preset) => (
              <Button
                key={preset.value}
                variant={receiptWidth === preset.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleReceiptWidthChange(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={receiptWidth}
              onChange={(e) => setReceiptWidth(Number(e.target.value))}
              onBlur={(e) => handleReceiptWidthChange(Number(e.target.value))}
              min={1}
              max={300}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">mm</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("settings.print.receipt.note") ||
              "Standard thermal receipt printers use 58mm or 80mm paper width"}
          </p>
        </div>

        {/* Sticker Dimensions */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Printer className="h-4 w-4 text-orange-500" />
            {t("settings.print.sticker")} {t("settings.print.dimensions") || "Dimensions"} (mm)
          </Label>
          <div className="flex flex-wrap gap-2">
            {STICKER_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant={
                  stickerWidth === preset.width &&
                  stickerHeight === preset.height
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() =>
                  handleStickerDimensionsChange(preset.width, preset.height)
                }
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="sticker-width"
                className="text-sm whitespace-nowrap"
              >
                {t("settings.print.width")}:
              </Label>
              <Input
                id="sticker-width"
                type="number"
                value={stickerWidth}
                onChange={(e) => setStickerWidth(Number(e.target.value))}
                onBlur={(e) =>
                  handleStickerDimensionsChange(
                    Number(e.target.value),
                    stickerHeight
                  )
                }
                min={1}
                max={300}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">mm</span>
            </div>
            <span className="text-muted-foreground">×</span>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="sticker-height"
                className="text-sm whitespace-nowrap"
              >
                {t("settings.print.height")}:
              </Label>
              <Input
                id="sticker-height"
                type="number"
                value={stickerHeight}
                onChange={(e) => setStickerHeight(Number(e.target.value))}
                onBlur={(e) =>
                  handleStickerDimensionsChange(
                    stickerWidth,
                    Number(e.target.value)
                  )
                }
                min={1}
                max={300}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">mm</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("settings.print.sticker.note") ||
              'Common sticker sizes: 2" × 1" (50.8mm × 25.4mm) or 4" × 6" (101.6mm × 152.4mm)'}
          </p>
        </div>

        {/* Current Settings Display */}
        <div className="p-4 border rounded-lg bg-muted/30">
          <h4 className="text-sm font-semibold mb-2">
            {t("settings.current") || "Current Settings"}
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("settings.print.receipt")} {t("settings.print.width")}:
              </span>
              <span className="font-mono font-medium">{receiptWidth}mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("settings.print.sticker")} {t("settings.print.size") || "Size"}:
              </span>
              <span className="font-mono font-medium">
                {stickerWidth}mm × {stickerHeight}mm
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
