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
import { PrinterConfig } from "@/types/settings";
import { Input } from "../ui/input";

export function NativePrinterSettingsCard() {
  const { settings, updateSettings, availablePrinters, refreshPrinters } = useSettings();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const config = settings.printerConfig;

  const update = (patch: Partial<PrinterConfig>) => {
    updateSettings({
      printerConfig: { ...config, ...patch },
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshPrinters();
    setIsRefreshing(false);
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
              Direct hardware communication for receipts (ESC/POS) and stickers (TSPL).
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="native-print" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Enable
            </Label>
            <Switch
              id="native-print"
              checked={config.useNativePrint}
              onCheckedChange={(checked) => update({ useNativePrint: checked })}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Receipt Printer Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <Receipt className="h-4 w-4 text-blue-500" />
                Receipt Printer
              </Label>
              <div className="flex bg-muted p-0.5 rounded-md text-[10px]">
                <button
                  onClick={() => update({ receiptConnectionType: "usb" })}
                  className={`px-2 py-1 rounded-sm transition-all ${config.receiptConnectionType === "usb" ? "bg-background shadow-sm font-bold" : "text-muted-foreground"}`}
                >
                  USB
                </button>
                <button
                  onClick={() => update({ receiptConnectionType: "tcp" })}
                  className={`px-2 py-1 rounded-sm transition-all ${config.receiptConnectionType === "tcp" ? "bg-background shadow-sm font-bold" : "text-muted-foreground"}`}
                >
                  TCP
                </button>
              </div>
            </div>

            {config.receiptConnectionType === "usb" ? (
              <div className="space-y-2">
                <Select
                  value={config.receiptPrinterName || ""}
                  onValueChange={(val) => update({ receiptPrinterName: val })}
                  disabled={!config.useNativePrint}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select receipt printer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePrinters.length > 0 ? (
                      availablePrinters.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No devices found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="IP (e.g. 192.168.1.100)"
                  value={config.receiptPrinterIp || ""}
                  onChange={(e) => update({ receiptPrinterIp: e.target.value })}
                  disabled={!config.useNativePrint}
                  className="text-xs"
                />
                <Input
                  type="number"
                  placeholder="Port"
                  value={config.receiptPrinterPort || 9100}
                  onChange={(e) => update({ receiptPrinterPort: parseInt(e.target.value) })}
                  disabled={!config.useNativePrint}
                  className="w-24 text-xs"
                />
              </div>
            )}
          </div>

          {/* Sticker Printer Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <Tag className="h-4 w-4 text-orange-500" />
                Sticker Printer
              </Label>
              <div className="flex bg-muted p-0.5 rounded-md text-[10px]">
                <button
                  onClick={() => update({ stickerConnectionType: "usb" })}
                  className={`px-2 py-1 rounded-sm transition-all ${config.stickerConnectionType === "usb" ? "bg-background shadow-sm font-bold" : "text-muted-foreground"}`}
                >
                  USB
                </button>
                <button
                  onClick={() => update({ stickerConnectionType: "tcp" })}
                  className={`px-2 py-1 rounded-sm transition-all ${config.stickerConnectionType === "tcp" ? "bg-background shadow-sm font-bold" : "text-muted-foreground"}`}
                >
                  TCP
                </button>
              </div>
            </div>

            {config.stickerConnectionType === "usb" ? (
              <div className="space-y-2">
                <Select
                  value={config.stickerPrinterName || ""}
                  onValueChange={(val) => update({ stickerPrinterName: val })}
                  disabled={!config.useNativePrint}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sticker printer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePrinters.length > 0 ? (
                      availablePrinters.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No devices found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="IP (e.g. 192.168.1.101)"
                  value={config.stickerPrinterIp || ""}
                  onChange={(e) => update({ stickerPrinterIp: e.target.value })}
                  disabled={!config.useNativePrint}
                  className="text-xs"
                />
                <Input
                  type="number"
                  placeholder="Port"
                  value={config.stickerPrinterPort || 9100}
                  onChange={(e) => update({ stickerPrinterPort: parseInt(e.target.value) })}
                  disabled={!config.useNativePrint}
                  className="w-24 text-xs"
                />
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing || !config.useNativePrint}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              <RefreshCw className={`mr-2 h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? "Discovering..." : "Refresh Printer List"}
            </Button>
            {!config.useNativePrint && (
              <p className="text-xs text-amber-600 font-medium">
                * Native printing is disabled
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={!config.useNativePrint || !config.receiptPrinterName}
              onClick={async () => {
                try {
                  const { invoke } = await import('@tauri-apps/api/core');
                  await invoke('print_receipt_direct', { 
                    config, 
                    data: {
                      orderId: "TEST-001",
                      customer: "Settings Test",
                      items: [{ name: "Test Receipt Item", qty: 1, price: 10.00 }],
                      total: 10.00
                    }
                  });
                  import('sonner').then(({ toast }) => toast.success("Test receipt sent!"));
                } catch (err) {
                  import('sonner').then(({ toast }) => toast.error(`Test failed: ${err}`));
                }
              }}
              className="h-9 text-[10px] font-black uppercase tracking-widest border-blue-200 hover:bg-blue-50 dark:border-blue-900/30 dark:hover:bg-blue-950/30"
            >
              <Receipt className="mr-2 h-3 w-3 text-blue-500" />
              Test Receipt
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={!config.useNativePrint || !config.stickerPrinterName}
              onClick={async () => {
                try {
                  const { invoke } = await import('@tauri-apps/api/core');
                  await invoke('print_sticker_direct', {
                    config,
                    data: {
                      barcode: "1234567890",
                      item_name: "TEST STICKER",
                      price: 99.99
                    }
                  });
                  import('sonner').then(({ toast }) => toast.success("Test sticker sent!"));
                } catch (err) {
                  import('sonner').then(({ toast }) => toast.error(`Test failed: ${err}`));
                }
              }}
              className="h-9 text-[10px] font-black uppercase tracking-widest border-orange-200 hover:bg-orange-50 dark:border-orange-900/30 dark:hover:bg-orange-950/30"
            >
              <Tag className="mr-2 h-3 w-3 text-orange-500" />
              Test Sticker
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
