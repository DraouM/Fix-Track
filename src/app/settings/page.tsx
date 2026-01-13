"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/context/SettingsContext";
import { ThemeSettingsCard } from "@/components/settings/ThemeSettingsCard";
import { LanguageCurrencyCard } from "@/components/settings/LanguageCurrencyCard";
import { PrintDimensionsCard } from "@/components/settings/PrintDimensionsCard";
import { Save, RotateCcw, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_SETTINGS } from "@/lib/settings";

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [hasChanges, setHasChanges] = useState(false);

  const handleReset = () => {
    resetSettings();
    setHasChanges(false);
    toast.success("Settings reset to defaults");
  };

  const handleSave = () => {
    // Settings are auto-saved via context, but we can show a confirmation
    toast.success("Settings saved successfully!");
    setHasChanges(false);
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <SettingsIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Customize your application preferences and configurations
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <ThemeSettingsCard />
          <LanguageCurrencyCard />
          <PrintDimensionsCard />
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button onClick={handleSave} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>

              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset to Defaults
              </Button>
            </CardContent>
          </Card>

          {/* Settings Info Card */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">About Settings</h3>
              <p className="text-sm text-muted-foreground mb-4">
                All settings are automatically saved to your browser's local storage
                and will persist across sessions.
              </p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="font-medium">Theme:</span>
                  <span>Changes apply instantly</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium">Currency:</span>
                  <span>Affects column headers only</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium">Print:</span>
                  <span>Updates receipt and sticker templates</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Settings Summary */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3 text-sm">Current Configuration</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Theme:</span>
                  <span className="font-medium capitalize">{settings.theme}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Language:</span>
                  <span className="font-medium uppercase">{settings.language}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency:</span>
                  <span className="font-medium">{settings.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receipt:</span>
                  <span className="font-medium">
                    {settings.printDimensions.receipt.width}mm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sticker:</span>
                  <span className="font-medium">
                    {settings.printDimensions.sticker.width}×
                    {settings.printDimensions.sticker.height}mm
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
