"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
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
  };
}

export function InventoryForm({
  itemToEdit,
  onSuccess,
}: {
  itemToEdit: InventoryItem | null;
  onSuccess: () => void;
}) {
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
      } else {
        await addInventoryItem(values);
      }
      form.reset(sanitizeItem(null)); // reset form
      onSuccess(); // let parent close dialog
    } catch (err) {
      console.error("Form submit error:", err);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Item name */}
        <FormField
          control={form.control}
          name="itemName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                Product Name
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g. iPhone 13 Pro Screen" 
                  className="h-10 rounded-xl border-2 border-gray-100 bg-white font-bold text-xs focus-visible:ring-primary/20 transition-all placeholder:font-medium"
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
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 mb-1">
                  Brand
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "h-10 rounded-xl border-2 border-gray-100 bg-white font-bold text-xs justify-between hover:bg-gray-50",
                          !field.value && "text-muted-foreground font-medium"
                        )}
                      >
                        {field.value || "Select brand"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[240px] p-2 rounded-2xl border-none shadow-2xl">
                    <Command className="rounded-xl">
                      <CommandInput placeholder="Search brand..." className="h-9 font-bold text-xs" />
                      <CommandEmpty className="text-xs font-bold py-4 text-center opacity-40">No brand found.</CommandEmpty>
                      <CommandGroup className="max-h-[160px] overflow-auto">
                        {PHONE_BRANDS.map((brand) => (
                          <CommandItem
                            key={brand}
                            value={brand}
                            onSelect={() =>
                              form.setValue("phoneBrand", brand as PhoneBrand)
                            }
                            className="rounded-lg font-bold text-xs uppercase tracking-wider py-1.5"
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
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 mb-1">
                  Category
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "h-10 rounded-xl border-2 border-gray-100 bg-white font-bold text-xs justify-between hover:bg-gray-50",
                          !field.value && "text-muted-foreground font-medium"
                        )}
                      >
                        {field.value || "Select type"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[240px] p-2 rounded-2xl border-none shadow-2xl">
                    <Command className="rounded-xl">
                      <CommandInput placeholder="Search type..." className="h-9 font-bold text-xs" />
                      <CommandEmpty className="text-xs font-bold py-4 text-center opacity-40">No type found.</CommandEmpty>
                      <CommandGroup className="max-h-[160px] overflow-auto">
                        {ITEM_TYPES.map((type) => (
                          <CommandItem
                            key={type}
                            value={type}
                            onSelect={() =>
                              form.setValue("itemType", type as ItemType)
                            }
                            className="rounded-lg font-bold text-xs uppercase tracking-wider py-1.5"
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
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-2xl border border-gray-100/50">
          <FormField
            control={form.control}
            name="buyingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                  Cost Price ($)
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    className="h-10 rounded-xl border-2 border-gray-100 bg-white font-black text-sm focus-visible:ring-primary/20 transition-all"
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
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                  Selling Price ($)
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    className="h-10 rounded-xl border-2 border-gray-100 bg-white font-black text-sm text-primary focus-visible:ring-primary/20 transition-all"
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
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                  Quantity
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    className="h-10 rounded-xl border-2 border-gray-100 bg-white font-black text-sm focus-visible:ring-primary/20 transition-all"
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
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                  Alert At
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    className="h-10 rounded-xl border-2 border-gray-100 bg-white font-black text-sm text-orange-600 focus-visible:ring-primary/20 transition-all"
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
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                Supplier & Notes
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Shenzhen Electronics"
                  className="h-10 rounded-xl border-2 border-gray-100 bg-white font-bold text-xs focus-visible:ring-primary/20 transition-all placeholder:font-medium"
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
            {itemToEdit ? "Update Item" : "Create Item"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
