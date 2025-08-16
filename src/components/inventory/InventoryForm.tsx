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
import { inventoryItemSchema } from "@/types/inventory";
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
              <FormLabel>Item Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter item name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone brand */}
        <FormField
          control={form.control}
          name="phoneBrand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Brand</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {field.value || "Select brand"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search brand..." />
                    <CommandEmpty>No brand found.</CommandEmpty>
                    <CommandGroup>
                      {[
                        "All",
                        "Samsung",
                        "Apple",
                        "Huawei",
                        "Xiaomi",
                        "Other",
                      ].map((brand) => (
                        <CommandItem
                          key={brand}
                          value={brand}
                          onSelect={() =>
                            form.setValue("phoneBrand", brand as PhoneBrand)
                          }
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
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
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Item type */}
        <FormField
          control={form.control}
          name="itemType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Type</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {field.value || "Select type"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search type..." />
                    <CommandEmpty>No type found.</CommandEmpty>
                    <CommandGroup>
                      {[
                        "All",
                        "Screen",
                        "Battery",
                        "Charger",
                        "Case",
                        "Cable",
                        "Other",
                      ].map((type) => (
                        <CommandItem
                          key={type}
                          value={type}
                          onSelect={() =>
                            form.setValue("itemType", type as ItemType)
                          }
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value === type ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {type}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Prices */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="buyingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Buying Price</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sellingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Price</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
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
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lowStockThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Low Stock Threshold</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
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
              <FormLabel>Supplier Info</FormLabel>
              <FormControl>
                <Input
                  placeholder="Supplier name / contact"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {itemToEdit ? "Update Item" : "Add Item"}
        </Button>
      </form>
    </Form>
  );
}
