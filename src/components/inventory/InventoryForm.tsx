"use client";

import React, { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Loader2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

import type {
  InventoryFormValues,
  InventoryItem,
  PhoneBrand,
  ItemType,
} from "@/types/inventory";
import {
  inventoryItemSchema,
  PHONE_BRANDS,
  ITEM_TYPES,
} from "@/types/inventory";
import { useInventoryActions } from "@/context/InventoryContext";
import { generateBarcode } from "@/lib/barcode";
import { usePrintUtils } from "@/hooks/usePrintUtils";
import { useSettings } from "@/context/SettingsContext";
import { CURRENCY_SYMBOLS } from "@/types/settings";
import { Icons } from "../icons";

// Utility: map InventoryItem → form defaults
function sanitizeItem(item: InventoryItem | null): InventoryFormValues {
  if (!item) {
    return {
      itemName: "",
      phoneBrand: "All",
      itemType: "Other",
      buyingPrice: 0,
      sellingPrice: 0,
      quantityInStock: 0,
      lowStockThreshold: 5,
      supplierInfo: "",
      barcode: "",
    };
  }
  return {
    itemName: item.itemName,
    phoneBrand: item.phoneBrand,
    itemType: item.itemType,
    buyingPrice: item.buyingPrice,
    sellingPrice: item.sellingPrice,
    quantityInStock: item.quantityInStock,
    lowStockThreshold: item.lowStockThreshold,
    supplierInfo: item.supplierInfo,
    barcode: item.barcode || "",
  };
}

export function InventoryForm({
  itemToEdit,
  onSuccess,
}: {
  itemToEdit: InventoryItem | null;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const { printBarcodeDirect } = usePrintUtils();
  const { settings } = useSettings();
  const currencySymbol = CURRENCY_SYMBOLS[settings.currency] || "$";
  const { addInventoryItem, updateInventoryItem } = useInventoryActions();

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryItemSchema) as any, // 👈 force resolver type match
    defaultValues: sanitizeItem(itemToEdit),
  });

  // 🔄 Reset when editing item changes
  useEffect(() => {
    form.reset(sanitizeItem(itemToEdit));
  }, [itemToEdit, form]);

  // Live margin preview between cost and selling price
  const buyingPrice = Number(form.watch("buyingPrice")) || 0;
  const sellingPrice = Number(form.watch("sellingPrice")) || 0;
  const margin = sellingPrice - buyingPrice;
  const marginPct = buyingPrice > 0 ? (margin / buyingPrice) * 100 : 0;
  const { isSubmitting } = form.formState;

  const onSubmit = async (values: InventoryFormValues) => {
    try {
      if (itemToEdit) {
        await updateInventoryItem(itemToEdit.id, values);

        // If the item has a barcode, print it directly
        if (values.barcode) {
          const updatedItem: InventoryItem = {
            id: itemToEdit.id,
            itemName: values.itemName,
            phoneBrand: values.phoneBrand,
            itemType: values.itemType,
            buyingPrice: values.buyingPrice,
            sellingPrice: values.sellingPrice,
            quantityInStock: values.quantityInStock,
            lowStockThreshold: values.lowStockThreshold,
            supplierInfo: values.supplierInfo || "",
            barcode: values.barcode,
            history: itemToEdit.history,
          };
          printBarcodeDirect(updatedItem);
        }
      } else {
        // Print sticker if barcode exists
        if (values.barcode) {
          printBarcodeDirect({
            id: uuidv4(),
            itemName: values.itemName,
            phoneBrand: values.phoneBrand,
            itemType: values.itemType,
            buyingPrice: values.buyingPrice,
            sellingPrice: values.sellingPrice,
            quantityInStock: values.quantityInStock,
            lowStockThreshold: values.lowStockThreshold,
            supplierInfo: values.supplierInfo || "",
            barcode: values.barcode,
            history: [],
          });
        }

        await addInventoryItem(values);
      }

      form.reset(sanitizeItem(null));
      onSuccess();
    } catch (err) {
      console.error("Form submit error:", err);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
        {/* Row 1: Identity & Barcode */}
        <div
          className="grid grid-cols-12 gap-3 animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards duration-500"
          style={{ animationDelay: "80ms" }}
        >
          <div className="col-span-9">
            <FormField
              control={form.control}
              name="itemName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ms-1">
                    {t("inventory.form.productName")}
                    <span className="text-red-500 ms-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("inventory.form.productNamePlaceholder")}
                      autoFocus={!itemToEdit}
                      aria-required="true"
                      className="h-9 rounded-xl border-2 border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-sm focus-visible:ring-primary/20 transition-all placeholder:font-medium dark:text-slate-100"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="font-bold text-[9px] uppercase tracking-wider ms-1" />
                </FormItem>
              )}
            />
          </div>
          <div className="col-span-3">
            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ms-1">
                    {t("inventory.form.barcode")}
                  </FormLabel>
                  <div className="relative group">
                    <FormControl>
                      <Input
                        placeholder={t("inventory.form.barcodePlaceholder")}
                        className="h-9 ps-3 pe-9 rounded-xl border-2 border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-black text-xs tracking-widest focus-visible:ring-primary/20 transition-all placeholder:font-medium placeholder:tracking-normal dark:text-slate-100"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute end-0.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-primary/10 text-primary transition-all active:scale-90"
                      onClick={() =>
                        form.setValue("barcode", generateBarcode())
                      }
                      title={t("inventory.form.generate")}
                      aria-label={t("inventory.form.generate")}
                    >
                      <Icons.sparkles className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage className="font-bold text-[9px] uppercase tracking-wider ms-1" />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Row 2: Categorization & Supplier */}
        <div
          className="grid grid-cols-12 gap-3 animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards duration-500"
          style={{ animationDelay: "160ms" }}
        >
          <FormField
            control={form.control}
            name="phoneBrand"
            render={({ field }) => (
              <FormItem className="col-span-4 flex flex-col">
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ms-1 mb-1">
                  {t("inventory.form.brand")}
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "h-9 w-full rounded-xl border-2 border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-xs justify-between hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-slate-200",
                          !field.value && "text-muted-foreground font-medium",
                        )}
                      >
                        {field.value || t("inventory.form.selectBrand")}
                        <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-40" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[240px] p-2 rounded-2xl border dark:border-slate-800 shadow-2xl dark:bg-slate-900">
                    <Command className="rounded-xl dark:bg-slate-900">
                      <CommandInput
                        placeholder={t("inventory.form.searchBrand")}
                        className="h-9 font-bold text-xs dark:text-slate-100"
                      />
                      <CommandEmpty className="text-xs font-bold py-4 text-center opacity-40 dark:text-slate-500">
                        {t("inventory.form.noBrand")}
                      </CommandEmpty>
                      <CommandGroup className="max-h-[160px] overflow-auto">
                        {PHONE_BRANDS.map((brand) => (
                          <CommandItem
                            key={brand}
                            value={brand}
                            onSelect={() =>
                              form.setValue("phoneBrand", brand as PhoneBrand)
                            }
                            className="rounded-lg font-bold text-xs uppercase tracking-wider py-1.5 focus:bg-primary/5 dark:focus:bg-slate-800"
                          >
                            <Check
                              className={cn(
                                "me-3 h-3.5 w-3.5 text-primary",
                                field.value === brand
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {brand}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage className="font-bold text-[9px] uppercase tracking-wider ms-1" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="itemType"
            render={({ field }) => (
              <FormItem className="col-span-4 flex flex-col">
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ms-1 mb-1">
                  {t("inventory.form.category")}
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "h-9 w-full rounded-xl border-2 border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-xs justify-between hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-slate-200",
                          !field.value && "text-muted-foreground font-medium",
                        )}
                      >
                        {field.value || t("inventory.form.selectType")}
                        <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-40" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[240px] p-2 rounded-2xl border dark:border-slate-800 shadow-2xl dark:bg-slate-900">
                    <Command className="rounded-xl dark:bg-slate-900">
                      <CommandInput
                        placeholder={t("inventory.form.searchType")}
                        className="h-9 font-bold text-xs dark:text-slate-100"
                      />
                      <CommandEmpty className="text-xs font-bold py-4 text-center opacity-40 dark:text-slate-500">
                        {t("inventory.form.noType")}
                      </CommandEmpty>
                      <CommandGroup className="max-h-[160px] overflow-auto">
                        {ITEM_TYPES.map((type) => (
                          <CommandItem
                            key={type}
                            value={type}
                            onSelect={() =>
                              form.setValue("itemType", type as ItemType)
                            }
                            className="rounded-lg font-bold text-xs uppercase tracking-wider py-1.5 focus:bg-primary/5 dark:focus:bg-slate-800"
                          >
                            <Check
                              className={cn(
                                "me-3 h-3.5 w-3.5 text-primary",
                                field.value === type
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {type}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage className="font-bold text-[9px] uppercase tracking-wider ms-1" />
              </FormItem>
            )}
          />

          <div className="col-span-4">
            <FormField
              control={form.control}
              name="supplierInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ms-1">
                    {t("inventory.form.supplierNotes")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("inventory.form.supplierPlaceholder")}
                      className="h-9 rounded-xl border-2 border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-xs focus-visible:ring-primary/20 transition-all placeholder:font-medium dark:text-slate-100"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage className="font-bold text-[9px] uppercase tracking-wider ms-1" />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Row 3: Financials & Stock Grid (Combined for compactness) */}
        <div
          className="grid grid-cols-4 gap-3 px-4 py-3 bg-muted/20 dark:bg-slate-800/20 rounded-2xl border border-gray-100/50 dark:border-slate-800/80 animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards duration-500"
          style={{ animationDelay: "240ms" }}
        >
          <FormField
            control={form.control}
            name="buyingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ms-1">
                  {t("inventory.form.costPrice", { symbol: currencySymbol })}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    className="h-9 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-sm tabular-nums focus-visible:ring-primary/20 transition-all dark:text-slate-100"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="font-bold text-[9px] uppercase tracking-wider ms-1" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sellingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ms-1">
                  {t("inventory.form.sellingPrice", { symbol: currencySymbol })}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    className="h-9 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-sm text-primary dark:text-primary tabular-nums focus-visible:ring-primary/20 transition-all"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="font-bold text-[9px] uppercase tracking-wider ms-1" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="quantityInStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ms-1">
                  {t("inventory.form.quantity")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    className="h-9 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-sm tabular-nums focus-visible:ring-primary/20 transition-all dark:text-slate-100"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="font-bold text-[9px] uppercase tracking-wider ms-1" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lowStockThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ms-1">
                  {t("inventory.form.alertAt")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    className="h-9 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-sm text-orange-600 dark:text-orange-400 tabular-nums focus-visible:ring-primary/20 transition-all"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="font-bold text-[9px] uppercase tracking-wider ms-1" />
              </FormItem>
            )}
          />
          {/* Live margin preview */}
          {(buyingPrice > 0 || sellingPrice > 0) && (
            <div className="col-span-4 flex items-center justify-end gap-1.5 text-[8px] font-black uppercase tracking-widest animate-in fade-in duration-300">
              <TrendingUp
                className={cn(
                  "h-3 w-3",
                  margin < 0 ? "text-red-500" : "text-emerald-600",
                )}
              />
              <span className="text-muted-foreground/50">
                {t("inventory.form.margin")}
              </span>
              <span
                className={cn(
                  "tabular-nums",
                  margin < 0 ? "text-red-500" : "text-emerald-600",
                )}
              >
                {margin.toFixed(2)}
                {buyingPrice > 0 && ` (${marginPct.toFixed(0)}%)`}
              </span>
            </div>
          )}
        </div>

        <div
          className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards duration-500"
          style={{ animationDelay: "320ms" }}
        >
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-10 rounded-2xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] group disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("common.processing")}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {itemToEdit
                  ? t("inventory.form.update")
                  : t("inventory.form.create")}
                <Icons.plusCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
              </span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
