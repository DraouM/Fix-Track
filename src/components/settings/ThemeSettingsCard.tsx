"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSettings } from "@/context/SettingsContext";
import { ThemeMode } from "@/types/settings";
import { Moon, Sun } from "lucide-react";

export function ThemeSettingsCard() {
  const { settings, updateSettings } = useSettings();

  const handleThemeChange = (value: string) => {
    updateSettings({ theme: value as ThemeMode });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
        <CardDescription>Customize the appearance of the application</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={settings.theme} onValueChange={handleThemeChange}>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 flex-1">
              <RadioGroupItem value="light" id="light" />
              <Label
                htmlFor="light"
                className="flex items-center gap-2 cursor-pointer flex-1 p-4 border rounded-lg hover:bg-accent"
              >
                <Sun className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="font-medium">Light Mode</div>
                  <div className="text-sm text-muted-foreground">
                    Bright and clean interface
                  </div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 flex-1">
              <RadioGroupItem value="dark" id="dark" />
              <Label
                htmlFor="dark"
                className="flex items-center gap-2 cursor-pointer flex-1 p-4 border rounded-lg hover:bg-accent"
              >
                <Moon className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-medium">Dark Mode</div>
                  <div className="text-sm text-muted-foreground">
                    Easy on the eyes
                  </div>
                </div>
              </Label>
            </div>
          </div>
        </RadioGroup>

        {/* Theme Preview */}
        <div className="mt-6 p-4 border rounded-lg bg-muted/30">
          <h4 className="text-sm font-semibold mb-3">Preview</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-8 rounded bg-background border"></div>
            <div className="h-8 rounded bg-primary"></div>
            <div className="h-8 rounded bg-secondary"></div>
            <div className="h-8 rounded bg-accent"></div>
            <div className="h-8 rounded bg-muted"></div>
            <div className="h-8 rounded bg-card border"></div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Current theme: <span className="font-medium capitalize">{settings.theme}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
