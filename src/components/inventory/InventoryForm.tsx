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
import { Check, ChevronsUpDown } from "lucide-react";
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
  const { printSticker } = usePrintUtils();
  const { addInventoryItem, updateInventoryItem } = useInventoryActions();

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryItemSchema) as any, // 👈 force resolver type match
    defaultValues: sanitizeItem(itemToEdit),
  });

  // 🔄 Reset when editing item changes
  useEffect(() => {
    form.reset(sanitizeItem(itemToEdit));
  }, [itemToEdit, form]);

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
          printSticker(updatedItem);
        }
      } else {
        // Print sticker if barcode exists
        if (values.barcode) {
          printSticker({
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Barcode */}
        <FormField
          control={form.control}
          name="barcode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 opacity-60 ml-1">
                {t('inventory.form.barcode')}
              </FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder={t('inventory.form.barcodePlaceholder')}
                    className="h-10 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs focus-visible:ring-primary/20 transition-all placeholder:font-medium dark:text-slate-100"
                    {...field}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 px-3 rounded-xl border-2 dark:border-slate-700 dark:bg-slate-900 font-bold text-[10px] uppercase dark:text-slate-300 dark:hover:bg-slate-800"
                  onClick={() => form.setValue("barcode", generateBarcode())}
                >
                  {t('inventory.form.generate')}
                </Button>
              </div>
              <FormMessage className="font-bold text-[9px] uppercase tracking-wider ml-1" />
            </FormItem>
          )}
        />

        {/* Item name */}
        <FormField
          control={form.control}
          name="itemName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 opacity-60 ml-1">
                {t('inventory.form.productName')}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t('inventory.form.productNamePlaceholder')}
                  className="h-10 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs focus-visible:ring-primary/20 transition-all placeholder:font-medium dark:text-slate-100"
                  {...field}
                />
              </FormControl>
              <FormMessage className="font-bold text-[9px] uppercase tracking-wider ml-1" />
            </FormItem>
          )}
        />

        {/* Brand and Type */}
        <div className="grid grid-cols-2 gap-4">
          {/* Phone brand */}
          <FormField
            control={form.control}
            name="phoneBrand"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 opacity-60 ml-1 mb-1">
                  {t('inventory.form.brand')}
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "h-10 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs justify-between hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-slate-200",
                          !field.value && "text-muted-foreground font-medium"
                        )}
                      >
                        {field.value || t('inventory.form.selectBrand')}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[240px] p-2 rounded-2xl border dark:border-slate-800 shadow-2xl dark:bg-slate-900">
                    <Command className="rounded-xl dark:bg-slate-900">
                      <CommandInput
                        placeholder={t('inventory.form.searchBrand')}
                        className="h-9 font-bold text-xs dark:text-slate-100"
                      />
                      <CommandEmpty className="text-xs font-bold py-4 text-center opacity-40 dark:text-slate-500">
                        {t('inventory.form.noBrand')}
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
                                "mr-3 h-3.5 w-3.5 text-primary",
                                field.value === brand
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {brand}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage className="font-bold text-[9px] uppercase tracking-wider ml-1" />
              </FormItem>
            )}
          />

          {/* Item type */}
          <FormField
            control={form.control}
            name="itemType"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 opacity-60 ml-1 mb-1">
                  {t('inventory.form.category')}
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "h-10 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs justify-between hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-slate-200",
                          !field.value && "text-muted-foreground font-medium"
                        )}
                      >
                        {field.value || t('inventory.form.selectType')}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[240px] p-2 rounded-2xl border dark:border-slate-800 shadow-2xl dark:bg-slate-900">
                    <Command className="rounded-xl dark:bg-slate-900">
                      <CommandInput
                        placeholder={t('inventory.form.searchType')}
                        className="h-9 font-bold text-xs dark:text-slate-100"
                      />
                      <CommandEmpty className="text-xs font-bold py-4 text-center opacity-40 dark:text-slate-500">
                        {t('inventory.form.noType')}
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
                                "mr-3 h-3.5 w-3.5 text-primary",
                                field.value === type
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {type}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage className="font-bold text-[9px] uppercase tracking-wider ml-1" />
              </FormItem>
            )}
          />
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 dark:bg-slate-800/20 rounded-2xl border border-gray-100/50 dark:border-slate-800/80">
          <FormField
            control={form.control}
            name="buyingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 opacity-60 ml-1">
                  {t('inventory.form.costPrice', { symbol: '$' })}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    className="h-10 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-sm focus-visible:ring-primary/20 transition-all dark:text-slate-100"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="font-bold text-[9px] uppercase tracking-wider ml-1" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sellingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 opacity-60 ml-1">
                  {t('inventory.form.sellingPrice', { symbol: '$' })}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    className="h-10 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-sm text-primary dark:text-primary focus-visible:ring-primary/20 transition-all"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="font-bold text-[9px] uppercase tracking-wider ml-1" />
              </FormItem>
            )}
          />
        </div>

        {/* Quantity & Threshold */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantityInStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 opacity-60 ml-1">
                  {t('inventory.form.quantity')}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    className="h-10 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-sm focus-visible:ring-primary/20 transition-all dark:text-slate-100"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="font-bold text-[9px] uppercase tracking-wider ml-1" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lowStockThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 opacity-60 ml-1">
                  {t('inventory.form.alertAt')}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    className="h-10 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-sm text-orange-600 dark:text-orange-400 focus-visible:ring-primary/20 transition-all"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="font-bold text-[9px] uppercase tracking-wider ml-1" />
              </FormItem>
            )}
          />
        </div>

        {/* Supplier */}
        <FormField
          control={form.control}
          name="supplierInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 opacity-60 ml-1">
                {t('inventory.form.supplierNotes')}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t('inventory.form.supplierPlaceholder')}
                  className="h-10 rounded-xl border-2 border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs focus-visible:ring-primary/20 transition-all placeholder:font-medium dark:text-slate-100"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage className="font-bold text-[9px] uppercase tracking-wider ml-1" />
            </FormItem>
          )}
        />

        <div className="pt-2">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-full h-11 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
          >
            {itemToEdit ? t('inventory.form.update') : t('inventory.form.create')}
          </Button>
        </div>
      </form>


    </Form>
  );
}
