"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/context/SettingsContext";
import { Currency, Language, CURRENCY_SYMBOLS, LANGUAGE_NAMES } from "@/types/settings";
import { Globe, DollarSign } from "lucide-react";

export function LanguageCurrencyCard() {
  const { settings, updateSettings } = useSettings();

  const handleLanguageChange = (value: string) => {
    updateSettings({ language: value as Language });
  };

  const handleCurrencyChange = (value: string) => {
    updateSettings({ currency: value as Currency });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Language & Currency</CardTitle>
        <CardDescription>
          Set your preferred language and currency for the application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Language Selection */}
        <div className="space-y-2">
          <Label htmlFor="language" className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-500" />
            Language
          </Label>
          <Select value={settings.language} onValueChange={handleLanguageChange}>
            <SelectTrigger id="language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">🇬🇧 {LANGUAGE_NAMES.en}</SelectItem>
              <SelectItem value="fr">🇫🇷 {LANGUAGE_NAMES.fr}</SelectItem>
              <SelectItem value="ar">🇲🇦 {LANGUAGE_NAMES.ar}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Note: Full translation support coming soon. Currently affects UI labels only.
          </p>
        </div>

        {/* Currency Selection */}
        <div className="space-y-2">
          <Label htmlFor="currency" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            Currency
          </Label>
          <Select value={settings.currency} onValueChange={handleCurrencyChange}>
            <SelectTrigger id="currency">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">
                {CURRENCY_SYMBOLS.USD} USD - US Dollar
              </SelectItem>
              <SelectItem value="EUR">
                {CURRENCY_SYMBOLS.EUR} EUR - Euro
              </SelectItem>
              <SelectItem value="GBP">
                {CURRENCY_SYMBOLS.GBP} GBP - British Pound
              </SelectItem>
              <SelectItem value="MAD">
                {CURRENCY_SYMBOLS.MAD} MAD - Moroccan Dirham
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Currency symbol will appear in column headers (e.g., "Cost ({CURRENCY_SYMBOLS[settings.currency]})")
          </p>
        </div>

        {/* Preview */}
        <div className="p-4 border rounded-lg bg-muted/30">
          <h4 className="text-sm font-semibold mb-2">Format Preview</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sample Price:</span>
              <span className="font-mono font-medium">
                {CURRENCY_SYMBOLS[settings.currency]}129.99
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Column Header:</span>
              <span className="font-medium">
                Cost ({CURRENCY_SYMBOLS[settings.currency]})
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
